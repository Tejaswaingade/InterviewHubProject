package com.interviewplatform.experience.controller;

import com.interviewplatform.common.response.ApiResponse;
import com.interviewplatform.common.response.PagedResponse;
import com.interviewplatform.config.OpenApiConfig;
import com.interviewplatform.experience.dto.CreateExperienceRequest;
import com.interviewplatform.experience.dto.ExperienceResponse;
import com.interviewplatform.experience.dto.PatchExperienceRequest;
import com.interviewplatform.experience.dto.UpdateExperienceRequest;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.service.InterviewExperienceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/experiences", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Experience APIs", description = "Endpoints for creating, reading, updating, and searching interview experiences")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
public class InterviewExperienceController {

    private final InterviewExperienceService experienceService;

    public InterviewExperienceController(InterviewExperienceService experienceService) {
        this.experienceService = experienceService;
    }

    @PostMapping
    @Operation(
            summary = "Create interview experience",
            description = "Creates a new interview experience for the currently authenticated user."
    )
    public ResponseEntity<ApiResponse<ExperienceResponse>> createExperience(
            @Valid @RequestBody CreateExperienceRequest request,
            Authentication authentication
    ) {
        String currentUserEmail = authentication != null ? authentication.getName() : null;
        ExperienceResponse response = experienceService.create(request, currentUserEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interview experience created successfully", response));
    }

    @GetMapping("/all")
    @Operation(
            summary = "Get all interview experiences",
            description = "Retrieves all interview experiences across the platform with no parameters required. Just click Try it out and Execute."
    )
    public ResponseEntity<ApiResponse<List<ExperienceResponse>>> getAllExperiencesList() {
        List<ExperienceResponse> experiences = experienceService.getAllExperiencesList();
        return ResponseEntity.ok(ApiResponse.success("All interview experiences retrieved successfully", experiences));
    }

    @GetMapping
    @Operation(
            summary = "List interview experiences",
            description = "Retrieves a paginated list of experiences with optional filtering by company ID, difficulty, job role, or keyword."
    )
    public ResponseEntity<ApiResponse<PagedResponse<ExperienceResponse>>> getAllExperiences(
            @Parameter(description = "Filter by company ID", example = "1")
            @RequestParam(required = false) Long companyId,
            @Parameter(description = "Filter by overall difficulty (EASY, MEDIUM, HARD)", example = "MEDIUM")
            @RequestParam(required = false) Difficulty difficulty,
            @Parameter(description = "Filter by job role (case-insensitive partial match)", example = "Software Engineer")
            @RequestParam(required = false) String jobRole,
            @Parameter(description = "Search keyword (matches title, description, company name, or role)", example = "Uber")
            @RequestParam(required = false) String keyword,
            @Parameter(hidden = true)
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ExperienceResponse> page = experienceService.getAll(pageable, companyId, difficulty, jobRole, keyword);
        return ResponseEntity.ok(ApiResponse.success("Interview experiences retrieved successfully", PagedResponse.of(page)));
    }

    @GetMapping("/search")
    @Operation(
            summary = "Search interview experiences",
            description = "Searches experiences matching the keyword in experience title or description with pagination."
    )
    public ResponseEntity<ApiResponse<PagedResponse<ExperienceResponse>>> searchExperiences(
            @Parameter(description = "Search keyword (matches title or description)", example = "Java")
            @RequestParam(name = "keyword", required = false, defaultValue = "") String keyword,
            @Parameter(hidden = true)
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<ExperienceResponse> page = experienceService.search(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success("Interview experiences retrieved successfully", PagedResponse.of(page)));
    }

    @GetMapping("/my")
    @Operation(
            summary = "Get my interview experiences",
            description = "Retrieves a paginated list of interview experiences authored by the authenticated user."
    )
    public ResponseEntity<ApiResponse<PagedResponse<ExperienceResponse>>> getMyExperiences(
            Authentication authentication,
            @Parameter(hidden = true)
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        String currentUserEmail = authentication != null ? authentication.getName() : null;
        Page<ExperienceResponse> page = experienceService.getMyExperiences(currentUserEmail, pageable);
        return ResponseEntity.ok(ApiResponse.success("My interview experiences retrieved successfully", PagedResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get interview experience by ID",
            description = "Retrieves full details of a specific interview experience by its ID."
    )
    public ResponseEntity<ApiResponse<ExperienceResponse>> getExperienceById(
            @Parameter(description = "Unique ID of the interview experience", example = "1", required = true)
            @PathVariable Long id
    ) {
        ExperienceResponse response = experienceService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Interview experience retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update interview experience",
            description = "Updates an existing interview experience. Only the experience owner or ADMIN may update."
    )
    public ResponseEntity<ApiResponse<ExperienceResponse>> updateExperience(
            @Parameter(description = "Unique ID of the interview experience to update", example = "1", required = true)
            @PathVariable Long id,
            @Valid @RequestBody UpdateExperienceRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String currentUserEmail = authentication != null ? authentication.getName() : null;
        ExperienceResponse response = experienceService.update(id, request, currentUserEmail, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Interview experience updated successfully", response));
    }

    @PatchMapping("/{id}")
    @Operation(
            summary = "Partially update interview experience",
            description = "Partially updates an existing interview experience (only provided non-null fields are updated). Only the experience owner or ADMIN may update."
    )
    public ResponseEntity<ApiResponse<ExperienceResponse>> patchExperience(
            @Parameter(description = "Unique ID of the interview experience to partially update", example = "1", required = true)
            @PathVariable Long id,
            @Valid @RequestBody PatchExperienceRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String currentUserEmail = authentication != null ? authentication.getName() : null;
        ExperienceResponse response = experienceService.patch(id, request, currentUserEmail, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Interview experience partially updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete interview experience",
            description = "Deletes an interview experience. Only the experience owner or ADMIN may delete."
    )
    public ResponseEntity<ApiResponse<Void>> deleteExperience(
            @Parameter(description = "Unique ID of the interview experience to delete", example = "1", required = true)
            @PathVariable Long id,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String currentUserEmail = authentication != null ? authentication.getName() : null;
        experienceService.delete(id, currentUserEmail, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Interview experience deleted successfully"));
    }
}
