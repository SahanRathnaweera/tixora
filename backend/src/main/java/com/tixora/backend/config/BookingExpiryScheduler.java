package com.tixora.backend.config;

import com.tixora.backend.entity.BookingStatus;
import com.tixora.backend.repository.BookingRepository;
import com.tixora.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {
    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    /** Runs every minute and releases the seats of unpaid bookings whose hold has run out. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void releaseExpiredHolds() {
        List<Long> ids = bookingRepository.findExpiredHoldIds(BookingStatus.PENDING_PAYMENT, LocalDateTime.now());
        for (Long id : ids) {
            try {
                bookingService.expireHold(id);
            } catch (Exception e) {
                log.warn("Could not release hold for booking {}: {}", id, e.getMessage());
            }
        }
        if (!ids.isEmpty()) {
            log.info("Released {} expired seat hold(s)", ids.size());
        }
    }
}
