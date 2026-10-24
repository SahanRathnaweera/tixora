package com.tixora.backend.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Size(max = 4000, message = "Description must be at most 4000 characters")
        String description,

        @NotNull(message = "Event date is required")
        LocalDateTime eventDate,

        @NotBlank(message = "Location is required")
        @Size(max = 200, message = "Location must be at most 200 characters")
        String location,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price cannot be negative")
        BigDecimal price,

        @NotNull(message = "Total seats is required")
        @Min(value = 1, message = "Total seats must be at least 1")
        Integer totalSeats,

        @Size(max = 255, message = "Image URL must be at most 255 characters")
        String imageUrl
) {
}
