package com.tixora.backend.service;

import com.tixora.backend.dto.BookingRequest;
import com.tixora.backend.dto.BookingResponse;
import com.tixora.backend.dto.PaymentRequest;
import com.tixora.backend.entity.Booking;
import com.tixora.backend.entity.BookingStatus;
import com.tixora.backend.entity.Event;
import com.tixora.backend.entity.PaymentStatus;
import com.tixora.backend.entity.User;
import com.tixora.backend.exception.BadRequestException;
import com.tixora.backend.exception.ConflictException;
import com.tixora.backend.exception.ResourceNotFoundException;
import com.tixora.backend.repository.BookingRepository;
import com.tixora.backend.repository.EventRepository;
import com.tixora.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final TicketService ticketService;
    private final PaymentSimulator paymentSimulator;
    private final BookingMapper mapper;

    @Value("${app.booking.hold-minutes:10}")
    private long holdMinutes;

    /**
     * Step 1: reserve (hold) the seats. The QR ticket is NOT issued yet.
     * Free events are confirmed immediately because there is nothing to pay.
     */
    @Transactional
    public BookingResponse create(Long userId, BookingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Pessimistic lock: concurrent bookings can't oversell the event
        Event event = eventRepository.findByIdForUpdate(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id " + request.eventId()));

        if (event.getEventDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This event has already taken place");
        }

        int seats = request.bookedSeats();
        if (event.getAvailableSeats() < seats) {
            throw new ConflictException(event.getAvailableSeats() == 0
                    ? "Sorry, this event is sold out"
                    : "Only " + event.getAvailableSeats() + " seat(s) left");
        }

        event.setAvailableSeats(event.getAvailableSeats() - seats);

        BigDecimal total = event.getPrice().multiply(BigDecimal.valueOf(seats));
        Booking booking = bookingRepository.save(Booking.builder()
                .user(user)
                .event(event)
                .bookedSeats(seats)
                .totalPrice(total)
                .bookingStatus(BookingStatus.PENDING_PAYMENT)
                .paymentStatus(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(holdMinutes))
                .build());

        if (total.signum() == 0) {
            confirm(booking, "FREE", null);
        }
        return mapper.toResponse(booking);
    }

    /**
     * Step 2: simulated payment. On success the booking is confirmed and the QR ticket is issued.
     * noRollbackFor: when a hold has expired we release the seats and still need that change saved.
     */
    @Transactional(noRollbackFor = ConflictException.class)
    public BookingResponse pay(Long userId, Long bookingId, PaymentRequest request) {
        Booking booking = bookingRepository.findByIdAndUserIdForUpdate(bookingId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + bookingId));

        if (booking.getBookingStatus() == BookingStatus.CONFIRMED) {
            throw new ConflictException("This booking is already paid");
        }
        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("This reservation was cancelled or has expired");
        }

        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            Event event = eventRepository.findByIdForUpdate(booking.getEvent().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
            release(booking, event);
            throw new ConflictException("Your reservation expired and the seats were released. Please book again.");
        }

        PaymentSimulator.Result result = paymentSimulator.charge(request);
        confirm(booking, result.reference(), result.last4());
        return mapper.toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponse cancel(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findByIdAndUserIdForUpdate(bookingId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + bookingId));

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("This booking is already cancelled");
        }
        if (booking.getTicket() != null && booking.getTicket().isVerified()) {
            throw new BadRequestException("A used ticket cannot be cancelled");
        }

        Event event = eventRepository.findByIdForUpdate(booking.getEvent().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        boolean wasPaid = booking.getBookingStatus() == BookingStatus.CONFIRMED;
        if (wasPaid && event.getEventDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Past events cannot be cancelled");
        }

        // Give the seats back
        event.setAvailableSeats(event.getAvailableSeats() + booking.getBookedSeats());
        booking.setBookingStatus(BookingStatus.CANCELLED);
        booking.setPaymentStatus(wasPaid ? PaymentStatus.REFUNDED : PaymentStatus.FAILED);
        booking.setExpiresAt(null);

        return mapper.toResponse(booking);
    }

    /** Called by the scheduler (next step): frees seats of unpaid bookings whose hold ran out. */
    @Transactional
    public void expireHold(Long bookingId) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId).orElse(null);
        if (booking == null
                || booking.getBookingStatus() != BookingStatus.PENDING_PAYMENT
                || booking.getExpiresAt() == null
                || booking.getExpiresAt().isAfter(LocalDateTime.now())) {
            return; // already paid, cancelled or not expired yet
        }
        Event event = eventRepository.findByIdForUpdate(booking.getEvent().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        release(booking, event);
    }

    private void release(Booking booking, Event event) {
        event.setAvailableSeats(event.getAvailableSeats() + booking.getBookedSeats());
        booking.setBookingStatus(BookingStatus.CANCELLED);
        booking.setPaymentStatus(PaymentStatus.FAILED);
        booking.setExpiresAt(null);
    }

    private void confirm(Booking booking, String reference, String last4) {
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        booking.setPaymentStatus(PaymentStatus.PAID);
        booking.setPaidAt(LocalDateTime.now());
        booking.setPaymentReference(reference);
        booking.setCardLast4(last4);
        booking.setExpiresAt(null);
        booking.setTicket(ticketService.issue(booking)); // QR ticket only after payment
    }
}