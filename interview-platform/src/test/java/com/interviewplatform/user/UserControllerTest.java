package com.interviewplatform.user;

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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.interviewplatform.question.repository.QuestionRepository questionRepository;

    @Autowired
    private com.interviewplatform.round.repository.InterviewRoundRepository roundRepository;

    @Autowired
    private com.interviewplatform.experience.repository.InterviewExperienceRepository experienceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    private User testUser;
    private String token;

    @BeforeEach
    void setUp() {
        questionRepository.deleteAll();
        roundRepository.deleteAll();
        experienceRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(User.builder()
                .name("Alice")
                .email("alice@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        token = "Bearer " + jwtService.generateToken(userDetailsService.loadUserByUsername(testUser.getEmail()));
    }

    @Test
    @DisplayName("Should get my user profile")
    void shouldGetMyProfile() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("alice@example.com")))
                .andExpect(jsonPath("$.data.name", is("Alice")));
    }

    @Test
    @DisplayName("Should get user by ID")
    void shouldGetUserById() throws Exception {
        mockMvc.perform(get("/api/users/" + testUser.getId())
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(testUser.getId().intValue())))
                .andExpect(jsonPath("$.data.email", is("alice@example.com")));
    }

    @Test
    @DisplayName("Should return 404 when user ID not found")
    void shouldReturn404WhenUserNotFound() throws Exception {
        mockMvc.perform(get("/api/users/9999")
                        .header("Authorization", token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Should list all users")
    void shouldListAllUsers() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    @DisplayName("Should update own user profile")
    void shouldUpdateOwnProfile() throws Exception {
        String updateJson = """
                {
                    "name": "Alice Cooper"
                }
                """;

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/" + testUser.getId())
                        .header("Authorization", token)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Alice Cooper")));
    }

    @Test
    @DisplayName("Should deny updating another user's profile")
    void shouldDenyUpdatingAnotherUserProfile() throws Exception {
        User otherUser = userRepository.save(User.builder()
                .name("Bob")
                .email("bob@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        String bobToken = "Bearer " + jwtService.generateToken(userDetailsService.loadUserByUsername(otherUser.getEmail()));

        String updateJson = """
                {
                    "name": "Hacked Alice"
                }
                """;

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/users/" + testUser.getId())
                        .header("Authorization", bobToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
