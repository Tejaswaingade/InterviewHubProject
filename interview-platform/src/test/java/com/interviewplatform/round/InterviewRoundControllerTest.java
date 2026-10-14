package com.interviewplatform.round;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.round.dto.CreateRoundRequest;
import com.interviewplatform.round.dto.UpdateRoundRequest;
import com.interviewplatform.round.entity.InterviewRound;
import com.interviewplatform.round.repository.InterviewRoundRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class InterviewRoundControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private InterviewExperienceRepository experienceRepository;

    @Autowired
    private InterviewRoundRepository roundRepository;

    @Autowired
    private com.interviewplatform.question.repository.QuestionRepository questionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    private User ownerUser;
    private User otherUser;
    private User adminUser;
    private String ownerToken;
    private String otherToken;
    private String adminToken;
    private InterviewExperience testExperience;

    @BeforeEach
    void setUp() {
        questionRepository.deleteAll();
        roundRepository.deleteAll();
        experienceRepository.deleteAll();
        companyRepository.deleteAll();
        userRepository.deleteAll();

        ownerUser = userRepository.save(User.builder()
                .name("Owner User")
                .email("owner@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        otherUser = userRepository.save(User.builder()
                .name("Other User")
                .email("other@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        adminUser = userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.ADMIN)
                .build());

        ownerToken = "Bearer " + jwtService.generateToken(userDetailsService.loadUserByUsername(ownerUser.getEmail()));
        otherToken = "Bearer " + jwtService.generateToken(userDetailsService.loadUserByUsername(otherUser.getEmail()));
        adminToken = "Bearer " + jwtService.generateToken(userDetailsService.loadUserByUsername(adminUser.getEmail()));

        Company company = companyRepository.save(Company.builder()
                .name("Google")
                .website("https://google.com")
                .build());

        testExperience = experienceRepository.save(InterviewExperience.builder()
                .user(ownerUser)
                .company(company)
                .jobRole("Software Engineer")
                .experienceTitle("SDE Interview at Google")
                .description("Detailed interview experience")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(2.5)
                .build());
    }

    @Test
    @DisplayName("Should create round successfully as experience owner")
    void shouldCreateRoundSuccessfullyAsOwner() throws Exception {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundName("Technical Round 1")
                .roundNumber(1)
                .build();

        mockMvc.perform(post("/api/experiences/" + testExperience.getId() + "/rounds")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Interview round created successfully")))
                .andExpect(jsonPath("$.data.roundName", is("Technical Round 1")))
                .andExpect(jsonPath("$.data.roundNumber", is(1)))
                .andExpect(jsonPath("$.data.experienceId", is(testExperience.getId().intValue())));
    }

    @Test
    @DisplayName("Should create round successfully as admin")
    void shouldCreateRoundSuccessfullyAsAdmin() throws Exception {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundName("Technical Round 1")
                .roundNumber(1)
                .build();

        mockMvc.perform(post("/api/experiences/" + testExperience.getId() + "/rounds")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Should return 403 when non-owner tries to create round")
    void shouldReturn403WhenNonOwnerCreatesRound() throws Exception {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundName("Technical Round 1")
                .roundNumber(1)
                .build();

        mockMvc.perform(post("/api/experiences/" + testExperience.getId() + "/rounds")
                        .header("Authorization", otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Should return 404 when creating round for nonexistent experience")
    void shouldReturn404WhenExperienceNotFound() throws Exception {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundName("Technical Round 1")
                .roundNumber(1)
                .build();

        mockMvc.perform(post("/api/experiences/9999/rounds")
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Should list rounds for an experience")
    void shouldListRoundsForExperience() throws Exception {
        roundRepository.save(InterviewRound.builder()
                .experience(testExperience)
                .roundName("Screening")
                .roundNumber(1)
                .build());

        mockMvc.perform(get("/api/experiences/" + testExperience.getId() + "/rounds")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].roundName", is("Screening")));
    }

    @Test
    @DisplayName("Should get round by ID")
    void shouldGetRoundById() throws Exception {
        InterviewRound round = roundRepository.save(InterviewRound.builder()
                .experience(testExperience)
                .roundName("Screening")
                .roundNumber(1)
                .build());

        mockMvc.perform(get("/api/rounds/" + round.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(round.getId().intValue())))
                .andExpect(jsonPath("$.data.roundName", is("Screening")));
    }

    @Test
    @DisplayName("Should update round successfully as owner")
    void shouldUpdateRoundSuccessfullyAsOwner() throws Exception {
        InterviewRound round = roundRepository.save(InterviewRound.builder()
                .experience(testExperience)
                .roundName("Screening")
                .roundNumber(1)
                .build());

        UpdateRoundRequest updateRequest = UpdateRoundRequest.builder()
                .roundName("HR Discussion")
                .roundNumber(2)
                .build();

        mockMvc.perform(put("/api/rounds/" + round.getId())
                        .header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.roundName", is("HR Discussion")))
                .andExpect(jsonPath("$.data.roundNumber", is(2)));
    }

    @Test
    @DisplayName("Should delete round successfully as owner")
    void shouldDeleteRoundSuccessfullyAsOwner() throws Exception {
        InterviewRound round = roundRepository.save(InterviewRound.builder()
                .experience(testExperience)
                .roundName("Screening")
                .roundNumber(1)
                .build());

        mockMvc.perform(delete("/api/rounds/" + round.getId())
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Interview round deleted successfully")));
    }

    @Test
    @DisplayName("Should get all rounds across platform with no parameters")
    void shouldGetAllRoundsWithNoParameters() throws Exception {
        roundRepository.save(InterviewRound.builder()
                .experience(testExperience)
                .roundName("Round 1")
                .roundNumber(1)
                .build());
        roundRepository.save(InterviewRound.builder()
                .experience(testExperience)
                .roundName("Round 2")
                .roundNumber(2)
                .build());

        mockMvc.perform(get("/api/rounds")
                        .header("Authorization", ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }
}
