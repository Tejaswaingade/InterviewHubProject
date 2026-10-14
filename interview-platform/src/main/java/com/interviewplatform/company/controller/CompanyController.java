package com.interviewplatform.company.controller;

import com.interviewplatform.common.response.ApiResponse;
import com.interviewplatform.company.dto.CompanyResponse;
import com.interviewplatform.company.dto.CreateCompanyRequest;
import com.interviewplatform.company.dto.PatchCompanyRequest;
import com.interviewplatform.company.dto.UpdateCompanyRequest;
import com.interviewplatform.company.service.CompanyService;
import com.interviewplatform.config.OpenApiConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/companies", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Company APIs", description = "Endpoints for viewing and managing company profiles")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    @Operation(
            summary = "Get all companies",
            description = "Retrieves all registered companies with no parameters required. Just click Try it out and Execute."
    )
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getAllCompanies(
            @Parameter(hidden = true)
            @RequestParam(name = "search", required = false) String search
    ) {
        List<CompanyResponse> companies = (search != null && !search.isBlank())
                ? companyService.search(search)
                : companyService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Companies retrieved successfully", companies));
    }

    @GetMapping("/search")
    @Operation(
            summary = "Search companies",
            description = "Searches companies by name query keyword."
    )
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> searchCompanies(
            @Parameter(description = "Keyword to search companies by name", example = "Google")
            @RequestParam(name = "search", required = false) String search
    ) {
        List<CompanyResponse> companies = (search != null && !search.isBlank())
                ? companyService.search(search)
                : companyService.getAll();
        return ResponseEntity.ok(ApiResponse.success("Companies retrieved successfully", companies));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get company by ID",
            description = "Retrieves details of a specific company by its ID."
    )
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompanyById(
            @Parameter(description = "Unique ID of the company", example = "1", required = true)
            @PathVariable Long id
    ) {
        CompanyResponse company = companyService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Company retrieved successfully", company));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(
            summary = "Create company",
            description = "Creates a new company. Available to authenticated candidates and administrators."
    )
    public ResponseEntity<ApiResponse<CompanyResponse>> createCompany(@Valid @RequestBody CreateCompanyRequest request) {
        CompanyResponse company = companyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Company created successfully", company));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update company",
            description = "Updates an existing company's details. Restricted to users with ADMIN role."
    )
    public ResponseEntity<ApiResponse<CompanyResponse>> updateCompany(
            @Parameter(description = "Unique ID of the company to update", example = "1", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UpdateCompanyRequest request
    ) {
        CompanyResponse company = companyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Company updated successfully", company));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Partially update company",
            description = "Partially updates an existing company's details (only provided non-null fields are updated). Restricted to users with ADMIN role."
    )
    public ResponseEntity<ApiResponse<CompanyResponse>> patchCompany(
            @Parameter(description = "Unique ID of the company to partially update", example = "1", required = true)
            @PathVariable Long id,
            @Valid @RequestBody PatchCompanyRequest request
    ) {
        CompanyResponse company = companyService.patch(id, request);
        return ResponseEntity.ok(ApiResponse.success("Company partially updated successfully", company));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete company",
            description = "Deletes a company by ID. Restricted to users with ADMIN role."
    )
    public ResponseEntity<ApiResponse<Void>> deleteCompany(
            @Parameter(description = "Unique ID of the company to delete", example = "1", required = true)
            @PathVariable Long id
    ) {
        companyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Company deleted successfully"));
    }
}
