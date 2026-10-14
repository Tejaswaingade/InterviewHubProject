package com.interviewplatform.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.auth.dto.LoginRequest;
import com.interviewplatform.auth.dto.RegisterRequest;
import com.interviewplatform.security.jwt.JwtService;
import com.interviewplatform.user.entity.Role;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully register a new user and hash password with BCrypt")
    void shouldRegisterUserSuccessfully() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Tejas")
                .email("tejas@example.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("User registered successfully")))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.name", is("Tejas")))
                .andExpect(jsonPath("$.data.email", is("tejas@example.com")))
                .andExpect(jsonPath("$.data.role", is("USER")))
                .andExpect(jsonPath("$.data.password").doesNotExist());

        User savedUser = userRepository.findByEmail("tejas@example.com").orElse(null);
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getName()).isEqualTo("Tejas");
        assertThat(savedUser.getRole()).isEqualTo(Role.USER);
        assertThat(savedUser.getPassword()).isNotEqualTo("password123");
        assertThat(savedUser.getPassword()).startsWith("$2a$");
        assertThat(passwordEncoder.matches("password123", savedUser.getPassword())).isTrue();
    }

    @Test
    @DisplayName("Should return 409 Conflict when registering with duplicate email")
    void shouldReturn409WhenDuplicateEmail() throws Exception {
        RegisterRequest request1 = RegisterRequest.builder()
                .name("Tejas")
                .email("tejas@example.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        RegisterRequest request2 = RegisterRequest.builder()
                .name("Another Name")
                .email("tejas@example.com")
                .password("anotherPassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Email already registered")))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("Should return 400 Bad Request when email format is invalid")
    void shouldReturn400WhenInvalidEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Tejas")
                .email("not-an-email")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.errors.email", is("Invalid email format")));
    }

    @Test
    @DisplayName("Should return 400 Bad Request when password is shorter than 8 characters")
    void shouldReturn400WhenShortPassword() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Tejas")
                .email("tejas@example.com")
                .password("short")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.errors.password", is("Password must be at least 8 characters long")));
    }

    @Test
    @DisplayName("Should return 400 Bad Request when name is blank")
    void shouldReturn400WhenBlankName() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("   ")
                .email("tejas@example.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.errors.name", is("Name is required")));
    }

    @Test
    @DisplayName("Should login successfully and return valid JWT with Bearer tokenType")
    void shouldLoginSuccessfully() throws Exception {
        userRepository.save(User.builder()
                .name("Tejas")
                .email("tejas@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("tejas@example.com")
                .password("password123")
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("User authenticated successfully")))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.user.name", is("Tejas")))
                .andExpect(jsonPath("$.data.user.email", is("tejas@example.com")))
                .andExpect(jsonPath("$.data.user.role", is("USER")))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseBody).path("data").path("token").asText();
        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo("tejas@example.com");
    }

    @Test
    @DisplayName("Should return 401 Unauthorized on login with wrong password")
    void shouldReturn401WhenWrongPassword() throws Exception {
        userRepository.save(User.builder()
                .name("Tejas")
                .email("tejas@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("tejas@example.com")
                .password("wrongpassword")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Should return 401 Unauthorized on login with non-existent email")
    void shouldReturn401WhenNonExistentEmail() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Should access protected endpoint GET /api/auth/me with valid Bearer JWT")
    void shouldAccessProtectedEndpointWithJwt() throws Exception {
        User user = userRepository.save(User.builder()
                .name("Tejas")
                .email("tejas@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        var userDetails = userDetailsService.loadUserByUsername("tejas@example.com");
        String jwtToken = jwtService.generateToken(userDetails);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(user.getId().intValue())))
                .andExpect(jsonPath("$.data.name", is("Tejas")))
                .andExpect(jsonPath("$.data.email", is("tejas@example.com")));
    }

    @Test
    @DisplayName("Should reject protected endpoint GET /api/auth/me without Bearer token with 401")
    void shouldRejectProtectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Should reject protected endpoint GET /api/auth/me with invalid Bearer token with 401")
    void shouldRejectProtectedEndpointWithInvalidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
