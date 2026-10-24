package com.tixora.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyRequest(

        @NotBlank(message = "QR code data is required")
        String qrCodeData
) {
}
