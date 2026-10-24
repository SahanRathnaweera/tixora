package com.tixora.backend.service;

import com.tixora.backend.dto.EventRequest;
import com.tixora.backend.dto.EventResponse;
import com.tixora.backend.entity.Event;
import com.tixora.backend.exception.BadRequestException;
import com.tixora.backend.exception.ConflictException;
import com.tixora.backend.exception.ResourceNotFoundException;
import com.tixora.backend.repository.BookingRepository;
import com.tixora.backend.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<EventResponse> list(String query) {
        List<Event> events = (query == null || query.isBlank())
                ? eventRepository.findAllByOrderByEventDateAsc()
                : eventRepository.search(query.trim());
        return events.stream().map(EventResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public EventResponse get(Long id) {
        return EventResponse.from(find(id));
    }

    @Transactional
    public EventResponse create(EventRequest req) {
        if (req.eventDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Event date must be in the future");
        }
        Event event = Event.builder()
                .title(req.title().trim())
                .description(req.description())
                .eventDate(req.eventDate())
                .location(req.location().trim())
                .price(req.price())
                .totalSeats(req.totalSeats())
                .availableSeats(req.totalSeats())
                .imageUrl(blankToNull(req.imageUrl()))
                .build();
        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse update(Long id, EventRequest req) {
        // Lock the row so seat counts stay consistent with concurrent bookings
        Event event = eventRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id " + id));

        int booked = event.getTotalSeats() - event.getAvailableSeats();
        if (req.totalSeats() < booked) {
            throw new BadRequestException(
                    "Total seats cannot be less than the " + booked + " seat(s) already booked");
        }

        event.setTitle(req.title().trim());
        event.setDescription(req.description());
        event.setEventDate(req.eventDate());
        event.setLocation(req.location().trim());
        event.setPrice(req.price());
        event.setTotalSeats(req.totalSeats());
        event.setAvailableSeats(req.totalSeats() - booked);
        event.setImageUrl(blankToNull(req.imageUrl()));
        return EventResponse.from(event);
    }

    @Transactional
    public void delete(Long id) {
        Event event = find(id);
        if (bookingRepository.existsByEventId(id)) {
            throw new ConflictException("This event already has bookings and cannot be deleted");
        }
        eventRepository.delete(event);
    }

    private Event find(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id " + id));
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
