package com.tixora.backend.repository;

import com.tixora.backend.entity.Booking;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"event", "ticket"})
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Booking> findByIdAndUserId(Long id, Long userId);

    boolean existsByEventId(Long eventId);
}
