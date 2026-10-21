package com.interviewplatform.experience.service;

import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.company.dto.CompanyResponse;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
import com.interviewplatform.experience.dto.CreateExperienceRequest;
import com.interviewplatform.experience.dto.ExperienceResponse;
import com.interviewplatform.experience.dto.PatchExperienceRequest;
import com.interviewplatform.experience.dto.UpdateExperienceRequest;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.user.dto.UserResponse;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class InterviewExperienceService {

    private final InterviewExperienceRepository experienceRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public InterviewExperienceService(
            InterviewExperienceRepository experienceRepository,
            UserRepository userRepository,
            CompanyRepository companyRepository
    ) {
        this.experienceRepository = experienceRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public ExperienceResponse create(CreateExperienceRequest request, String currentUserEmail) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + currentUserEmail));

        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + request.getCompanyId()));

        InterviewExperience experience = InterviewExperience.builder()
                .user(user)
                .company(company)
                .jobRole(request.getJobRole())
                .experienceTitle(request.getExperienceTitle())
                .description(request.getDescription())
                .overallDifficulty(request.getOverallDifficulty())
                .result(request.getResult())
                .yearsOfExperience(request.getYearsOfExperience())
                .baseSalary(request.getBaseSalary())
                .stockGrant(request.getStockGrant())
                .signingBonus(request.getSigningBonus())
                .totalCompensation(request.getTotalCompensation() != null ? request.getTotalCompensation() :
                        (request.getBaseSalary() != null ? request.getBaseSalary() + (request.getStockGrant() != null ? request.getStockGrant() : 0.0) + (request.getSigningBonus() != null ? request.getSigningBonus() : 0.0) : null))
                .currency(request.getCurrency() != null && !request.getCurrency().isBlank() ? request.getCurrency() : "INR")
                .jobLevel(request.getJobLevel())
                .offerAccepted(request.getOfferAccepted())
                .build();

        InterviewExperience saved = experienceRepository.save(experience);
        return toResponse(saved);
    }

    public ExperienceResponse getById(Long id) {
        InterviewExperience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview experience not found with id: " + id));
        return toResponse(experience);
    }

    public Page<ExperienceResponse> getAll(
            Pageable pageable,
            Long companyId,
            Difficulty difficulty,
            String jobRole,
            String keyword
    ) {
        org.springframework.data.jpa.domain.Specification<InterviewExperience> spec =
                com.interviewplatform.experience.specification.InterviewExperienceSpecification.withFilters(companyId, difficulty, jobRole, keyword);
        Page<InterviewExperience> page = experienceRepository.findAll(spec, pageable);
        return page.map(this::toResponse);
    }

    public Page<ExperienceResponse> getAll(
            Pageable pageable,
            Long companyId,
            Difficulty difficulty,
            String jobRole
    ) {
        return getAll(pageable, companyId, difficulty, jobRole, null);
    }

    public Page<ExperienceResponse> search(String keyword, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<InterviewExperience> spec =
                com.interviewplatform.experience.specification.InterviewExperienceSpecification.withKeyword(keyword);
        Page<InterviewExperience> page = experienceRepository.findAll(spec, pageable);
        return page.map(this::toResponse);
    }

    public Page<ExperienceResponse> getMyExperiences(String currentUserEmail, Pageable pageable) {
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + currentUserEmail));

        return experienceRepository.findByUserId(user.getId(), pageable).map(this::toResponse);
    }

    @Transactional
    public ExperienceResponse update(Long id, UpdateExperienceRequest request, String currentUserEmail, boolean isAdmin) {
        InterviewExperience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview experience not found with id: " + id));

        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to update this experience");
        }

        if (request.getCompanyId() != null && !request.getCompanyId().equals(experience.getCompany().getId())) {
            Company company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + request.getCompanyId()));
            experience.setCompany(company);
        }

        experience.setJobRole(request.getJobRole());
        experience.setExperienceTitle(request.getExperienceTitle());
        experience.setDescription(request.getDescription());
        experience.setOverallDifficulty(request.getOverallDifficulty());
        experience.setResult(request.getResult());
        experience.setYearsOfExperience(request.getYearsOfExperience());
        if (request.getBaseSalary() != null) experience.setBaseSalary(request.getBaseSalary());
        if (request.getStockGrant() != null) experience.setStockGrant(request.getStockGrant());
        if (request.getSigningBonus() != null) experience.setSigningBonus(request.getSigningBonus());
        if (request.getTotalCompensation() != null) experience.setTotalCompensation(request.getTotalCompensation());
        if (request.getCurrency() != null) experience.setCurrency(request.getCurrency());
        if (request.getJobLevel() != null) experience.setJobLevel(request.getJobLevel());
        if (request.getOfferAccepted() != null) experience.setOfferAccepted(request.getOfferAccepted());

        InterviewExperience updated = experienceRepository.save(experience);
        return toResponse(updated);
    }

    @Transactional
    public ExperienceResponse patch(Long id, PatchExperienceRequest request, String currentUserEmail, boolean isAdmin) {
        InterviewExperience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview experience not found with id: " + id));

        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to update this experience");
        }

        if (request.getCompanyId() != null && !request.getCompanyId().equals(experience.getCompany().getId())) {
            Company company = companyRepository.findById(request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + request.getCompanyId()));
            experience.setCompany(company);
        }

        if (request.getJobRole() != null && !request.getJobRole().isBlank()) {
            experience.setJobRole(request.getJobRole());
        }

        if (request.getExperienceTitle() != null && !request.getExperienceTitle().isBlank()) {
            experience.setExperienceTitle(request.getExperienceTitle());
        }

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            experience.setDescription(request.getDescription());
        }

        if (request.getOverallDifficulty() != null) {
            experience.setOverallDifficulty(request.getOverallDifficulty());
        }

        if (request.getResult() != null) {
            experience.setResult(request.getResult());
        }

        if (request.getYearsOfExperience() != null) {
            experience.setYearsOfExperience(request.getYearsOfExperience());
        }

        InterviewExperience updated = experienceRepository.save(experience);
        return toResponse(updated);
    }

    @Transactional
    public void delete(Long id, String currentUserEmail, boolean isAdmin) {
        InterviewExperience experience = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview experience not found with id: " + id));

        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to delete this experience");
        }

        experienceRepository.delete(experience);
    }

    public List<ExperienceResponse> getAllExperiencesList() {
        return experienceRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    private ExperienceResponse toResponse(InterviewExperience exp) {
        UserResponse userResponse = UserResponse.builder()
                .id(exp.getUser().getId())
                .name(exp.getUser().getName())
                .email(exp.getUser().getEmail())
                .role(exp.getUser().getRole())
                .createdAt(exp.getUser().getCreatedAt())
                .build();

        CompanyResponse companyResponse = CompanyResponse.builder()
                .id(exp.getCompany().getId())
                .name(exp.getCompany().getName())
                .logo(exp.getCompany().getLogo())
                .website(exp.getCompany().getWebsite())
                .description(exp.getCompany().getDescription())
                .createdAt(exp.getCompany().getCreatedAt())
                .updatedAt(exp.getCompany().getUpdatedAt())
                .build();

        return ExperienceResponse.builder()
                .id(exp.getId())
                .user(userResponse)
                .company(companyResponse)
                .jobRole(exp.getJobRole())
                .experienceTitle(exp.getExperienceTitle())
                .description(exp.getDescription())
                .overallDifficulty(exp.getOverallDifficulty())
                .result(exp.getResult())
                .yearsOfExperience(exp.getYearsOfExperience())
                .baseSalary(exp.getBaseSalary())
                .stockGrant(exp.getStockGrant())
                .signingBonus(exp.getSigningBonus())
                .totalCompensation(exp.getTotalCompensation())
                .currency(exp.getCurrency())
                .jobLevel(exp.getJobLevel())
                .offerAccepted(exp.getOfferAccepted())
                .createdAt(exp.getCreatedAt())
                .updatedAt(exp.getUpdatedAt())
                .build();
    }
}
