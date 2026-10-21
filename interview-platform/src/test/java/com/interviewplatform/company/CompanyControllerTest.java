package com.interviewplatform.company;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewplatform.company.dto.CreateCompanyRequest;
import com.interviewplatform.company.dto.PatchCompanyRequest;
import com.interviewplatform.company.dto.UpdateCompanyRequest;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CompanyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.interviewplatform.question.repository.QuestionRepository questionRepository;

    @Autowired
    private com.interviewplatform.round.repository.InterviewRoundRepository roundRepository;

    @Autowired
    private com.interviewplatform.experience.repository.InterviewExperienceRepository experienceRepository;

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

    private String userToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        questionRepository.deleteAll();
        roundRepository.deleteAll();
        experienceRepository.deleteAll();
        companyRepository.deleteAll();
        userRepository.deleteAll();

        // Create standard user
        userRepository.save(User.builder()
                .name("Normal User")
                .email("user@example.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build());

        // Create admin user
        userRepository.save(User.builder()
                .name("Admin User")
                .email("admin@example.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build());

        var userDetails = userDetailsService.loadUserByUsername("user@example.com");
        userToken = jwtService.generateToken(userDetails);

        var adminDetails = userDetailsService.loadUserByUsername("admin@example.com");
        adminToken = jwtService.generateToken(adminDetails);
    }

    @Test
    @DisplayName("USER should be able to create a company (201) when authenticated")
    void userCanCreateCompany() throws Exception {
        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .name("Stripe")
                .website("https://stripe.com")
                .description("Fintech payments")
                .build();

        mockMvc.perform(post("/api/companies")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Stripe")));
    }

    @Test
    @DisplayName("USER should be forbidden (403) from deleting a company")
    void userCannotDeleteCompany() throws Exception {
        mockMvc.perform(delete("/api/companies/1")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN should be able to create a company (201)")
    void adminCanCreateCompany() throws Exception {
        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .name("Google")
                .website("https://google.com")
                .description("Search engine giant")
                .logo("https://google.com/logo.png")
                .build();

        mockMvc.perform(post("/api/companies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andExpect(jsonPath("$.data.name", is("Google")))
                .andExpect(jsonPath("$.data.website", is("https://google.com")))
                .andExpect(jsonPath("$.data.description", is("Search engine giant")));

        assertThat(companyRepository.existsByNameIgnoreCase("Google")).isTrue();
    }

    @Test
    @DisplayName("Creating company with duplicate name should return 409 Conflict")
    void duplicateCompanyNameReturnsConflict() throws Exception {
        companyRepository.save(Company.builder()
                .name("Google")
                .website("https://google.com")
                .build());

        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .name("google")
                .website("https://google.com")
                .build();

        mockMvc.perform(post("/api/companies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Company with name 'google' already exists")));
    }

    @Test
    @DisplayName("Creating company with blank name should return 400 Bad Request")
    void blankNameReturnsBadRequest() throws Exception {
        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .name("   ")
                .website("https://google.com")
                .build();

        mockMvc.perform(post("/api/companies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.errors.name", is("Company name is required")));
    }

    @Test
    @DisplayName("Creating company with invalid website format should return 400 Bad Request")
    void invalidWebsiteReturnsBadRequest() throws Exception {
        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .name("Google")
                .website("invalid website url")
                .build();

        mockMvc.perform(post("/api/companies")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.errors.website", is("Invalid website URL format")));
    }

    @Test
    @DisplayName("USER can view all companies (200 OK)")
    void userCanViewCompanies() throws Exception {
        companyRepository.save(Company.builder().name("Google").website("https://google.com").build());
        companyRepository.save(Company.builder().name("Microsoft").website("https://microsoft.com").build());

        mockMvc.perform(get("/api/companies")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    @DisplayName("USER can search companies by name (200 OK)")
    void userCanSearchCompanies() throws Exception {
        companyRepository.save(Company.builder().name("Google").website("https://google.com").build());
        companyRepository.save(Company.builder().name("Microsoft").website("https://microsoft.com").build());

        mockMvc.perform(get("/api/companies?search=soft")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name", is("Microsoft")));
    }

    @Test
    @DisplayName("USER can search companies via /search endpoint (200 OK)")
    void userCanSearchCompaniesEndpoint() throws Exception {
        companyRepository.save(Company.builder().name("Google").website("https://google.com").build());
        companyRepository.save(Company.builder().name("Microsoft").website("https://microsoft.com").build());

        mockMvc.perform(get("/api/companies/search?search=Goo")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name", is("Google")));
    }

    @Test
    @DisplayName("USER can view company by ID (200 OK)")
    void userCanViewCompanyById() throws Exception {
        Company company = companyRepository.save(Company.builder()
                .name("Amazon")
                .website("https://amazon.com")
                .description("Cloud and e-commerce")
                .build());

        mockMvc.perform(get("/api/companies/" + company.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(company.getId().intValue())))
                .andExpect(jsonPath("$.data.name", is("Amazon")));
    }

    @Test
    @DisplayName("Getting non-existent company ID returns 404 Not Found")
    void nonExistentCompanyReturns404() throws Exception {
        mockMvc.perform(get("/api/companies/999999")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Company not found with id: 999999")));
    }

    @Test
    @DisplayName("USER cannot update company (403 Forbidden)")
    void userCannotUpdateCompany() throws Exception {
        Company company = companyRepository.save(Company.builder().name("Meta").build());

        UpdateCompanyRequest request = UpdateCompanyRequest.builder()
                .name("Meta Platforms")
                .build();

        mockMvc.perform(put("/api/companies/" + company.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("ADMIN can update company (200 OK)")
    void adminCanUpdateCompany() throws Exception {
        Company company = companyRepository.save(Company.builder().name("Meta").build());

        UpdateCompanyRequest request = UpdateCompanyRequest.builder()
                .name("Meta Platforms")
                .website("https://meta.com")
                .description("Social technology company")
                .build();

        mockMvc.perform(put("/api/companies/" + company.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Meta Platforms")))
                .andExpect(jsonPath("$.data.website", is("https://meta.com")));

        assertThat(companyRepository.findById(company.getId()).get().getName()).isEqualTo("Meta Platforms");
    }

    @Test
    @DisplayName("USER cannot delete company (403 Forbidden)")
    void userCannotDeleteCompanyForbidden() throws Exception {
        Company company = companyRepository.save(Company.builder().name("Twitter").build());

        mockMvc.perform(delete("/api/companies/" + company.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("ADMIN can delete company (200 OK)")
    void adminCanDeleteCompany() throws Exception {
        Company company = companyRepository.save(Company.builder().name("Twitter").build());

        mockMvc.perform(delete("/api/companies/" + company.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Company deleted successfully")));

        assertThat(companyRepository.existsById(company.getId())).isFalse();
    }

    @Test
    @DisplayName("ADMIN can patch company (200 OK) - Partial update preserves other fields")
    void adminCanPatchCompany() throws Exception {
        Company company = companyRepository.save(Company.builder()
                .name("Stripe")
                .logo("https://stripe.com/logo.png")
                .website("https://stripe.com")
                .description("Financial infrastructure for the internet")
                .build());

        PatchCompanyRequest patchRequest = PatchCompanyRequest.builder()
                .description("Updated: Global payment processor")
                .build();

        mockMvc.perform(patch("/api/companies/" + company.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Stripe")))
                .andExpect(jsonPath("$.data.description", is("Updated: Global payment processor")))
                .andExpect(jsonPath("$.data.website", is("https://stripe.com")));

        Company updated = companyRepository.findById(company.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Stripe");
        assertThat(updated.getDescription()).isEqualTo("Updated: Global payment processor");
    }

    @Test
    @DisplayName("USER cannot patch company (403 Forbidden)")
    void userCannotPatchCompany() throws Exception {
        Company company = companyRepository.save(Company.builder().name("Airbnb").build());

        PatchCompanyRequest patchRequest = PatchCompanyRequest.builder()
                .description("Unauthorized update")
                .build();

        mockMvc.perform(patch("/api/companies/" + company.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
