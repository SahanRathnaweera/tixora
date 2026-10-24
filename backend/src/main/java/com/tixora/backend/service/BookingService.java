package com.tixora.backend.service;

import com.tixora.backend.dto.BookingRequest;
import com.tixora.backend.dto.BookingResponse;
import com.tixora.backend.entity.Booking;
import com.tixora.backend.entity.BookingStatus;
import com.tixora.backend.entity.Event;
import com.tixora.backend.entity.User;
import com.tixora.backend.exception.BadRequestException;
import com.tixora.backend.exception.ConflictException;
import com.tixora.backend.exception.ResourceNotFoundException;
import com.tixora.backend.repository.BookingRepository;
import com.tixora.backend.repository.EventRepository;
import com.tixora.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
    private final BookingMapper mapper;

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

        // Automatic seat deduction
        event.setAvailableSeats(event.getAvailableSeats() - seats);

        Booking booking = bookingRepository.save(Booking.builder()
                .user(user)
                .event(event)
                .bookedSeats(seats)
                .totalPrice(event.getPrice().multiply(BigDecimal.valueOf(seats)))
                .bookingStatus(BookingStatus.CONFIRMED)
                .build());

        // QR ticket issued on successful booking
        booking.setTicket(ticketService.issue(booking));

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
        Booking booking = bookingRepository.findByIdAndUserId(bookingId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + bookingId));

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new ConflictException("This booking is already cancelled");
        }
        if (booking.getTicket() != null && booking.getTicket().isVerified()) {
            throw new BadRequestException("A used ticket cannot be cancelled");
        }

        Event event = eventRepository.findByIdForUpdate(booking.getEvent().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        if (event.getEventDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Past events cannot be cancelled");
        }

        // Give the seats back
        event.setAvailableSeats(event.getAvailableSeats() + booking.getBookedSeats());
        booking.setBookingStatus(BookingStatus.CANCELLED);

        return mapper.toResponse(booking);
    }
}
