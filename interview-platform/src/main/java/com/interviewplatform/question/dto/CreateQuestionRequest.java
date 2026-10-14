package com.interviewplatform.question.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.question.entity.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for creating an interview question")
public class CreateQuestionRequest {

    @NotBlank(message = "Question text must not be blank")
    @Schema(description = "The interview question text", example = "How does HashMap work internally in Java?")
    private String questionText;

    @NotNull(message = "Question type is required")
    @Schema(description = "Question category / type", example = "JAVA")
    private QuestionType questionType;

    @NotNull(message = "Difficulty must be valid")
    @Schema(description = "Difficulty level", example = "MEDIUM")
    private Difficulty difficulty;

    @Schema(description = "Topic or tags", example = "Collections, Internals")
    private String topic;

    @Schema(description = "Sample or ideal answer", example = "HashMap uses an array of Node buckets and calculates index using hashcode.")
    private String answer;
}
