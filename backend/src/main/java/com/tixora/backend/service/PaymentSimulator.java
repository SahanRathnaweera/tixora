package com.tixora.backend.service;

import com.tixora.backend.dto.PaymentRequest;
import com.tixora.backend.exception.BadRequestException;
import com.tixora.backend.exception.PaymentDeclinedException;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.util.UUID;

@Component
public class PaymentSimulator {

    public record Result(String reference, String last4) {}

    public Result charge(PaymentRequest request) {
        String digits = request.cardNumber().replaceAll("\\s", "");
        if (!digits.matches("\\d{13,19}") || !luhnValid(digits)) {
            throw new BadRequestException("Card number is not valid");
        }

        int month = Integer.parseInt(request.expiry().substring(0, 2));
        int year = 2000 + Integer.parseInt(request.expiry().substring(3, 5));
        if (YearMonth.of(year, month).isBefore(YearMonth.now())) {
            throw new BadRequestException("This card has expired");
        }

        switch (digits) {
            case "4000000000000002" -> throw new PaymentDeclinedException("Your card was declined.");
            case "4000000000009995" -> throw new PaymentDeclinedException("Insufficient funds on this card.");
            default -> { }
        }

        String reference = "PAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        return new Result(reference, digits.substring(digits.length() - 4));
    }

    /** Luhn checksum: the standard check that catches mistyped card numbers. */
    private boolean luhnValid(String digits) {
        int sum = 0;
        boolean alternate = false;
        for (int i = digits.length() - 1; i >= 0; i--) {
            int n = digits.charAt(i) - '0';
            if (alternate) {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }
}
