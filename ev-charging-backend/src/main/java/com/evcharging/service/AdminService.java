package com.evcharging.service;

import com.evcharging.model.*;
import com.evcharging.model.User.Role;
import com.evcharging.model.Slot.SlotState;
import com.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final ChargerRepository chargerRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> getAnalytics() {
        long totalUsers = userRepository.count();
        long totalStations = stationRepository.count();
        long totalBookings = bookingRepository.count();
        long activeChargers = chargerRepository.countByStationIdAndStatus(0L, Charger.ChargerStatus.ACTIVE);
        long availableSlots = slotRepository.countByStationIdAndSlotState(0L, SlotState.AVAILABLE);
        long todayBookings = bookingRepository.countTodayBookings(LocalDateTime.now().toLocalDate().atStartOfDay());
        LocalDateTime weekStart = LocalDateTime.now().toLocalDate().with(java.time.DayOfWeek.MONDAY).atStartOfDay();
        double weeklyEnergy = bookingRepository.sumEnergyDeliveredSince(weekStart);

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("totalUsers", totalUsers);
        analytics.put("totalStations", totalStations);
        analytics.put("totalBookings", totalBookings);
        analytics.put("todayBookings", todayBookings);
        analytics.put("totalChargers", chargerRepository.count());
        analytics.put("availableSlots", slotRepository.findAll().stream()
                .filter(s -> s.getSlotState() == SlotState.AVAILABLE).count());
        analytics.put("managers", userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MANAGER).count());
        analytics.put("weeklyEnergyKwh", Math.round(weeklyEnergy * 10.0) / 10.0);
        return analytics;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.USER).toList();
    }

    public List<User> getAllManagers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MANAGER).toList();
    }

    public User createManager(String name, String email, String password, Long stationId) {
        User manager = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.MANAGER)
                .isActive(true)
                .build();
        manager = userRepository.save(manager);
        if (stationId != null) {
            Station station = stationRepository.findById(stationId).orElseThrow();
            station.setManager(manager);
            stationRepository.save(station);
        }
        return manager;
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public User toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        user.setIsActive(!user.getIsActive());
        return userRepository.save(user);
    }
}
