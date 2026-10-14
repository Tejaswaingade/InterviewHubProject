package com.interviewplatform.round.controller;

import com.interviewplatform.common.response.ApiResponse;
import com.interviewplatform.config.OpenApiConfig;
import com.interviewplatform.round.dto.CreateRoundRequest;
import com.interviewplatform.round.dto.PatchRoundRequest;
import com.interviewplatform.round.dto.RoundResponse;
import com.interviewplatform.round.dto.UpdateRoundRequest;
import com.interviewplatform.round.service.InterviewRoundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Round APIs", description = "Endpoints for managing interview rounds within an experience")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
public class InterviewRoundController {

    private final InterviewRoundService roundService;

    public InterviewRoundController(InterviewRoundService roundService) {
        this.roundService = roundService;
    }

    @GetMapping("/api/rounds")
    @Operation(
            summary = "Get all interview rounds",
            description = "Retrieves all interview rounds across the platform with no parameters required. Just click Try it out and Execute."
    )
    public ResponseEntity<ApiResponse<List<RoundResponse>>> getAllRounds() {
        List<RoundResponse> response = roundService.getAllRounds();
        return ResponseEntity.ok(ApiResponse.success("Interview rounds retrieved successfully", response));
    }

    @PostMapping("/api/experiences/{experienceId}/rounds")
    @Operation(
            summary = "Create interview round",
            description = "Adds a new interview round to an existing experience. Only the owner of the experience or ADMIN can add rounds."
    )
    public ResponseEntity<ApiResponse<RoundResponse>> createRound(
            @Parameter(description = "ID of the parent interview experience", example = "1", required = true)
            @PathVariable Long experienceId,
            @Valid @RequestBody CreateRoundRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        RoundResponse response = roundService.createRound(experienceId, request, username, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Interview round created successfully", response));
    }

    @GetMapping("/api/experiences/{experienceId}/rounds")
    @Operation(
            summary = "List rounds for experience",
            description = "Retrieves all interview rounds associated with a specific interview experience."
    )
    public ResponseEntity<ApiResponse<List<RoundResponse>>> getRoundsByExperience(
            @Parameter(description = "ID of the parent interview experience", example = "1", required = true)
            @PathVariable Long experienceId
    ) {
        List<RoundResponse> response = roundService.getRoundsByExperienceId(experienceId);
        return ResponseEntity.ok(ApiResponse.success("Interview rounds retrieved successfully", response));
    }

    @GetMapping("/api/rounds/{roundId}")
    @Operation(
            summary = "Get round by ID",
            description = "Retrieves details of a specific interview round."
    )
    public ResponseEntity<ApiResponse<RoundResponse>> getRoundById(
            @Parameter(description = "Unique ID of the interview round", example = "1", required = true)
            @PathVariable Long roundId
    ) {
        RoundResponse response = roundService.getRoundById(roundId);
        return ResponseEntity.ok(ApiResponse.success("Interview round retrieved successfully", response));
    }

    @PutMapping("/api/rounds/{roundId}")
    @Operation(
            summary = "Update interview round",
            description = "Updates round details. Only the experience owner or ADMIN may update the round."
    )
    public ResponseEntity<ApiResponse<RoundResponse>> updateRound(
            @Parameter(description = "Unique ID of the interview round", example = "1", required = true)
            @PathVariable Long roundId,
            @Valid @RequestBody UpdateRoundRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        RoundResponse response = roundService.updateRound(roundId, request, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Interview round updated successfully", response));
    }

    @PatchMapping("/api/rounds/{roundId}")
    @Operation(
            summary = "Partially update interview round",
            description = "Partially updates an interview round (only provided non-null fields are updated). Only the experience owner or ADMIN may update the round."
    )
    public ResponseEntity<ApiResponse<RoundResponse>> patchRound(
            @Parameter(description = "Unique ID of the interview round to partially update", example = "1", required = true)
            @PathVariable Long roundId,
            @Valid @RequestBody PatchRoundRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        RoundResponse response = roundService.patchRound(roundId, request, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Interview round partially updated successfully", response));
    }

    @DeleteMapping("/api/rounds/{roundId}")
    @Operation(
            summary = "Delete interview round",
            description = "Deletes an interview round. Only the experience owner or ADMIN may delete the round."
    )
    public ResponseEntity<ApiResponse<Void>> deleteRound(
            @Parameter(description = "Unique ID of the interview round", example = "1", required = true)
            @PathVariable Long roundId,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        roundService.deleteRound(roundId, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Interview round deleted successfully"));
    }
}
