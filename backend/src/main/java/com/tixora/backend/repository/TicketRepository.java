package com.tixora.backend.repository;

import com.tixora.backend.entity.Ticket;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Ticket> findByQrCodeData(String qrCodeData);
}
