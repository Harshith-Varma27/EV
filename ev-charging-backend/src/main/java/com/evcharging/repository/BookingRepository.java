package com.evcharging.repository;

import com.evcharging.model.Booking;
import com.evcharging.model.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByStationIdOrderByCreatedAtDesc(Long stationId);
    List<Booking> findByStatus(BookingStatus status);

    Optional<Booking> findByChargerIdAndStatus(Long chargerId, BookingStatus status);

    // Charger is occupied only if there's an active booking covering right now
    @Query("SELECT b FROM Booking b WHERE b.charger.id = :chargerId AND b.status = 'ACTIVE' AND b.startTime <= :now AND b.endTime > :now")
    Optional<Booking> findActiveNow(@Param("chargerId") Long chargerId, @Param("now") LocalDateTime now);

    // Check if charger has any overlapping booking in the requested time window
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.charger.id = :chargerId AND b.status = 'ACTIVE' AND b.startTime < :endTime AND b.endTime > :startTime")
    long countOverlappingBookings(@Param("chargerId") Long chargerId,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime);

    // Get all active bookings for a charger that overlap with the given day window
    @Query("SELECT b FROM Booking b WHERE b.charger.id = :chargerId AND b.status = 'ACTIVE' AND b.startTime < :dayEnd AND b.endTime > :dayStart")
    List<Booking> findByChargerAndDate(@Param("chargerId") Long chargerId,
                                       @Param("dayStart") LocalDateTime dayStart,
                                       @Param("dayEnd") LocalDateTime dayEnd);

    // Find active bookings whose end_time has passed — for scheduler
    @Query("SELECT b FROM Booking b WHERE b.status = 'ACTIVE' AND b.endTime <= :now")
    List<Booking> findExpiredActiveBookings(@Param("now") LocalDateTime now);

    long countByStatus(BookingStatus status);
    long countByStationId(Long stationId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.createdAt >= :from")
    long countTodayBookings(@Param("from") LocalDateTime from);

    // Sum of (powerOutput × durationMinutes) / 60 for completed bookings this week
    @Query("SELECT COALESCE(SUM(b.charger.powerOutput * b.durationMinutes / 60.0), 0) FROM Booking b WHERE b.status = 'COMPLETED' AND b.createdAt >= :from")
    double sumEnergyDeliveredSince(@Param("from") LocalDateTime from);
}
