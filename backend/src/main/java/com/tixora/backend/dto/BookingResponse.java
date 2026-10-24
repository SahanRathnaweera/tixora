package com.tixora.backend.dto;

import com.tixora.backend.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingResponse(

        Long id,
        Long eventId,
        String eventTitle,
        LocalDateTime eventDate,
        String eventLocation,
        String eventImageUrl,
        Integer bookedSeats,
        BigDecimal totalPrice,
        BookingStatus bookingStatus,
        LocalDateTime createdAt,
        TicketResponse ticket
) {
}
