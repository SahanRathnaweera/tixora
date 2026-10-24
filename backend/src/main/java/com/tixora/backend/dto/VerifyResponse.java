package com.tixora.backend.dto;

import java.time.LocalDateTime;

public record VerifyResponse(
        Long ticketId,
        Long bookingId,
        String eventTitle,
        String holderName,
        Integer bookedSeats,
        LocalDateTime verifiedAt
) {
}
