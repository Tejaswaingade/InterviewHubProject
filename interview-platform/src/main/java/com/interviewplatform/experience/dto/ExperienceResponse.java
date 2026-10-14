package com.interviewplatform.experience.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.interviewplatform.company.dto.CompanyResponse;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.user.dto.UserResponse;
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
public class ExperienceResponse {

    private Long id;
    private UserResponse user;
    private CompanyResponse company;
    private String jobRole;
    private String experienceTitle;
    private String description;
    private Difficulty overallDifficulty;
    private ResultStatus result;
    private Double yearsOfExperience;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
