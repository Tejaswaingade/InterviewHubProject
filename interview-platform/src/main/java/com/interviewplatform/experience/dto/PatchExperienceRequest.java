package com.interviewplatform.experience.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.ResultStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatchExperienceRequest {

    @Schema(description = "ID of the company (optional)", example = "1")
    private Long companyId;

    @Schema(description = "Job role/title applied for (optional)", example = "Senior Software Engineer")
    private String jobRole;

    @Schema(description = "Title of the interview experience (optional)", example = "Google SDE II Interview Experience")
    private String experienceTitle;

    @Schema(description = "Full description and takeaways (optional)", example = "Detailed 4-round technical process...")
    private String description;

    @Schema(description = "Overall difficulty (EASY, MEDIUM, HARD) (optional)", example = "HARD")
    private Difficulty overallDifficulty;

    @Schema(description = "Interview result (SELECTED, REJECTED, WAITING, WITHDRAWN, UNKNOWN) (optional)", example = "SELECTED")
    private ResultStatus result;

    @PositiveOrZero(message = "Years of experience must be zero or positive")
    @Schema(description = "Years of experience at time of interview (optional)", example = "3.5")
    private Double yearsOfExperience;
}
