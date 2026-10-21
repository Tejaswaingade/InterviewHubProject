package com.interviewplatform.ai.controller;

import com.interviewplatform.ai.dto.EvaluationRequest;
import com.interviewplatform.ai.dto.EvaluationResponse;
import com.interviewplatform.ai.dto.MockInterviewQuestion;
import com.interviewplatform.ai.dto.MockInterviewRequest;
import com.interviewplatform.ai.service.MockInterviewService;
import com.interviewplatform.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/mock-interview")
@RequiredArgsConstructor
@Tag(name = "AI Mock Interviewer", description = "AI-powered technical and system design mock interviews with instant rubric evaluation")
public class MockInterviewController {

    private final MockInterviewService mockInterviewService;

    @PostMapping("/generate")
    @Operation(summary = "Generate tailored technical and system design interview questions for a role")
    public ResponseEntity<ApiResponse<List<MockInterviewQuestion>>> generateQuestions(
            @Valid @RequestBody MockInterviewRequest request
    ) {
        List<MockInterviewQuestion> questions = mockInterviewService.generateQuestions(request);
        return ResponseEntity.ok(ApiResponse.success("Generated " + questions.size() + " interview questions", questions));
    }

    @PostMapping("/evaluate")
    @Operation(summary = "Evaluate candidate's answer with scoring breakdown, strengths, and staff-engineer model answer")
    public ResponseEntity<ApiResponse<EvaluationResponse>> evaluateAnswer(
            @Valid @RequestBody EvaluationRequest request
    ) {
        EvaluationResponse evaluation = mockInterviewService.evaluateAnswer(request);
        return ResponseEntity.ok(ApiResponse.success("Response evaluated successfully", evaluation));
    }

    @GetMapping("/roles")
    @Operation(summary = "Get popular technical interview roles and focus domains")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRolesAndDomains() {
        List<String> roles = List.of(
                "Full-Stack Engineer",
                "Senior Backend Engineer",
                "Distributed Systems SDE-2",
                "Frontend Architect",
                "DevOps & Cloud Engineer",
                "Machine Learning Engineer",
                "Engineering Manager"
        );

        List<String> domains = List.of(
                "System Design & Scale",
                "Data Structures & Algorithms",
                "Microservices & Concurrency",
                "Frontend Architecture & Performance",
                "Database Sharding & Transactions",
                "Behavioral & Engineering Leadership"
        );

        return ResponseEntity.ok(ApiResponse.success("Available roles and focus tracks", Map.of(
                "roles", roles,
                "domains", domains
        )));
    }
}
