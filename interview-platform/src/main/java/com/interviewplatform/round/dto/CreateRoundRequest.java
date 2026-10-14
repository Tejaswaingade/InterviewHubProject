package com.interviewplatform.round.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.round.entity.RoundType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for creating an interview round")
public class CreateRoundRequest {

    @NotBlank(message = "Round name is required")
    @Schema(description = "Name/Title of the interview round", example = "Technical Round 1")
    private String roundName;

    @NotNull(message = "Round number is required")
    @Min(value = 1, message = "Round number must be at least 1")
    @Schema(description = "Sequence number of the interview round", example = "1")
    private Integer roundNumber;

    @Schema(description = "Type of the round (e.g. ONLINE_ASSESSMENT, DSA, SYSTEM_DESIGN)", example = "DSA")
    private RoundType roundType;

    @Schema(description = "Description or overview of the round", example = "DSA problems on binary trees and graphs")
    private String description;

    @Schema(description = "Difficulty rating for the round", example = "MEDIUM")
    private Difficulty difficulty;
}
