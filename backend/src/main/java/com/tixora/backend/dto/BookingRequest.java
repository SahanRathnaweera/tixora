package com.tixora.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BookingRequest(
        @NotNull(message = "Event is required")
        Long eventId,

        @NotNull(message = "Number of seats is required")
        @Min(value = 1, message = "Book at least 1 seat")
        @Max(value = 10, message = "You can book at most 10 seats at a time")
        Integer bookedSeats
) {
}
