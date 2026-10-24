package com.tixora.backend.dto;

import com.tixora.backend.entity.Event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventResponse(
        Long id,
        String title,
        String description,
        LocalDateTime eventDate,
        String location,
        BigDecimal price,
        Integer totalSeats,
        Integer availableSeats,
        String imageUrl
) {

    public static EventResponse from(Event e) {
        return new EventResponse(e.getId(), e.getTitle(), e.getDescription(), e.getEventDate(),
                e.getLocation(), e.getPrice(), e.getTotalSeats(), e.getAvailableSeats(), e.getImageUrl());
    }
}
