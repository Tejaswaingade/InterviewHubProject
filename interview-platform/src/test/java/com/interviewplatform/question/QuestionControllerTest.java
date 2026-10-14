package com.interviewplatform.question;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.question.dto.CreateQuestionRequest;
import com.interviewplatform.question.dto.UpdateQuestionRequest;
import com.interviewplatform.question.entity.Question;
import com.interviewplatform.question.entity.QuestionType;
import com.interviewplatform.question.repository.QuestionRepository;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class QuestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private InterviewRoundRepository roundRepository;

    @Autowired
    private InterviewExperienceRepository experienceRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    private User ownerUser;
    private User otherUser;
    private User adminUser;
    private Company company;
    private InterviewExperience experience;
    private InterviewRound round;

    private String ownerToken;
    private String otherToken;
    private String adminToken;

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
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build());

        company = companyRepository.save(Company.builder()
                .name("Amazon")
                .website("https://amazon.com")
                .description("E-commerce and cloud company")
                .build());

        experience = experienceRepository.save(InterviewExperience.builder()
                .user(ownerUser)
                .company(company)
                .jobRole("SDE 2")
                .experienceTitle("Amazon SDE 2 Interview")
                .description("4 rounds process")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(3.0)
                .build());

        round = roundRepository.save(InterviewRound.builder()
                .experience(experience)
                .roundName("Technical Round 1")
                .roundNumber(1)
                .build());

        UserDetails ownerDetails = userDetailsService.loadUserByUsername(ownerUser.getEmail());
        ownerToken = jwtService.generateToken(ownerDetails);

        UserDetails otherDetails = userDetailsService.loadUserByUsername(otherUser.getEmail());
        otherToken = jwtService.generateToken(otherDetails);

        UserDetails adminDetails = userDetailsService.loadUserByUsername(adminUser.getEmail());
        adminToken = jwtService.generateToken(adminDetails);
    }

    @Test
    @DisplayName("Create question - Owner of parent interview experience can create question (201 Created)")
    void createQuestion_asExperienceOwner_returnsCreated() throws Exception {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("Implement an LRU Cache in Java.")
                .questionType(QuestionType.DSA)
                .difficulty(Difficulty.HARD)
                .topic("Data Structures")
                .answer("Use a DoublyLinkedList and a HashMap.")
                .build();

        mockMvc.perform(post("/api/rounds/" + round.getId() + "/questions")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.questionText", is("Implement an LRU Cache in Java.")))
                .andExpect(jsonPath("$.data.questionType", is("DSA")))
                .andExpect(jsonPath("$.data.difficulty", is("HARD")))
                .andExpect(jsonPath("$.data.topic", is("Data Structures")))
                .andExpect(jsonPath("$.data.roundId", is(round.getId().intValue())));

        assertThat(questionRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Create question - Non-owner user should receive 403 Forbidden")
    void createQuestion_asNonOwner_returnsForbidden() throws Exception {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("Explain Spring Bean lifecycle.")
                .questionType(QuestionType.SPRING_BOOT)
                .difficulty(Difficulty.MEDIUM)
                .build();

        mockMvc.perform(post("/api/rounds/" + round.getId() + "/questions")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));

        assertThat(questionRepository.count()).isEqualTo(0);
    }

    @Test
    @DisplayName("Create question - Admin can create question in any round (201 Created)")
    void createQuestion_asAdmin_returnsCreated() throws Exception {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("Design a distributed rate limiter.")
                .questionType(QuestionType.SYSTEM_DESIGN)
                .difficulty(Difficulty.HARD)
                .topic("System Design")
                .build();

        mockMvc.perform(post("/api/rounds/" + round.getId() + "/questions")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.questionText", is("Design a distributed rate limiter.")));

        assertThat(questionRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Create question - Non-existent round ID returns 404 Not Found")
    void createQuestion_invalidRound_returnsNotFound() throws Exception {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("Question for missing round")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .build();

        mockMvc.perform(post("/api/rounds/9999/questions")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Create question - Blank questionText returns 400 Bad Request")
    void createQuestion_blankText_returnsBadRequest() throws Exception {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .build();

        mockMvc.perform(post("/api/rounds/" + round.getId() + "/questions")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Get questions by round - Returns list of questions (200 OK)")
    void getQuestions_returnsList() throws Exception {
        questionRepository.save(Question.builder()
                .round(round)
                .questionText("Q1: What is polymorphism?")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .topic("OOP")
                .build());

        questionRepository.save(Question.builder()
                .round(round)
                .questionText("Q2: Explain indexing in PostgreSQL.")
                .questionType(QuestionType.DATABASE)
                .difficulty(Difficulty.MEDIUM)
                .topic("Databases")
                .build());

        mockMvc.perform(get("/api/rounds/" + round.getId() + "/questions")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].questionText", is("Q1: What is polymorphism?")))
                .andExpect(jsonPath("$.data[1].questionText", is("Q2: Explain indexing in PostgreSQL.")));
    }

    @Test
    @DisplayName("Get questions by round - Non-existent round returns 404 Not Found")
    void getQuestions_invalidRound_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/rounds/9999/questions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Update question - Owner of parent experience can update question (200 OK)")
    void updateQuestion_asExperienceOwner_returnsOk() throws Exception {
        Question question = questionRepository.save(Question.builder()
                .round(round)
                .questionText("Original question text")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .build());

        UpdateQuestionRequest updateRequest = UpdateQuestionRequest.builder()
                .questionText("Updated question text: Deep dive into garbage collection")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.HARD)
                .topic("JVM")
                .answer("Generational garbage collection details.")
                .build();

        mockMvc.perform(put("/api/questions/" + question.getId())
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.questionText", is("Updated question text: Deep dive into garbage collection")))
                .andExpect(jsonPath("$.data.difficulty", is("HARD")))
                .andExpect(jsonPath("$.data.topic", is("JVM")));
    }

    @Test
    @DisplayName("Update question - Non-owner user should receive 403 Forbidden")
    void updateQuestion_asNonOwner_returnsForbidden() throws Exception {
        Question question = questionRepository.save(Question.builder()
                .round(round)
                .questionText("Original question text")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .build());

        UpdateQuestionRequest updateRequest = UpdateQuestionRequest.builder()
                .questionText("Hacked question text")
                .questionType(QuestionType.OTHER)
                .difficulty(Difficulty.MEDIUM)
                .build();

        mockMvc.perform(put("/api/questions/" + question.getId())
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Update question - Admin can update any question (200 OK)")
    void updateQuestion_asAdmin_returnsOk() throws Exception {
        Question question = questionRepository.save(Question.builder()
                .round(round)
                .questionText("Original question text")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .build());

        UpdateQuestionRequest updateRequest = UpdateQuestionRequest.builder()
                .questionText("Admin updated question text")
                .questionType(QuestionType.SPRING_BOOT)
                .difficulty(Difficulty.MEDIUM)
                .build();

        mockMvc.perform(put("/api/questions/" + question.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.questionText", is("Admin updated question text")));
    }

    @Test
    @DisplayName("Update question - Non-existent question returns 404 Not Found")
    void updateQuestion_invalidQuestion_returnsNotFound() throws Exception {
        UpdateQuestionRequest updateRequest = UpdateQuestionRequest.builder()
                .questionText("Question text")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .build();

        mockMvc.perform(put("/api/questions/9999")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Delete question - Owner of parent experience can delete question (200 OK)")
    void deleteQuestion_asExperienceOwner_returnsOk() throws Exception {
        Question question = questionRepository.save(Question.builder()
                .round(round)
                .questionText("Question to be deleted")
                .questionType(QuestionType.HR)
                .difficulty(Difficulty.EASY)
                .build());

        mockMvc.perform(delete("/api/questions/" + question.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Question deleted successfully")));

        assertThat(questionRepository.existsById(question.getId())).isFalse();
    }

    @Test
    @DisplayName("Delete question - Non-owner user should receive 403 Forbidden")
    void deleteQuestion_asNonOwner_returnsForbidden() throws Exception {
        Question question = questionRepository.save(Question.builder()
                .round(round)
                .questionText("Question that cannot be deleted by other")
                .questionType(QuestionType.HR)
                .difficulty(Difficulty.EASY)
                .build());

        mockMvc.perform(delete("/api/questions/" + question.getId())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));

        assertThat(questionRepository.existsById(question.getId())).isTrue();
    }

    @Test
    @DisplayName("Delete question - Admin can delete any question (200 OK)")
    void deleteQuestion_asAdmin_returnsOk() throws Exception {
        Question question = questionRepository.save(Question.builder()
                .round(round)
                .questionText("Question to be deleted by admin")
                .questionType(QuestionType.BEHAVIORAL)
                .difficulty(Difficulty.EASY)
                .build());

        mockMvc.perform(delete("/api/questions/" + question.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        assertThat(questionRepository.existsById(question.getId())).isFalse();
    }

    @Test
    @DisplayName("Delete question - Non-existent question returns 404 Not Found")
    void deleteQuestion_invalidQuestion_returnsNotFound() throws Exception {
        mockMvc.perform(delete("/api/questions/9999")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Get all questions - Zero parameters returns all questions across platform")
    void getAllQuestions_returnsAllQuestions() throws Exception {
        questionRepository.save(Question.builder()
                .round(round)
                .questionText("Question 1")
                .questionType(QuestionType.JAVA)
                .difficulty(Difficulty.EASY)
                .build());
        questionRepository.save(Question.builder()
                .round(round)
                .questionText("Question 2")
                .questionType(QuestionType.DSA)
                .difficulty(Difficulty.MEDIUM)
                .build());

        mockMvc.perform(get("/api/questions")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }
}
