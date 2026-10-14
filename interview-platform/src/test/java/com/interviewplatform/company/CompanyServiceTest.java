package com.interviewplatform.company;

import com.interviewplatform.common.exception.DuplicateResourceException;
import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.company.dto.CompanyResponse;
import com.interviewplatform.company.dto.CreateCompanyRequest;
import com.interviewplatform.company.dto.UpdateCompanyRequest;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.company.service.CompanyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private InterviewExperienceRepository experienceRepository;

    @InjectMocks
    private CompanyService companyService;

    private Company google;
    private Company microsoft;

    @BeforeEach
    void setUp() {
        google = Company.builder()
                .id(1L)
                .name("Google")
                .website("https://google.com")
                .logo("https://google.com/logo.png")
                .description("Search and tech")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        microsoft = Company.builder()
                .id(2L)
                .name("Microsoft")
                .website("https://microsoft.com")
                .description("Software giant")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Create company - Success: Saves and returns CompanyResponse")
    void create_success() {
        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .name("  Google  ")
                .website(" https://google.com ")
                .logo("https://google.com/logo.png")
                .description("Search and tech")
                .build();

        when(companyRepository.existsByNameIgnoreCase("Google")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenReturn(google);

        CompanyResponse response = companyService.create(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Google");
        assertThat(response.getWebsite()).isEqualTo("https://google.com");
        verify(companyRepository).existsByNameIgnoreCase("Google");
        verify(companyRepository).save(any(Company.class));
    }

    @Test
    @DisplayName("Create company - Duplicate name: Throws DuplicateResourceException")
    void create_duplicateName_throwsException() {
        CreateCompanyRequest request = CreateCompanyRequest.builder()
                .name("Google")
                .website("https://google.com")
                .build();

        when(companyRepository.existsByNameIgnoreCase("Google")).thenReturn(true);

        assertThatThrownBy(() -> companyService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Company with name 'Google' already exists");

        verify(companyRepository, never()).save(any());
    }

    @Test
    @DisplayName("GetById - Success: Returns CompanyResponse")
    void getById_success() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(google));

        CompanyResponse response = companyService.getById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Google");
    }

    @Test
    @DisplayName("GetById - Not Found: Throws ResourceNotFoundException")
    void getById_notFound_throwsException() {
        when(companyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.getById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Company not found with id: 999");
    }

    @Test
    @DisplayName("GetAll - Returns all companies")
    void getAll_returnsList() {
        when(companyRepository.findAll()).thenReturn(List.of(google, microsoft));

        List<CompanyResponse> companies = companyService.getAll();

        assertThat(companies).hasSize(2);
        assertThat(companies.get(0).getName()).isEqualTo("Google");
        assertThat(companies.get(1).getName()).isEqualTo("Microsoft");
    }

    @Test
    @DisplayName("Search - Query provided: Returns matching companies")
    void search_withQuery_returnsMatching() {
        when(companyRepository.findByNameContainingIgnoreCase("soft")).thenReturn(List.of(microsoft));

        List<CompanyResponse> result = companyService.search(" soft ");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Microsoft");
        verify(companyRepository).findByNameContainingIgnoreCase("soft");
    }

    @Test
    @DisplayName("Search - Blank query: Falls back to getAll()")
    void search_blankQuery_returnsAll() {
        when(companyRepository.findAll()).thenReturn(List.of(google, microsoft));

        List<CompanyResponse> result = companyService.search("   ");

        assertThat(result).hasSize(2);
        verify(companyRepository).findAll();
        verify(companyRepository, never()).findByNameContainingIgnoreCase(any());
    }

    @Test
    @DisplayName("Update company - Success: Updates details and returns CompanyResponse")
    void update_success() {
        UpdateCompanyRequest request = UpdateCompanyRequest.builder()
                .name("Alphabet")
                .website("https://abc.xyz")
                .description("Parent company of Google")
                .logo("https://abc.xyz/logo.png")
                .build();

        when(companyRepository.findById(1L)).thenReturn(Optional.of(google));
        when(companyRepository.existsByNameIgnoreCaseAndIdNot("Alphabet", 1L)).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CompanyResponse response = companyService.update(1L, request);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Alphabet");
        assertThat(response.getWebsite()).isEqualTo("https://abc.xyz");
        assertThat(response.getDescription()).isEqualTo("Parent company of Google");
    }

    @Test
    @DisplayName("Update company - Not found: Throws ResourceNotFoundException")
    void update_notFound_throwsException() {
        UpdateCompanyRequest request = UpdateCompanyRequest.builder().name("New").build();

        when(companyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.update(999L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Company not found with id: 999");
    }

    @Test
    @DisplayName("Update company - Duplicate name on another company: Throws DuplicateResourceException")
    void update_duplicateNameOnOtherCompany_throwsException() {
        UpdateCompanyRequest request = UpdateCompanyRequest.builder()
                .name("Microsoft")
                .build();

        when(companyRepository.findById(1L)).thenReturn(Optional.of(google));
        when(companyRepository.existsByNameIgnoreCaseAndIdNot("Microsoft", 1L)).thenReturn(true);

        assertThatThrownBy(() -> companyService.update(1L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("Company with name 'Microsoft' already exists");

        verify(companyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Delete company - Success: Deletes company")
    void delete_success() {
        when(companyRepository.findById(1L)).thenReturn(Optional.of(google));
        when(experienceRepository.findByCompanyId(1L)).thenReturn(java.util.Collections.emptyList());

        companyService.delete(1L);

        verify(companyRepository).delete(google);
    }

    @Test
    @DisplayName("Delete company - Not found: Throws ResourceNotFoundException")
    void delete_notFound_throwsException() {
        when(companyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> companyService.delete(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Company not found with id: 999");

        verify(companyRepository, never()).delete(any());
    }
}
