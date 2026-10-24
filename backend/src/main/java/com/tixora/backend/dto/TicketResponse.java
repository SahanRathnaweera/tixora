package com.tixora.backend.dto;

import java.time.LocalDateTime;

public record TicketResponse(
        Long id,
        String qrCodeData,
        String qrCodeImage,
        boolean verified,
        LocalDateTime verifiedAt
) {
}
