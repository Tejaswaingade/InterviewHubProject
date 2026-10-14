package com.interviewplatform.experience;

import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
import com.interviewplatform.experience.dto.CreateExperienceRequest;
import com.interviewplatform.experience.dto.ExperienceResponse;
import com.interviewplatform.experience.dto.UpdateExperienceRequest;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.experience.service.InterviewExperienceService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewExperienceServiceTest {

    @Mock
    private InterviewExperienceRepository experienceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private InterviewExperienceService experienceService;

    private User owner;
    private User otherUser;
    private Company company;
    private Company newCompany;
    private InterviewExperience experience;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .role(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();

        otherUser = User.builder()
                .id(2L)
                .name("Bob")
                .email("bob@example.com")
                .role(Role.USER)
                .createdAt(LocalDateTime.now())
                .build();

        company = Company.builder()
                .id(10L)
                .name("Google")
                .website("https://google.com")
                .createdAt(LocalDateTime.now())
                .build();

        newCompany = Company.builder()
                .id(20L)
                .name("Amazon")
                .website("https://amazon.com")
                .createdAt(LocalDateTime.now())
                .build();

        experience = InterviewExperience.builder()
                .id(100L)
                .user(owner)
                .company(company)
                .jobRole("Software Engineer")
                .experienceTitle("Google SDE 2 Interview")
                .description("4 rounds of coding and system design")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(3.5)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Create experience - Success: Saves and returns ExperienceResponse")
    void create_success() {
        CreateExperienceRequest request = CreateExperienceRequest.builder()
                .companyId(10L)
                .jobRole("Software Engineer")
                .experienceTitle("Google SDE 2 Interview")
                .description("4 rounds")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(3.5)
                .build();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(owner));
        when(companyRepository.findById(10L)).thenReturn(Optional.of(company));
        when(experienceRepository.save(any(InterviewExperience.class))).thenReturn(experience);

        ExperienceResponse response = experienceService.create(request, "alice@example.com");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getJobRole()).isEqualTo("Software Engineer");
        assertThat(response.getUser().getEmail()).isEqualTo("alice@example.com");
        assertThat(response.getCompany().getName()).isEqualTo("Google");
        verify(experienceRepository).save(any(InterviewExperience.class));
    }

    @Test
    @DisplayName("Create experience - User Not Found: Throws ResourceNotFoundException")
    void create_userNotFound_throwsException() {
        CreateExperienceRequest request = CreateExperienceRequest.builder().companyId(10L).build();
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> experienceService.create(request, "unknown@example.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found with email: unknown@example.com");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create experience - Company Not Found: Throws ResourceNotFoundException")
    void create_companyNotFound_throwsException() {
        CreateExperienceRequest request = CreateExperienceRequest.builder().companyId(999L).build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(owner));
        when(companyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> experienceService.create(request, "alice@example.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Company not found with id: 999");
    }

    @Test
    @DisplayName("GetById - Success: Returns ExperienceResponse")
    void getById_success() {
        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));

        ExperienceResponse response = experienceService.getById(100L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getExperienceTitle()).isEqualTo("Google SDE 2 Interview");
    }

    @Test
    @DisplayName("GetById - Not Found: Throws ResourceNotFoundException")
    void getById_notFound_throwsException() {
        when(experienceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> experienceService.getById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Interview experience not found with id: 999");
    }

    @Test
    @DisplayName("Update experience - Success as Owner: Updates and returns ExperienceResponse")
    void update_asOwner_success() {
        UpdateExperienceRequest request = UpdateExperienceRequest.builder()
                .companyId(20L)
                .jobRole("Senior SDE")
                .experienceTitle("Updated Title")
                .description("Updated description")
                .overallDifficulty(Difficulty.MEDIUM)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(4.0)
                .build();

        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));
        when(companyRepository.findById(20L)).thenReturn(Optional.of(newCompany));
        when(experienceRepository.save(any(InterviewExperience.class))).thenAnswer(i -> i.getArgument(0));

        ExperienceResponse response = experienceService.update(100L, request, "alice@example.com", false);

        assertThat(response).isNotNull();
        assertThat(response.getJobRole()).isEqualTo("Senior SDE");
        assertThat(response.getExperienceTitle()).isEqualTo("Updated Title");
        assertThat(response.getCompany().getName()).isEqualTo("Amazon");
        assertThat(response.getYearsOfExperience()).isEqualTo(4.0);
    }

    @Test
    @DisplayName("Update experience - Success as Admin: Updates any experience")
    void update_asAdmin_success() {
        UpdateExperienceRequest request = UpdateExperienceRequest.builder()
                .jobRole("Admin Edited Role")
                .experienceTitle("Admin Title")
                .description("Admin Description")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(5.0)
                .build();

        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));
        when(experienceRepository.save(any(InterviewExperience.class))).thenAnswer(i -> i.getArgument(0));

        ExperienceResponse response = experienceService.update(100L, request, "admin@example.com", true);

        assertThat(response).isNotNull();
        assertThat(response.getJobRole()).isEqualTo("Admin Edited Role");
    }

    @Test
    @DisplayName("Update experience - Unauthorized user: Throws AccessDeniedException")
    void update_unauthorized_throwsAccessDenied() {
        UpdateExperienceRequest request = UpdateExperienceRequest.builder()
                .jobRole("Hacker Role")
                .build();

        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));

        assertThatThrownBy(() -> experienceService.update(100L, request, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to update this experience");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Delete experience - Success as Owner: Deletes experience")
    void delete_asOwner_success() {
        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));

        experienceService.delete(100L, "alice@example.com", false);

        verify(experienceRepository).delete(experience);
    }

    @Test
    @DisplayName("Delete experience - Success as Admin: Deletes experience")
    void delete_asAdmin_success() {
        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));

        experienceService.delete(100L, "admin@example.com", true);

        verify(experienceRepository).delete(experience);
    }

    @Test
    @DisplayName("Delete experience - Unauthorized user: Throws AccessDeniedException")
    void delete_unauthorized_throwsAccessDenied() {
        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));

        assertThatThrownBy(() -> experienceService.delete(100L, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to delete this experience");

        verify(experienceRepository, never()).delete(any(InterviewExperience.class));
    }

    @Test
    @DisplayName("GetAll - Supports filtering and pagination")
    void getAll_withFilters_returnsPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<InterviewExperience> mockPage = new PageImpl<>(List.of(experience), pageable, 1);

        when(experienceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ExperienceResponse> result = experienceService.getAll(pageable, 10L, Difficulty.HARD, "Software");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getExperienceTitle()).isEqualTo("Google SDE 2 Interview");
    }

    @Test
    @DisplayName("Search - By keyword with pagination")
    void search_withKeyword_returnsPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<InterviewExperience> mockPage = new PageImpl<>(List.of(experience), pageable, 1);

        when(experienceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(mockPage);

        Page<ExperienceResponse> result = experienceService.search("Google", pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getExperienceTitle()).isEqualTo("Google SDE 2 Interview");
    }

    @Test
    @DisplayName("GetMyExperiences - Returns experiences of authenticated user")
    void getMyExperiences_success() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<InterviewExperience> mockPage = new PageImpl<>(List.of(experience), pageable, 1);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(owner));
        when(experienceRepository.findByUserId(1L, pageable)).thenReturn(mockPage);

        Page<ExperienceResponse> result = experienceService.getMyExperiences("alice@example.com", pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getUser().getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    @DisplayName("GetAllExperiencesList - Returns unpaged list of all experiences")
    void getAllExperiencesList_returnsAll() {
        when(experienceRepository.findAll()).thenReturn(List.of(experience));

        List<ExperienceResponse> list = experienceService.getAllExperiencesList();

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getExperienceTitle()).isEqualTo("Google SDE 2 Interview");
    }
}
