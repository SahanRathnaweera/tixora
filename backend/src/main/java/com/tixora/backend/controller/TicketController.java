package com.tixora.backend.controller;


import com.tixora.backend.dto.VerifyRequest;
import com.tixora.backend.dto.VerifyResponse;
import com.tixora.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // Admin scans the QR code and sends its content here
    @PostMapping("/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public VerifyResponse verify(@Valid @RequestBody VerifyRequest request) {
        return ticketService.verify(request.qrCodeData());
    }
}
