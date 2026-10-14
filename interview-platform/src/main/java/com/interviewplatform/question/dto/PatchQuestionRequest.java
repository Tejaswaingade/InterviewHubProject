package com.interviewplatform.question.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.question.entity.QuestionType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for partially updating an interview question")
public class PatchQuestionRequest {

    @Schema(description = "Updated question text (optional)", example = "Explain LRU cache implementation")
    private String questionText;

    @Schema(description = "Updated question type (DSA, JAVA, SPRING_BOOT, DATABASE, SYSTEM_DESIGN, HR, BEHAVIORAL, OTHER) (optional)", example = "DSA")
    private QuestionType questionType;

    @Schema(description = "Updated difficulty (EASY, MEDIUM, HARD) (optional)", example = "MEDIUM")
    private Difficulty difficulty;

    @Schema(description = "Updated topic / category tag (optional)", example = "Data Structures")
    private String topic;

    @Schema(description = "Updated reference answer or notes (optional)", example = "Use HashMap + Doubly Linked List for O(1) get and put")
    private String answer;
}
