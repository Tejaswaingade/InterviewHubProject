package com.interviewplatform.auth.service;

import com.interviewplatform.common.exception.LockedAccountException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise In-Memory Rate Limiter and Brute-Force Protection for Login.
 * Locks accounts temporarily after 5 consecutive failed login attempts within a 15-minute window.
 */
@Service
public class LoginRateLimiterService {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final int LOCKOUT_MINUTES = 15;

    private static class AttemptRecord {
        private int failedAttempts;
        private LocalDateTime lastAttemptTime;
        private LocalDateTime lockoutExpiry;

        public AttemptRecord(int failedAttempts, LocalDateTime lastAttemptTime) {
            this.failedAttempts = failedAttempts;
            this.lastAttemptTime = lastAttemptTime;
        }
    }

    private final Map<String, AttemptRecord> attemptsCache = new ConcurrentHashMap<>();

    /**
     * Checks if the account is currently locked due to exceeded failed login attempts.
     */
    public void checkLockout(String email) {
        if (email == null) return;
        String key = email.trim().toLowerCase();
        AttemptRecord record = attemptsCache.get(key);

        if (record != null && record.lockoutExpiry != null) {
            if (LocalDateTime.now().isBefore(record.lockoutExpiry)) {
                long minutesRemaining = Math.max(1, Duration.between(LocalDateTime.now(), record.lockoutExpiry).toMinutes() + 1);
                throw new LockedAccountException(
                        String.format("Too many failed login attempts. Account temporarily locked for security. Please try again in %d minute(s) or reset your password.", minutesRemaining)
                );
            } else {
                // Lockout window expired, clear stale entry
                attemptsCache.remove(key);
            }
        }
    }

    /**
     * Records a failed login attempt and calculates remaining attempts or locks the account.
     */
    public void recordFailedAttempt(String email) {
        if (email == null) {
            throw new BadCredentialsException("Invalid email or password");
        }
        String key = email.trim().toLowerCase();
        LocalDateTime now = LocalDateTime.now();

        AttemptRecord record = attemptsCache.compute(key, (k, existing) -> {
            if (existing == null || (existing.lastAttemptTime != null && existing.lastAttemptTime.isBefore(now.minusMinutes(LOCKOUT_MINUTES)))) {
                return new AttemptRecord(1, now);
            }
            existing.failedAttempts += 1;
            existing.lastAttemptTime = now;
            if (existing.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                existing.lockoutExpiry = now.plusMinutes(LOCKOUT_MINUTES);
            }
            return existing;
        });

        if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
            throw new LockedAccountException(
                    String.format("Too many failed login attempts. Account temporarily locked for security. Please try again after %d minutes or reset your password.", LOCKOUT_MINUTES)
            );
        } else {
            int remaining = MAX_FAILED_ATTEMPTS - record.failedAttempts;
            throw new BadCredentialsException(
                    String.format("Invalid email or password. You have %d attempt(s) remaining before account lockout.", remaining)
            );
        }
    }

    /**
     * Resets failed attempt counter upon successful login or password reset.
     */
    public void resetAttempts(String email) {
        if (email != null) {
            attemptsCache.remove(email.trim().toLowerCase());
        }
    }

    public int getFailedAttempts(String email) {
        if (email == null) return 0;
        AttemptRecord record = attemptsCache.get(email.trim().toLowerCase());
        return record != null ? record.failedAttempts : 0;
    }
}
