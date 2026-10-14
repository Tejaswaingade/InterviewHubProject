package com.interviewplatform.question.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.question.entity.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestionResponse {

    private Long id;
    private Long roundId;
    private String questionText;
    private QuestionType questionType;
    private Difficulty difficulty;
    private String topic;
    private String answer;
    private LocalDateTime createdAt;
}
