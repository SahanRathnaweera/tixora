package com.tixora.backend.service;

import com.tixora.backend.dto.BookingResponse;
import com.tixora.backend.dto.TicketResponse;
import com.tixora.backend.entity.Booking;
import com.tixora.backend.entity.Event;
import com.tixora.backend.entity.Ticket;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

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
                b.getCreatedAt(),
                toTicket(b.getTicket()));
    }
}
