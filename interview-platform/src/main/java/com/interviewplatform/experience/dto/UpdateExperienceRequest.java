package com.interviewplatform.experience.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.ResultStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateExperienceRequest {

    private Long companyId;

    @NotBlank(message = "Job role is required")
    private String jobRole;

    @NotBlank(message = "Experience title is required")
    private String experienceTitle;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Overall difficulty is required")
    private Difficulty overallDifficulty;

    @NotNull(message = "Result status is required")
    private ResultStatus result;

    @PositiveOrZero(message = "Years of experience must be zero or positive")
    private Double yearsOfExperience;
}
