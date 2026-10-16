package com.evcharging.controller;

import com.evcharging.dto.*;
import com.evcharging.repository.UserRepository;
import com.evcharging.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @GetMapping("/debug")
    public ResponseEntity<?> debug() {
        return ResponseEntity.ok(Map.of("status", "auth endpoint reachable", "time", System.currentTimeMillis()));
    }

    @GetMapping("/debug-user")
    public ResponseEntity<?> debugUser() {
        var userOpt = userRepository.findByEmail("admin@evcharging.com");
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("found", false, "message", "No user found with that email"));
        }
        var user = userOpt.get();
        boolean matches = passwordEncoder.matches("password", user.getPassword());
        return ResponseEntity.ok(Map.of(
            "found", true,
            "email", user.getEmail(),
            "role", user.getRole().name(),
            "passwordMatches", matches,
            "storedHashPrefix", user.getPassword().substring(0, 10)
        ));
    }

    @GetMapping("/fix-admin-password")
    public ResponseEntity<?> fixAdminPassword() {
        var userOpt = userRepository.findByEmail("admin@evcharging.com");
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("status", "User not found"));
        }
        var user = userOpt.get();
        String newHash = passwordEncoder.encode("admin123");
        user.setPassword(newHash);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "Password updated to admin123", "newHash", newHash));
    }
}
