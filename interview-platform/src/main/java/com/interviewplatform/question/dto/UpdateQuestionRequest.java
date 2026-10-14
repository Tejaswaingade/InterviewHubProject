package com.interviewplatform.question.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.question.entity.QuestionType;
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
public class UpdateQuestionRequest {

    @NotBlank(message = "Question text must not be blank")
    private String questionText;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @NotNull(message = "Difficulty must be valid")
    private Difficulty difficulty;

    private String topic;

    private String answer;
}
