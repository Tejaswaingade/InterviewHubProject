package com.interviewplatform.round.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for partially updating an interview round")
public class PatchRoundRequest {

    @Schema(description = "Updated name of the interview round (optional)", example = "System Design Round")
    private String roundName;

    @Min(value = 1, message = "Round number must be at least 1")
    @Schema(description = "Updated sequence number of the interview round (optional)", example = "2")
    private Integer roundNumber;
}
