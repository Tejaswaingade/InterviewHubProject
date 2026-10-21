package com.interviewplatform.bookmark.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.interviewplatform.bookmark.entity.BookmarkStatus;
import com.interviewplatform.experience.dto.ExperienceResponse;
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
public class BookmarkResponse {

    private Long id;
    private Long experienceId;
    private ExperienceResponse experience;
    private BookmarkStatus status;
    private String notes;
    private LocalDateTime targetDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
