package com.interviewplatform.auth;

import com.interviewplatform.auth.dto.AuthResponse;
import com.interviewplatform.auth.dto.LoginRequest;
import com.interviewplatform.auth.dto.RegisterRequest;
import com.interviewplatform.auth.service.AuthService;
import com.interviewplatform.common.exception.EmailAlreadyExistsException;
import com.interviewplatform.security.CustomUserDetailsService;
import com.interviewplatform.security.jwt.JwtService;
import com.interviewplatform.user.dto.UserResponse;
import com.interviewplatform.user.entity.Role;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService customUserDetailsService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private com.interviewplatform.mail.service.EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(1L)
                .name("Tejas W")
                .email("tejas@example.com")
                .password("encoded_pass")
                .role(Role.USER)
                .build();
    }

    @Test
    @DisplayName("Register - Success: Should hash password, save user, and return UserResponse")
    void register_success() {
        RegisterRequest request = RegisterRequest.builder()
                .name("  Tejas W  ")
                .email("  TEJAS@example.com ")
                .password("plain_pass")
                .build();

        when(userRepository.existsByEmail("tejas@example.com")).thenReturn(false);
        when(passwordEncoder.encode("plain_pass")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UserResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Tejas W");
        assertThat(response.getEmail()).isEqualTo("tejas@example.com");
        assertThat(response.getRole()).isEqualTo(Role.USER);

        verify(userRepository).existsByEmail("tejas@example.com");
        verify(passwordEncoder).encode("plain_pass");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Register - Duplicate Email: Should throw EmailAlreadyExistsException")
    void register_duplicateEmail_throwsException() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Tejas")
                .email("tejas@example.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("tejas@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessage("Email already registered");

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    @DisplayName("Login - Success: Should authenticate, generate token, and return AuthResponse")
    void login_success() {
        LoginRequest request = LoginRequest.builder()
                .email("  Tejas@example.com  ")
                .password("password123")
                .build();

        UserDetails mockUserDetails = mock(UserDetails.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("tejas@example.com", "password123"));
        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(sampleUser));
        when(customUserDetailsService.loadUserByUsername("tejas@example.com")).thenReturn(mockUserDetails);
        when(jwtService.generateToken(mockUserDetails)).thenReturn("jwt.token.here");

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt.token.here");
        assertThat(response.getTokenType()).isEqualTo("Bearer");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getEmail()).isEqualTo("tejas@example.com");

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(mockUserDetails);
    }

    @Test
    @DisplayName("Login - Invalid Password: Should propagate BadCredentialsException from AuthenticationManager")
    void login_invalidPassword_throwsBadCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("tejas@example.com")
                .password("wrongpassword")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Bad credentials");

        verify(jwtService, never()).generateToken(any());
    }

    @Test
    @DisplayName("Login - User Not Found in DB after authentication: Should throw BadCredentialsException")
    void login_userNotFound_throwsBadCredentials() {
        LoginRequest request = LoginRequest.builder()
                .email("unknown@example.com")
                .password("password123")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(new UsernamePasswordAuthenticationToken("unknown@example.com", "password123"));
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("GetCurrentUser - Success: Should return UserResponse for authenticated email")
    void getCurrentUser_success() {
        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(sampleUser));

        UserResponse response = authService.getCurrentUser("  TEJAS@example.com ");

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("tejas@example.com");
        assertThat(response.getName()).isEqualTo("Tejas W");
    }

    @Test
    @DisplayName("GetCurrentUser - Not Found: Should throw BadCredentialsException")
    void getCurrentUser_notFound_throwsBadCredentials() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getCurrentUser("unknown@example.com"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("User not found");
    }

    @Test
    @DisplayName("ForgotPassword - Success: Should generate code, save token, and dispatch email")
    void forgotPassword_success() {
        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        com.interviewplatform.auth.dto.ForgotPasswordRequest request = com.interviewplatform.auth.dto.ForgotPasswordRequest.builder()
                .email("tejas@example.com")
                .build();

        java.util.Map<String, Object> result = authService.forgotPassword(request);

        assertThat(result).isNotNull();
        assertThat(result.get("email")).isEqualTo("tejas@example.com");
        assertThat(result.get("message")).isNotNull();
        verify(emailService).sendPasswordResetEmail(eq("tejas@example.com"), eq("Tejas W"), anyString());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("ResetPassword - Success: Should update encoded password and clear token")
    void resetPassword_success() {
        sampleUser.setResetToken("123456");
        sampleUser.setResetTokenExpiry(java.time.LocalDateTime.now().plusMinutes(10));

        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("brandNewPassword123")).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        com.interviewplatform.auth.dto.ResetPasswordRequest request = com.interviewplatform.auth.dto.ResetPasswordRequest.builder()
                .email("tejas@example.com")
                .resetToken("123456")
                .newPassword("brandNewPassword123")
                .build();

        authService.resetPassword(request);

        assertThat(sampleUser.getPassword()).isEqualTo("encodedNewPassword");
        assertThat(sampleUser.getResetToken()).isNull();
        assertThat(sampleUser.getResetTokenExpiry()).isNull();
        verify(userRepository).save(sampleUser);
    }
}
