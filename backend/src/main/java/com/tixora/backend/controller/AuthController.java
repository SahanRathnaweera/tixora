package com.tixora.backend.controller;

import com.tixora.backend.dto.AuthResponse;
import com.tixora.backend.dto.LoginRequest;
import com.tixora.backend.dto.RegisterRequest;
import com.tixora.backend.dto.UserResponse;
import com.tixora.backend.security.AppUserDetails;
import com.tixora.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppUserDetails principal) {
        return UserResponse.from(principal.getUser());
    }
}
