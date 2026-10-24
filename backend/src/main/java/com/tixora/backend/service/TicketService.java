package com.tixora.backend.service;

import com.tixora.backend.dto.VerifyResponse;
import com.tixora.backend.entity.Booking;
import com.tixora.backend.entity.BookingStatus;
import com.tixora.backend.entity.Ticket;
import com.tixora.backend.exception.BadRequestException;
import com.tixora.backend.exception.ConflictException;
import com.tixora.backend.exception.ResourceNotFoundException;
import com.tixora.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm");

    private final TicketRepository ticketRepository;

    /** Called inside the booking transaction. */
    public Ticket issue(Booking booking) {
        Ticket ticket = Ticket.builder()
                .booking(booking)
                .qrCodeData("TIXORA-" + UUID.randomUUID())
                .verified(false)
                .build();
        return ticketRepository.save(ticket);
    }

    @Transactional
    public VerifyResponse verify(String qrCodeData) {
        // Row is locked, so two scanners can't verify the same ticket at once
        Ticket ticket = ticketRepository.findByQrCodeData(qrCodeData.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid ticket: QR code not recognised"));

        Booking booking = ticket.getBooking();

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("This booking has been cancelled");
        }
        if (ticket.isVerified()) {
            throw new ConflictException("Ticket already used on " + ticket.getVerifiedAt().format(FMT));
        }

        ticket.setVerified(true);
        ticket.setVerifiedAt(LocalDateTime.now());

        return new VerifyResponse(
                ticket.getId(),
                booking.getId(),
                booking.getEvent().getTitle(),
                booking.getUser().getName(),
                booking.getBookedSeats(),
                ticket.getVerifiedAt());
    }
}
