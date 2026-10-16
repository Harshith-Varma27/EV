package com.evcharging.service;

import com.evcharging.model.*;
import com.evcharging.model.Booking.BookingStatus;
import com.evcharging.model.Waitlist.WaitlistStatus;
import com.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final WaitlistRepository waitlistRepository;
    private final ChargerRepository chargerRepository;
    private final StationRepository stationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> bookCharger(Long userId, Long chargerId, int durationMinutes,
                                           int batteryPercentage, LocalDateTime scheduledStart) {
        Charger charger = chargerRepository.findById(chargerId)
                .orElseThrow(() -> new RuntimeException("Charger not found"));

        if (charger.getStatus() == Charger.ChargerStatus.MAINTENANCE) {
            throw new RuntimeException("Charger is under maintenance");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime start = scheduledStart != null ? scheduledStart : LocalDateTime.now();
        // Round start to next 30-min block if in past
        if (start.isBefore(LocalDateTime.now())) {
            start = LocalDateTime.now().plusMinutes(5);
        }
        LocalDateTime end = start.plusMinutes(durationMinutes);

        // Check for overlapping bookings in the requested time window
        long overlaps = bookingRepository.countOverlappingBookings(chargerId, start, end);

        if (overlaps == 0) {
            // Charger is free for that window — book it
            Booking booking = Booking.builder()
                    .user(user)
                    .station(charger.getStation())
                    .charger(charger)
                    .durationMinutes(durationMinutes)
                    .batteryPercentage(batteryPercentage)
                    .startTime(start)
                    .endTime(end)
                    .status(BookingStatus.ACTIVE)
                    .build();
            bookingRepository.save(booking);

            notificationService.createNotification(user, null,
                    Notification.NotificationType.BOOKING_CONFIRMED,
                    "Booking Confirmed!",
                    "Charger " + charger.getChargerNumber() + " at " + charger.getStation().getName() +
                    " booked from " + start.toLocalTime().toString().substring(0,5) +
                    " to " + end.toLocalTime().toString().substring(0,5));

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("type", "BOOKED");
            res.put("bookingId", booking.getId());
            res.put("chargerNumber", charger.getChargerNumber());
            res.put("stationName", charger.getStation().getName());
            res.put("durationMinutes", durationMinutes);
            res.put("startTime", start.toString());
            res.put("endTime", end.toString());
            return res;

        } else {
            // Charger is taken — add to waitlist
            if (waitlistRepository.existsByChargerIdAndUserIdAndStatus(chargerId, userId, WaitlistStatus.WAITING)) {
                throw new RuntimeException("You are already in the waitlist for this charger");
            }

            Waitlist entry = Waitlist.builder()
                    .user(user)
                    .charger(charger)
                    .station(charger.getStation())
                    .batteryPercentage(batteryPercentage)
                    .priorityScore(100 - batteryPercentage)
                    .durationMinutes(durationMinutes)
                    .status(WaitlistStatus.WAITING)
                    .build();
            waitlistRepository.save(entry);

            long position = waitlistRepository.countAheadInQueue(chargerId, entry.getPriorityScore(), entry.getJoinedAt()) + 1;

            // Find next free slot after existing bookings
            Optional<Booking> conflicting = bookingRepository.findByChargerIdAndStatus(chargerId, BookingStatus.ACTIVE);
            long waitMins = conflicting.map(b -> java.time.Duration.between(LocalDateTime.now(), b.getEndTime()).toMinutes()).orElse((long) durationMinutes);

            notificationService.createNotification(user, null,
                    Notification.NotificationType.WAITLIST_JOINED,
                    "Added to Waitlist",
                    "You are #" + position + " in queue for charger " + charger.getChargerNumber() +
                    ". Priority score: " + entry.getPriorityScore());

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("type", "WAITLISTED");
            res.put("waitlistId", entry.getId());
            res.put("position", position);
            res.put("priorityScore", entry.getPriorityScore());
            res.put("estimatedWaitMinutes", Math.max(waitMins, 1));
            res.put("chargerNumber", charger.getChargerNumber());
            return res;
        }
    }

    @Transactional
    public void completeExpiredBookings() {
        List<Booking> expired = bookingRepository.findExpiredActiveBookings(LocalDateTime.now());
        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(booking);

            // Calculate energy used: kWh = (powerOutput × durationMinutes) / 60
            double powerOutput = booking.getCharger().getPowerOutput();
            double kWh = (powerOutput * booking.getDurationMinutes()) / 60.0;
            String kWhStr = String.format("%.1f", kWh);

            notificationService.createNotification(booking.getUser(), null,
                    Notification.NotificationType.CHARGING_COMPLETED,
                    "⚡ Charging Session Complete!",
                    "Your session at " + booking.getStation().getName() +
                    " (Charger: " + booking.getCharger().getChargerNumber() + ") is done.\n" +
                    "Duration: " + booking.getDurationMinutes() + " min | " +
                    "Energy Used: " + kWhStr + " kWh of clean energy ✅");

            notifyNextInWaitlist(booking.getCharger().getId());
        }
    }

    @Transactional
    public void notifyNextInWaitlist(Long chargerId) {
        List<Waitlist> queue = waitlistRepository
                .findByChargerIdAndStatusOrderByPriorityScoreDescJoinedAtAsc(chargerId, WaitlistStatus.WAITING);

        if (queue.isEmpty()) return;

        Waitlist next = queue.get(0);
        next.setStatus(WaitlistStatus.NOTIFIED);
        waitlistRepository.save(next);

        Charger charger = next.getCharger();
        notificationService.createNotification(next.getUser(), null,
                Notification.NotificationType.CHARGER_AVAILABLE,
                "Your Turn! Charger is Free",
                "Charger " + charger.getChargerNumber() + " at " + charger.getStation().getName() +
                " is now available for you. Please start charging within 5 minutes or your spot will be given to the next person.");
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not your booking");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        notificationService.createNotification(booking.getUser(), null,
                Notification.NotificationType.GENERAL,
                "Booking Cancelled",
                "Your booking for charger " + booking.getCharger().getChargerNumber() +
                " at " + booking.getStation().getName() +
                " (" + booking.getStartTime().toLocalTime().toString().substring(0,5) +
                " to " + booking.getEndTime().toLocalTime().toString().substring(0,5) +
                ") has been cancelled.");

        notifyNextInWaitlist(booking.getCharger().getId());
        return booking;
    }

    public List<Map<String, Object>> getUserBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toBookingMap).toList();
    }

    public List<Map<String, Object>> getAllBookings() {
        return bookingRepository.findAll().stream().map(this::toBookingMap).toList();
    }

    public List<Map<String, Object>> getStationBookings(Long stationId) {
        return bookingRepository.findByStationIdOrderByCreatedAtDesc(stationId)
                .stream().map(this::toBookingMap).toList();
    }

    public List<Map<String, Object>> getChargerSchedule(Long chargerId, LocalDateTime dayStart, LocalDateTime dayEnd) {
        return bookingRepository.findByChargerAndDate(chargerId, dayStart, dayEnd)
                .stream().map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("startTime", b.getStartTime());
                    m.put("endTime", b.getEndTime());
                    m.put("durationMinutes", b.getDurationMinutes());
                    return m;
                }).toList();
    }

    public List<Map<String, Object>> getUserWaitlist(Long userId) {
        return waitlistRepository.findByUserIdAndStatusOrderByJoinedAtDesc(userId, WaitlistStatus.WAITING)
                .stream().map(w -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", w.getId());
                    m.put("chargerNumber", w.getCharger().getChargerNumber());
                    m.put("stationName", w.getStation().getName());
                    m.put("batteryPercentage", w.getBatteryPercentage());
                    m.put("priorityScore", w.getPriorityScore());
                    m.put("durationMinutes", w.getDurationMinutes());
                    m.put("status", w.getStatus());
                    m.put("joinedAt", w.getJoinedAt());
                    return m;
                }).toList();
    }

    public List<Map<String, Object>> getChargerWaitlist(Long chargerId) {
        return waitlistRepository
                .findByChargerIdAndStatusOrderByPriorityScoreDescJoinedAtAsc(chargerId, WaitlistStatus.WAITING)
                .stream().map(w -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", w.getId());
                    m.put("userName", w.getUser().getName());
                    m.put("batteryPercentage", w.getBatteryPercentage());
                    m.put("priorityScore", w.getPriorityScore());
                    m.put("durationMinutes", w.getDurationMinutes());
                    m.put("joinedAt", w.getJoinedAt());
                    return m;
                }).toList();
    }

    private Map<String, Object> toBookingMap(Booking b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("userName", b.getUser().getName());
        m.put("stationName", b.getStation().getName());
        m.put("chargerNumber", b.getCharger().getChargerNumber());
        m.put("chargerType", b.getCharger().getChargerType());
        m.put("durationMinutes", b.getDurationMinutes());
        m.put("batteryPercentage", b.getBatteryPercentage());
        m.put("startTime", b.getStartTime());
        m.put("endTime", b.getEndTime());
        m.put("status", b.getStatus());
        m.put("createdAt", b.getCreatedAt());
        return m;
    }
}
