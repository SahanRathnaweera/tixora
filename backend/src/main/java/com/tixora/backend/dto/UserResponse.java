package com.tixora.backend.dto;

import com.tixora.backend.entity.Role;
import com.tixora.backend.entity.User;

public record UserResponse(Long id, String name, String email, Role role) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
