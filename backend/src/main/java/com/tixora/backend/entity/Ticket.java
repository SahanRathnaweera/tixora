package com.tixora.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", unique = true)
    private Booking booking;

    @Column(nullable = false, unique = true)
    private String qrCodeData;

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    private LocalDateTime verifiedAt;
}
