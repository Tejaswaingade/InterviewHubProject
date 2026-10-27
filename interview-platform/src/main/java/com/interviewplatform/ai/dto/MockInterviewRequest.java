package com.interviewplatform.ai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body to start an AI mock interview session")
public class MockInterviewRequest {

    @NotBlank(message = "Target job role is required")
    @Schema(description = "Target engineering role", example = "Senior Full-Stack Engineer")
    private String role;

    @Schema(description = "Interview difficulty tier", example = "HARD")
    @Builder.Default
    private String difficulty = "MEDIUM";

    @Schema(description = "Technical focus domain", example = "Full-Stack")
    @Builder.Default
    private String domain = "Full-Stack";

    @Schema(description = "Candidate experience level in years", example = "3.5")
    private Double yearsOfExperience;

    @Schema(description = "Optional resume summary or key skills snippet for personalized questions", example = "Expert in React 19, Spring Boot, Postgres, Redis, Microservices")
    private String resumeSnippet;

    @Schema(description = "Optional candidate focus areas or summary", example = "Distributed caching, system design, concurrency")
    private String candidateProfileSummary;

    @Schema(description = "Optional external AI API key (OpenAI sk-..., Groq gsk_..., Gemini AIzaSy...)", example = "sk-...")
    private String apiKey;
}
