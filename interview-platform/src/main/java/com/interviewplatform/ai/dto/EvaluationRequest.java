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
@Schema(description = "Request body to evaluate candidate's mock interview response")
public class EvaluationRequest {

    @NotBlank(message = "Question text is required")
    @Schema(description = "The interview question being answered")
    private String question;

    @NotBlank(message = "Candidate answer is required")
    @Schema(description = "Candidate's written or transcribed verbal response")
    private String userAnswer;

    @Schema(description = "Target job role", example = "Senior Full-Stack Engineer")
    private String role;

    @Schema(description = "Question category", example = "SYSTEM_DESIGN")
    private String category;

    @Schema(description = "Target difficulty", example = "HARD")
    private String difficulty;

    @Schema(description = "Optional external AI API key (OpenAI sk-..., Groq gsk_..., Gemini AIzaSy...)", example = "sk-...")
    private String apiKey;
}
