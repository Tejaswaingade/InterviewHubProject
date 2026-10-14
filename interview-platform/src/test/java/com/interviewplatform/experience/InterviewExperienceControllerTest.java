package com.interviewplatform.experience;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
import com.interviewplatform.experience.dto.CreateExperienceRequest;
import com.interviewplatform.experience.dto.UpdateExperienceRequest;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
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
class InterviewExperienceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.interviewplatform.question.repository.QuestionRepository questionRepository;

    @Autowired
    private com.interviewplatform.round.repository.InterviewRoundRepository roundRepository;

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

    private User user1;
    private User user2;
    private User adminUser;
    private Company testCompany;

    private String user1Token;
    private String user2Token;
    private String adminToken;

    @BeforeEach
    void setUp() {
        questionRepository.deleteAll();
        roundRepository.deleteAll();
        experienceRepository.deleteAll();
        companyRepository.deleteAll();
        userRepository.deleteAll();

        user1 = userRepository.save(User.builder()
                .name("User One")
                .email("user1@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        user2 = userRepository.save(User.builder()
                .name("User Two")
                .email("user2@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        adminUser = userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@example.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build());

        testCompany = companyRepository.save(Company.builder()
                .name("Google")
                .website("https://google.com")
                .description("Tech company")
                .build());

        UserDetails user1Details = userDetailsService.loadUserByUsername(user1.getEmail());
        user1Token = jwtService.generateToken(user1Details);

        UserDetails user2Details = userDetailsService.loadUserByUsername(user2.getEmail());
        user2Token = jwtService.generateToken(user2Details);

        UserDetails adminDetails = userDetailsService.loadUserByUsername(adminUser.getEmail());
        adminToken = jwtService.generateToken(adminDetails);
    }

    @Test
    @DisplayName("Create experience - Authenticated user should succeed with 201 Created")
    void createExperience_authenticated_shouldReturnCreated() throws Exception {
        CreateExperienceRequest request = CreateExperienceRequest.builder()
                .companyId(testCompany.getId())
                .jobRole("Software Engineer")
                .experienceTitle("Google L4 Interview Experience")
                .description("Technical screening followed by 4 onsite rounds.")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(3.5)
                .build();

        mockMvc.perform(post("/api/experiences")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Interview experience created successfully")))
                .andExpect(jsonPath("$.data.jobRole", is("Software Engineer")))
                .andExpect(jsonPath("$.data.experienceTitle", is("Google L4 Interview Experience")))
                .andExpect(jsonPath("$.data.overallDifficulty", is("HARD")))
                .andExpect(jsonPath("$.data.result", is("SELECTED")))
                .andExpect(jsonPath("$.data.yearsOfExperience", is(3.5)))
                .andExpect(jsonPath("$.data.user.email", is("user1@example.com")))
                .andExpect(jsonPath("$.data.company.name", is("Google")));

        assertThat(experienceRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Create experience - Unauthenticated request should return 401 Unauthorized")
    void createExperience_unauthenticated_shouldReturnUnauthorized() throws Exception {
        CreateExperienceRequest request = CreateExperienceRequest.builder()
                .companyId(testCompany.getId())
                .jobRole("Software Engineer")
                .experienceTitle("Title")
                .description("Description")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.WAITING)
                .yearsOfExperience(2.0)
                .build();

        mockMvc.perform(post("/api/experiences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Create experience - Non-existent company should return 404 Not Found")
    void createExperience_nonExistentCompany_shouldReturnNotFound() throws Exception {
        CreateExperienceRequest request = CreateExperienceRequest.builder()
                .companyId(9999L)
                .jobRole("Backend Developer")
                .experienceTitle("Experience")
                .description("Description")
                .overallDifficulty(Difficulty.EASY)
                .result(ResultStatus.SELECTED)
                .build();

        mockMvc.perform(post("/api/experiences")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Create experience - Blank required fields should return 400 Bad Request")
    void createExperience_invalidInput_shouldReturnBadRequest() throws Exception {
        CreateExperienceRequest request = CreateExperienceRequest.builder()
                .companyId(testCompany.getId())
                .jobRole("")
                .experienceTitle("")
                .description("")
                .build();

        mockMvc.perform(post("/api/experiences")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Get experience by ID - Existing ID should return 200 OK")
    void getExperienceById_found_shouldReturnOk() throws Exception {
        InterviewExperience exp = experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("SDE 2")
                .experienceTitle("SDE 2 Interview")
                .description("Good experience")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(2.0)
                .build());

        mockMvc.perform(get("/api/experiences/" + exp.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(exp.getId().intValue())))
                .andExpect(jsonPath("$.data.experienceTitle", is("SDE 2 Interview")));
    }

    @Test
    @DisplayName("Get experience by ID - Non-existent ID should return 404 Not Found")
    void getExperienceById_notFound_shouldReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/experiences/9999")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Get all experiences - Supports pagination and sorting")
    void getAllExperiences_withPagination_shouldReturnPage() throws Exception {
        for (int i = 1; i <= 5; i++) {
            experienceRepository.save(InterviewExperience.builder()
                    .user(user1)
                    .company(testCompany)
                    .jobRole("Role " + i)
                    .experienceTitle("Experience " + i)
                    .description("Description " + i)
                    .overallDifficulty(Difficulty.MEDIUM)
                    .result(ResultStatus.SELECTED)
                    .yearsOfExperience(1.0 * i)
                    .build());
        }

        mockMvc.perform(get("/api/experiences?page=0&size=3&sort=createdAt,desc")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(3)))
                .andExpect(jsonPath("$.data.totalElements", is(5)))
                .andExpect(jsonPath("$.data.totalPages", is(2)));
    }

    @Test
    @DisplayName("Get all experiences list - Zero parameters returns all experiences in a list")
    void getAllExperiencesList_noParams_shouldReturnList() throws Exception {
        for (int i = 1; i <= 3; i++) {
            experienceRepository.save(InterviewExperience.builder()
                    .user(user1)
                    .company(testCompany)
                    .jobRole("Role " + i)
                    .experienceTitle("Experience " + i)
                    .description("Description " + i)
                    .overallDifficulty(Difficulty.MEDIUM)
                    .result(ResultStatus.SELECTED)
                    .yearsOfExperience(1.0 * i)
                    .build());
        }

        mockMvc.perform(get("/api/experiences/all")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(3)));
    }

    @Test
    @DisplayName("Get my experiences - Should only return experiences created by current user")
    void getMyExperiences_shouldReturnOnlyCurrentUserExperiences() throws Exception {
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("User1 Role")
                .experienceTitle("User1 Title")
                .description("Desc")
                .overallDifficulty(Difficulty.EASY)
                .result(ResultStatus.SELECTED)
                .build());

        experienceRepository.save(InterviewExperience.builder()
                .user(user2)
                .company(testCompany)
                .jobRole("User2 Role")
                .experienceTitle("User2 Title")
                .description("Desc")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.REJECTED)
                .build());

        mockMvc.perform(get("/api/experiences/my")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].experienceTitle", is("User1 Title")))
                .andExpect(jsonPath("$.data.content[0].user.email", is("user1@example.com")));
    }

    @Test
    @DisplayName("Update experience - Owner can successfully update")
    void updateExperience_asOwner_shouldReturnOk() throws Exception {
        InterviewExperience exp = experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Junior Dev")
                .experienceTitle("Original Title")
                .description("Original description")
                .overallDifficulty(Difficulty.EASY)
                .result(ResultStatus.WAITING)
                .yearsOfExperience(1.0)
                .build());

        UpdateExperienceRequest updateRequest = UpdateExperienceRequest.builder()
                .companyId(testCompany.getId())
                .jobRole("Senior Dev")
                .experienceTitle("Updated Title")
                .description("Updated description")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(4.0)
                .build();

        mockMvc.perform(put("/api/experiences/" + exp.getId())
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.jobRole", is("Senior Dev")))
                .andExpect(jsonPath("$.data.experienceTitle", is("Updated Title")))
                .andExpect(jsonPath("$.data.overallDifficulty", is("HARD")))
                .andExpect(jsonPath("$.data.result", is("SELECTED")));
    }

    @Test
    @DisplayName("Update experience - Non-owner user should receive 403 Forbidden")
    void updateExperience_asNonOwner_shouldReturnForbidden() throws Exception {
        InterviewExperience exp = experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Dev")
                .experienceTitle("User 1 Title")
                .description("Desc")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        UpdateExperienceRequest updateRequest = UpdateExperienceRequest.builder()
                .jobRole("Hacked Role")
                .experienceTitle("Hacked Title")
                .description("Hacked Desc")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.REJECTED)
                .build();

        mockMvc.perform(put("/api/experiences/" + exp.getId())
                        .header("Authorization", "Bearer " + user2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Update experience - Admin can update any experience")
    void updateExperience_asAdmin_shouldReturnOk() throws Exception {
        InterviewExperience exp = experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Dev")
                .experienceTitle("User 1 Title")
                .description("Desc")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        UpdateExperienceRequest updateRequest = UpdateExperienceRequest.builder()
                .jobRole("Admin Modified Role")
                .experienceTitle("Admin Modified Title")
                .description("Admin Modified Desc")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .build();

        mockMvc.perform(put("/api/experiences/" + exp.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.jobRole", is("Admin Modified Role")));
    }

    @Test
    @DisplayName("Delete experience - Owner can successfully delete")
    void deleteExperience_asOwner_shouldReturnOk() throws Exception {
        InterviewExperience exp = experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Dev")
                .experienceTitle("Title to delete")
                .description("Desc")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(delete("/api/experiences/" + exp.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Interview experience deleted successfully")));

        assertThat(experienceRepository.existsById(exp.getId())).isFalse();
    }

    @Test
    @DisplayName("Delete experience - Non-owner user should receive 403 Forbidden")
    void deleteExperience_asNonOwner_shouldReturnForbidden() throws Exception {
        InterviewExperience exp = experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Dev")
                .experienceTitle("Title")
                .description("Desc")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(delete("/api/experiences/" + exp.getId())
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));

        assertThat(experienceRepository.existsById(exp.getId())).isTrue();
    }

    @Test
    @DisplayName("Delete experience - Admin can delete any experience")
    void deleteExperience_asAdmin_shouldReturnOk() throws Exception {
        InterviewExperience exp = experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Dev")
                .experienceTitle("Title to delete by admin")
                .description("Desc")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(delete("/api/experiences/" + exp.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        assertThat(experienceRepository.existsById(exp.getId())).isFalse();
    }

    @Test
    @DisplayName("Filter experiences by companyId - returns matching experiences")
    void filterExperiences_byCompanyId() throws Exception {
        Company otherCompany = companyRepository.save(Company.builder()
                .name("Microsoft")
                .website("https://microsoft.com")
                .description("Software company")
                .build());

        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("SDE 1")
                .experienceTitle("Google SDE 1")
                .description("Google interview")
                .overallDifficulty(Difficulty.EASY)
                .result(ResultStatus.SELECTED)
                .build());

        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(otherCompany)
                .jobRole("SDE 1")
                .experienceTitle("MS SDE 1")
                .description("MS interview")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(get("/api/experiences?companyId=" + testCompany.getId())
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].company.name", is("Google")));
    }

    @Test
    @DisplayName("Filter experiences by difficulty - returns matching experiences")
    void filterExperiences_byDifficulty() throws Exception {
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Dev")
                .experienceTitle("Easy Exp")
                .description("Desc")
                .overallDifficulty(Difficulty.EASY)
                .result(ResultStatus.SELECTED)
                .build());

        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Dev")
                .experienceTitle("Hard Exp")
                .description("Desc")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.REJECTED)
                .build());

        mockMvc.perform(get("/api/experiences?difficulty=HARD")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].overallDifficulty", is("HARD")));
    }

    @Test
    @DisplayName("Filter experiences by jobRole - case-insensitive substring match")
    void filterExperiences_byJobRole() throws Exception {
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Senior Java Developer")
                .experienceTitle("Java Exp")
                .description("Desc")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("DevOps Engineer")
                .experienceTitle("DevOps Exp")
                .description("Desc")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(get("/api/experiences?jobRole=java")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].jobRole", is("Senior Java Developer")));
    }

    @Test
    @DisplayName("Combined filters - companyId + difficulty + jobRole matches all criteria")
    void filterExperiences_combinedFilters() throws Exception {
        Company otherCompany = companyRepository.save(Company.builder()
                .name("Netflix")
                .website("https://netflix.com")
                .description("Streaming company")
                .build());

        // Target match: testCompany + HARD + Java Developer
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Java Developer")
                .experienceTitle("Target Experience")
                .description("Desc")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .build());

        // Same company, different difficulty
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Java Developer")
                .experienceTitle("Wrong Difficulty")
                .description("Desc")
                .overallDifficulty(Difficulty.EASY)
                .result(ResultStatus.SELECTED)
                .build());

        // Different company, same difficulty & role
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(otherCompany)
                .jobRole("Java Developer")
                .experienceTitle("Wrong Company")
                .description("Desc")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(get("/api/experiences")
                        .param("companyId", testCompany.getId().toString())
                        .param("difficulty", "HARD")
                        .param("jobRole", "Java Developer")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].experienceTitle", is("Target Experience")));
    }

    @Test
    @DisplayName("Keyword search in title - matches experienceTitle")
    void searchExperiences_byKeywordInTitle() throws Exception {
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Backend Engineer")
                .experienceTitle("Spring Boot Microservices Interview")
                .description("Focused on Kafka and Redis.")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .build());

        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Frontend Engineer")
                .experienceTitle("React Native Interview")
                .description("Focused on mobile UI.")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(get("/api/experiences/search?keyword=spring")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].experienceTitle", is("Spring Boot Microservices Interview")));
    }

    @Test
    @DisplayName("Keyword search in description - matches description")
    void searchExperiences_byKeywordInDescription() throws Exception {
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Cloud Architect")
                .experienceTitle("General Interview")
                .description("Extensive questions on Kubernetes container orchestration and helm.")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(get("/api/experiences/search?keyword=kubernetes")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].experienceTitle", is("General Interview")));
    }

    @Test
    @DisplayName("Keyword search - case-insensitive match")
    void searchExperiences_caseInsensitive() throws Exception {
        experienceRepository.save(InterviewExperience.builder()
                .user(user1)
                .company(testCompany)
                .jobRole("Backend Engineer")
                .experienceTitle("spring batch processing")
                .description("batch jobs with chunk processing")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .build());

        mockMvc.perform(get("/api/experiences/search?keyword=SPRING")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    @DisplayName("Keyword search - verifies pagination and sorting metadata")
    void searchExperiences_withPaginationAndSorting() throws Exception {
        for (int i = 1; i <= 5; i++) {
            experienceRepository.save(InterviewExperience.builder()
                    .user(user1)
                    .company(testCompany)
                    .jobRole("Role " + i)
                    .experienceTitle("Spring Experience " + i)
                    .description("Spring interview description " + i)
                    .overallDifficulty(Difficulty.MEDIUM)
                    .result(ResultStatus.SELECTED)
                    .build());
        }

        mockMvc.perform(get("/api/experiences/search?keyword=spring&page=0&size=2&sort=createdAt,desc")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.page", is(0)))
                .andExpect(jsonPath("$.data.size", is(2)))
                .andExpect(jsonPath("$.data.totalElements", is(5)))
                .andExpect(jsonPath("$.data.totalPages", is(3)))
                .andExpect(jsonPath("$.data.first", is(true)))
                .andExpect(jsonPath("$.data.last", is(false)));
    }
}
