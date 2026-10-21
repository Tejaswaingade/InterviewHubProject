package com.interviewplatform.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationResponse {

    private Integer overallScore; // 0 - 100
    private Integer technicalAccuracyScore; // 0 - 100
    private Integer clarityScore; // 0 - 100
    private Integer systemDesignScore; // 0 - 100
    private Integer edgeCaseHandlingScore; // 0 - 100
    private String verdict; // STRONG_HIRE, HIRE, LEANING_HIRE, LEANING_NO_HIRE, NO_HIRE
    private String summary;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> missingConcepts;
    private String modelAnswer;
    private List<String> recommendedTopics;
}
