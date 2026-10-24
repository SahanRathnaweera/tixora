package com.tixora.backend.service;

import com.tixora.backend.dto.AuthResponse;
import com.tixora.backend.dto.LoginRequest;
import com.tixora.backend.dto.RegisterRequest;
import com.tixora.backend.dto.UserResponse;
import com.tixora.backend.entity.Role;
import com.tixora.backend.entity.User;
import com.tixora.backend.exception.ConflictException;
import com.tixora.backend.exception.ResourceNotFoundException;
import com.tixora.backend.repository.UserRepository;
import com.tixora.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        // Public registration always creates a normal USER (never ADMIN)
        User user = userRepository.save(User.builder()
                .name(request.name().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build());
        return toResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalize(request.email());
        // Throws BadCredentialsException on failure (handled -> 401)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(user);
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), UserResponse.from(user));
    }

    private String normalize(String email) {
        return email.trim().toLowerCase();
    }
}
