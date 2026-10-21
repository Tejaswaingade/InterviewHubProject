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
public class MockInterviewQuestion {

    private String id;
    private String question;
    private String category; // SYSTEM_DESIGN, CODING, ARCHITECTURE, BEHAVIORAL
    private String difficulty;
    private Integer timeLimitSeconds;
    private List<String> hints;
    private List<String> expectedKeyPoints;
    private List<String> followUpQuestions;
}
