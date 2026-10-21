package com.interviewplatform.experience.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.ResultStatus;
import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "Request body for creating an interview experience")
public class CreateExperienceRequest {

    @NotNull(message = "Company ID is required")
    @Schema(description = "ID of the company", example = "1")
    private Long companyId;

    @NotBlank(message = "Job role is required")
    @Schema(description = "Job role / position", example = "Software Engineer")
    private String jobRole;

    @NotBlank(message = "Experience title is required")
    @Schema(description = "Title of the interview experience", example = "Google SDE Interview Experience")
    private String experienceTitle;

    @NotBlank(message = "Description is required")
    @Schema(description = "Detailed description of the interview process", example = "4 rounds covering DSA, system design, and behavioral fit.")
    private String description;

    @NotNull(message = "Overall difficulty is required")
    @Schema(description = "Overall interview difficulty", example = "MEDIUM")
    private Difficulty overallDifficulty;

    @NotNull(message = "Result status is required")
    @Schema(description = "Interview outcome / result status", example = "SELECTED")
    private ResultStatus result;

    @PositiveOrZero(message = "Years of experience must be zero or positive")
    @Schema(description = "Years of candidate work experience", example = "2.5")
    private Double yearsOfExperience;

    // --- Optional Offer & Compensation Insights ---
    @PositiveOrZero(message = "Base salary must be positive")
    @Schema(description = "Annual base salary", example = "2400000.0")
    private Double baseSalary;

    @PositiveOrZero(message = "Stock grant must be positive")
    @Schema(description = "Stock grant / ESOP value", example = "1000000.0")
    private Double stockGrant;

    @PositiveOrZero(message = "Signing bonus must be positive")
    @Schema(description = "One-time signing bonus", example = "200000.0")
    private Double signingBonus;

    @PositiveOrZero(message = "Total compensation must be positive")
    @Schema(description = "Total annual compensation / CTC", example = "3600000.0")
    private Double totalCompensation;

    @Schema(description = "Currency of compensation (e.g. INR, USD, EUR)", example = "INR")
    private String currency;

    @Schema(description = "Job level / seniority tier", example = "SDE-2 / L4")
    private String jobLevel;

    @Schema(description = "Whether the candidate accepted the offer", example = "true")
    private Boolean offerAccepted;
}
