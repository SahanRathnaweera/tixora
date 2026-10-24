package com.tixora.backend.dto;

import com.tixora.backend.entity.BookingStatus;
import com.tixora.backend.entity.PaymentStatus;

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
        PaymentStatus paymentStatus,
        Long holdSecondsLeft,
        LocalDateTime paidAt,
        String paymentReference,
        String cardLast4,
        LocalDateTime createdAt,
        TicketResponse ticket
) {}