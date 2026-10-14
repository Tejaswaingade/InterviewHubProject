package com.interviewplatform.question.controller;

import com.interviewplatform.common.response.ApiResponse;
import com.interviewplatform.config.OpenApiConfig;
import com.interviewplatform.question.dto.CreateQuestionRequest;
import com.interviewplatform.question.dto.PatchQuestionRequest;
import com.interviewplatform.question.dto.QuestionResponse;
import com.interviewplatform.question.dto.UpdateQuestionRequest;
import com.interviewplatform.question.service.QuestionService;
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
@Tag(name = "Question APIs", description = "Endpoints for managing interview questions asked during rounds")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
public class QuestionController {

    private final QuestionService questionService;

    public QuestionController(QuestionService questionService) {
        this.questionService = questionService;
    }

    @GetMapping("/api/questions")
    @Operation(
            summary = "Get all interview questions",
            description = "Retrieves all interview questions across the platform with no parameters required. Just click Try it out and Execute."
    )
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getAllQuestions() {
        List<QuestionResponse> questions = questionService.getAllQuestions();
        return ResponseEntity.ok(ApiResponse.success("Questions retrieved successfully", questions));
    }

    @PostMapping("/api/rounds/{roundId}/questions")
    @Operation(
            summary = "Create question",
            description = "Adds an interview question to a specific round. Only the experience owner or ADMIN may add questions."
    )
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @Parameter(description = "ID of the round to add the question to", example = "1", required = true)
            @PathVariable Long roundId,
            @Valid @RequestBody CreateQuestionRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        QuestionResponse response = questionService.createQuestion(roundId, request, username, isAdmin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question created successfully", response));
    }

    @GetMapping("/api/rounds/{roundId}/questions")
    @Operation(
            summary = "List questions by round",
            description = "Retrieves all interview questions associated with a given round ID."
    )
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getQuestionsByRound(
            @Parameter(description = "ID of the round whose questions to retrieve", example = "1", required = true)
            @PathVariable Long roundId
    ) {
        List<QuestionResponse> response = questionService.getQuestionsByRound(roundId);
        return ResponseEntity.ok(ApiResponse.success("Questions retrieved successfully", response));
    }

    @PutMapping("/api/questions/{questionId}")
    @Operation(
            summary = "Update question",
            description = "Updates an interview question. Only the parent experience owner or ADMIN may update."
    )
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @Parameter(description = "ID of the question to update", example = "1", required = true)
            @PathVariable Long questionId,
            @Valid @RequestBody UpdateQuestionRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        QuestionResponse response = questionService.updateQuestion(questionId, request, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", response));
    }

    @PatchMapping("/api/questions/{questionId}")
    @Operation(
            summary = "Partially update question",
            description = "Partially updates an interview question (only provided non-null fields are updated). Only the parent experience owner or ADMIN may update."
    )
    public ResponseEntity<ApiResponse<QuestionResponse>> patchQuestion(
            @Parameter(description = "ID of the question to partially update", example = "1", required = true)
            @PathVariable Long questionId,
            @Valid @RequestBody PatchQuestionRequest request,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        QuestionResponse response = questionService.patchQuestion(questionId, request, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Question partially updated successfully", response));
    }

    @DeleteMapping("/api/questions/{questionId}")
    @Operation(
            summary = "Delete question",
            description = "Deletes an interview question. Only the parent experience owner or ADMIN may delete."
    )
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @Parameter(description = "ID of the question to delete", example = "1", required = true)
            @PathVariable Long questionId,
            Authentication authentication
    ) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        String username = authentication != null ? authentication.getName() : null;
        questionService.deleteQuestion(questionId, username, isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully"));
    }
}
