package com.interviewplatform.auth.service;

import com.interviewplatform.auth.dto.*;
import com.interviewplatform.common.exception.EmailAlreadyExistsException;
import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.mail.service.EmailService;
import com.interviewplatform.security.CustomUserDetailsService;
import com.interviewplatform.security.jwt.JwtService;
import com.interviewplatform.user.dto.UserResponse;
import com.interviewplatform.user.entity.Role;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            CustomUserDetailsService customUserDetailsService,
            AuthenticationManager authenticationManager,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.customUserDetailsService = customUserDetailsService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .password(encodedPassword)
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);

        // Send professional welcome confirmation email
        try {
            emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());
        } catch (Exception ex) {
            log.warn("Could not dispatch welcome email to {}: {}", savedUser.getEmail(), ex.getMessage());
        }

        return UserResponse.builder()
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Authenticate credentials through Spring Security AuthenticationManager
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // If user's first time logging in, trigger welcome email; otherwise send login alert
        if (user.getLastLoginAt() == null) {
            try {
                emailService.sendWelcomeEmail(user.getEmail(), user.getName());
            } catch (Exception ex) {
                log.warn("Could not dispatch welcome email upon first login for {}: {}", user.getEmail(), ex.getMessage());
            }
        } else {
            try {
                emailService.sendLoginNotificationEmail(user.getEmail(), user.getName(), LocalDateTime.now());
            } catch (Exception ex) {
                log.warn("Could not dispatch login alert email for {}: {}", user.getEmail(), ex.getMessage());
            }
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(normalizedEmail);
        String token = jwtService.generateToken(userDetails);

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(userResponse)
                .build();
    }

    @Transactional
    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with email: " + normalizedEmail));

        // Generate 6-digit OTP code
        String resetCode = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        user.setResetToken(resetCode);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetCode);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Password reset code sent to " + normalizedEmail);
        response.put("email", normalizedEmail);
        return response;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with email: " + normalizedEmail));

        if (user.getResetToken() == null || !user.getResetToken().equals(request.getResetToken().trim())) {
            throw new IllegalArgumentException("Invalid password reset verification code");
        }

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Password reset code has expired. Please request a new code.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public UserResponse getCurrentUser(String email) {
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
