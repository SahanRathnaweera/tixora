package com.tixora.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PaymentRequest(

        @NotBlank(message = "Cardholder name is required")
        @Size(max = 100, message = "Cardholder name is too long")
        String cardHolder,

        @NotBlank(message = "Card number is required")
        @Pattern(regexp = "^[0-9 ]{13,23}$", message = "Card number is not valid")
        String cardNumber,

        @NotBlank(message = "Expiry date is required")
        @Pattern(regexp = "^(0[1-9]|1[0-2])/[0-9]{2}$", message = "Expiry must be in MM/YY format")
        String expiry,

        @NotBlank(message = "CVV is required")
        @Pattern(regexp = "^[0-9]{3,4}$", message = "CVV must be 3 or 4 digits")
        String cvv
) {
}
