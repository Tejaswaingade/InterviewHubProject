package com.interviewplatform.company.service;

import com.interviewplatform.common.exception.DuplicateResourceException;
import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.company.dto.CompanyResponse;
import com.interviewplatform.company.dto.CreateCompanyRequest;
import com.interviewplatform.company.dto.UpdateCompanyRequest;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.company.repository.CompanyRepository;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final InterviewExperienceRepository experienceRepository;

    public CompanyService(CompanyRepository companyRepository, InterviewExperienceRepository experienceRepository) {
        this.companyRepository = companyRepository;
        this.experienceRepository = experienceRepository;
    }

    @Transactional
    public CompanyResponse create(CreateCompanyRequest request) {
        String trimmedName = request.getName().trim();

        if (companyRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Company with name '" + trimmedName + "' already exists");
        }

        Company company = Company.builder()
                .name(trimmedName)
                .logo(request.getLogo())
                .website(request.getWebsite() != null ? request.getWebsite().trim() : null)
                .description(request.getDescription())
                .build();

        Company savedCompany = companyRepository.save(company);
        return mapToResponse(savedCompany);
    }

    public CompanyResponse getById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        return mapToResponse(company);
    }

    public List<CompanyResponse> getAll() {
        return companyRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<CompanyResponse> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAll();
        }
        return companyRepository.findByNameContainingIgnoreCase(query.trim()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public CompanyResponse update(Long id, UpdateCompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        String trimmedName = request.getName().trim();

        if (companyRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new DuplicateResourceException("Company with name '" + trimmedName + "' already exists");
        }

        company.setName(trimmedName);
        company.setLogo(request.getLogo());
        company.setWebsite(request.getWebsite() != null ? request.getWebsite().trim() : null);
        company.setDescription(request.getDescription());

        Company updatedCompany = companyRepository.save(company);
        return mapToResponse(updatedCompany);
    }

    @Transactional
    public CompanyResponse patch(Long id, com.interviewplatform.company.dto.PatchCompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        if (request.getName() != null) {
            String trimmedName = request.getName().trim();
            if (!trimmedName.isEmpty() && !trimmedName.equalsIgnoreCase(company.getName())) {
                if (companyRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
                    throw new DuplicateResourceException("Company with name '" + trimmedName + "' already exists");
                }
                company.setName(trimmedName);
            }
        }

        if (request.getLogo() != null) {
            company.setLogo(request.getLogo());
        }

        if (request.getWebsite() != null) {
            company.setWebsite(request.getWebsite().trim().isEmpty() ? null : request.getWebsite().trim());
        }

        if (request.getDescription() != null) {
            company.setDescription(request.getDescription());
        }

        Company updatedCompany = companyRepository.save(company);
        return mapToResponse(updatedCompany);
    }

    @Transactional
    public void delete(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        // Cascade delete any attached interview experiences so foreign key constraints are not violated
        List<InterviewExperience> experiences = experienceRepository.findByCompanyId(id);
        if (experiences != null && !experiences.isEmpty()) {
            experienceRepository.deleteAll(experiences);
        }

        companyRepository.delete(company);
    }

    public CompanyResponse mapToResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .logo(company.getLogo())
                .website(company.getWebsite())
                .description(company.getDescription())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .build();
    }
}
