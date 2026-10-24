package com.tixora.backend.service;

import com.tixora.backend.dto.BookingResponse;
import com.tixora.backend.dto.TicketResponse;
import com.tixora.backend.entity.Booking;
import com.tixora.backend.entity.BookingStatus;
import com.tixora.backend.entity.Event;
import com.tixora.backend.entity.PaymentStatus;
import com.tixora.backend.entity.Ticket;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class BookingMapper {

    private final QrCodeService qrCodeService;

    public TicketResponse toTicket(Ticket t) {
        if (t == null) return null;
        return new TicketResponse(
                t.getId(),
                t.getQrCodeData(),
                qrCodeService.generateDataUri(t.getQrCodeData()),
                t.isVerified(),
                t.getVerifiedAt());
    }

    public BookingResponse toResponse(Booking b) {
        Event e = b.getEvent();
        return new BookingResponse(
                b.getId(),
                e.getId(),
                e.getTitle(),
                e.getEventDate(),
                e.getLocation(),
                e.getImageUrl(),
                b.getBookedSeats(),
                b.getTotalPrice(),
                b.getBookingStatus(),
                paymentStatusOf(b),
                holdSecondsLeft(b),
                b.getPaidAt(),
                b.getPaymentReference(),
                b.getCardLast4(),
                b.getCreatedAt(),
                toTicket(b.getTicket()));
    }

    /** Bookings created before checkout existed have no payment status: derive it. */
    private PaymentStatus paymentStatusOf(Booking b) {
        if (b.getPaymentStatus() != null) return b.getPaymentStatus();
        return switch (b.getBookingStatus()) {
            case CONFIRMED -> PaymentStatus.PAID;
            case CANCELLED -> PaymentStatus.REFUNDED;
            case PENDING_PAYMENT -> PaymentStatus.PENDING;
        };
    }

    /** Seconds left to pay (sent as a number so clock/timezone differences do not matter). */
    private Long holdSecondsLeft(Booking b) {
        if (b.getBookingStatus() != BookingStatus.PENDING_PAYMENT || b.getExpiresAt() == null) {
            return null;
        }
        return Math.max(0L, Duration.between(LocalDateTime.now(), b.getExpiresAt()).getSeconds());
    }
}