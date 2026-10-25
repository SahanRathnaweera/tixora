package com.tixora.backend.repository;

import com.tixora.backend.entity.Booking;
import com.tixora.backend.entity.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"event", "ticket"})
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByEventId(Long eventId);

    // Row lock: prevents paying / cancelling the same booking twice at the same time
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id and b.user.id = :userId")
    Optional<Booking> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);

    @Query("select b.id from Booking b where b.bookingStatus = :status and b.expiresAt < :now")
    List<Long> findExpiredHoldIds(@Param("status") BookingStatus status, @Param("now") LocalDateTime now);
}