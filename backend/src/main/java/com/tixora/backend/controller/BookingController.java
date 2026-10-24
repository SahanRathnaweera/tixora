package com.tixora.backend.controller;

import com.tixora.backend.dto.BookingRequest;
import com.tixora.backend.dto.BookingResponse;
import com.tixora.backend.security.AppUserDetails;
import com.tixora.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> create(@AuthenticationPrincipal AppUserDetails principal,
                                                  @Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.create(principal.getUser().getId(), request));
    }

    @GetMapping("/my")
    public List<BookingResponse> myBookings(@AuthenticationPrincipal AppUserDetails principal) {
        return bookingService.myBookings(principal.getUser().getId());
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(@AuthenticationPrincipal AppUserDetails principal,
                                  @PathVariable Long id) {
        return bookingService.cancel(principal.getUser().getId(), id);
    }
}
