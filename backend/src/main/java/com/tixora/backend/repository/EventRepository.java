package com.tixora.backend.repository;

import com.tixora.backend.entity.Event;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :id")
    Optional<Event> findByIdForUpdate(@Param("id") Long id);

    @Query("""
           select e from Event e
           where lower(e.title) like lower(concat('%', :q, '%'))
              or lower(e.location) like lower(concat('%', :q, '%'))
           order by e.eventDate asc
           """)
    List<Event> search(@Param("q") String q);

    List<Event> findAllByOrderByEventDateAsc();
}
