package com.interviewplatform.round.dto;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.round.entity.RoundType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Interview round details response")
public class RoundResponse {

    @Schema(description = "Unique identifier of the round", example = "1")
    private Long id;

    @Schema(description = "ID of the associated interview experience", example = "10")
    private Long experienceId;

    @Schema(description = "Name of the interview round", example = "Technical Round 1")
    private String roundName;

    @Schema(description = "Sequence number of the round", example = "1")
    private Integer roundNumber;

    @Schema(description = "Categorized round type")
    private RoundType roundType;

    @Schema(description = "Detailed description of the round")
    private String description;

    @Schema(description = "Difficulty level of the round")
    private Difficulty difficulty;

    @Schema(description = "Timestamp when the round was created")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the round was last updated")
    private LocalDateTime updatedAt;
}
