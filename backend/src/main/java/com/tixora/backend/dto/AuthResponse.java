package com.tixora.backend.dto;

public record AuthResponse(String token, UserResponse user) {
}
