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
@Schema(description = "Request body for updating an interview round")
public class UpdateRoundRequest {

    @NotBlank(message = "Round name is required")
    @Schema(description = "Updated name of the interview round", example = "System Design Round")
    private String roundName;

    @NotNull(message = "Round number is required")
    @Min(value = 1, message = "Round number must be at least 1")
    @Schema(description = "Updated sequence number of the interview round", example = "2")
    private Integer roundNumber;

    @Schema(description = "Type of the round", example = "SYSTEM_DESIGN")
    private RoundType roundType;

    @Schema(description = "Description of the round")
    private String description;

    @Schema(description = "Difficulty rating for the round", example = "HARD")
    private Difficulty difficulty;
}
