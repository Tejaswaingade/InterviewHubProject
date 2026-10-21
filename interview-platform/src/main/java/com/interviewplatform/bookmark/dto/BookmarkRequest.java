package com.interviewplatform.bookmark.dto;

import com.interviewplatform.bookmark.entity.BookmarkStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request body for adding or updating an interview bookmark/roadmap entry")
public class BookmarkRequest {

    @Schema(description = "Prep status for this experience", example = "PLANNING")
    private BookmarkStatus status;

    @Schema(description = "Personal study notes or checklist for this interview loop", example = "Focus on Round 2 Distributed Cache design.")
    private String notes;

    @Schema(description = "Target completion date for reviewing this loop")
    private LocalDateTime targetDate;
}
