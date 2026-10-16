package com.evcharging.controller;

import com.evcharging.security.UserDetailsImpl;
import com.evcharging.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {

    private final StationService stationService;
    private final BookingService bookingService;
    private final ChargerService chargerService;

    @GetMapping("/station")
    public ResponseEntity<?> myStation(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(stationService.getManagerStation(user.getId()));
    }

    @GetMapping("/station/chargers")
    public ResponseEntity<?> myChargers(@AuthenticationPrincipal UserDetailsImpl user) {
        Map<String, Object> station = (Map<String, Object>) stationService.getManagerStation(user.getId());
        Long stationId = ((Number) station.get("id")).longValue();
        return ResponseEntity.ok(chargerService.getStationChargers(stationId));
    }

    @PostMapping("/chargers")
    public ResponseEntity<?> addCharger(@AuthenticationPrincipal UserDetailsImpl user,
                                        @RequestBody Map<String, String> body) {
        Map<String, Object> station = (Map<String, Object>) stationService.getManagerStation(user.getId());
        Long stationId = ((Number) station.get("id")).longValue();
        return ResponseEntity.ok(chargerService.addCharger(stationId, body.get("type"), body.get("chargerNumber")));
    }

    @PutMapping("/chargers/{id}/maintenance")
    public ResponseEntity<?> setMaintenance(@PathVariable Long id, @RequestParam boolean maintenance) {
        return ResponseEntity.ok(chargerService.setMaintenance(id, maintenance));
    }

    @DeleteMapping("/chargers/{id}")
    public ResponseEntity<?> deleteCharger(@PathVariable Long id) {
        chargerService.deleteCharger(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PutMapping("/slots/{id}/state")
    public ResponseEntity<?> updateSlotState(@PathVariable Long id, @RequestParam String state) {
        return ResponseEntity.ok(chargerService.updateSlotState(id, state));
    }

    @GetMapping("/bookings")
    public ResponseEntity<?> stationBookings(@AuthenticationPrincipal UserDetailsImpl user) {
        Map<String, Object> station = (Map<String, Object>) stationService.getManagerStation(user.getId());
        Long stationId = ((Number) station.get("id")).longValue();
        return ResponseEntity.ok(bookingService.getStationBookings(stationId));
    }

    @PutMapping("/bookings/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, @AuthenticationPrincipal UserDetailsImpl user) {
        bookingService.cancelBooking(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Booking cancelled"));
    }
}
