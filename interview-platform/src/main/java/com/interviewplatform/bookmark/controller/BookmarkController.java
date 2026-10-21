package com.interviewplatform.bookmark.controller;

import com.interviewplatform.bookmark.dto.BookmarkRequest;
import com.interviewplatform.bookmark.dto.BookmarkResponse;
import com.interviewplatform.bookmark.entity.BookmarkStatus;
import com.interviewplatform.bookmark.service.BookmarkService;
import com.interviewplatform.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@Tag(name = "Bookmarks & Roadmap", description = "Candidate Prep Roadmaps, bookmarks, and interview readiness tracker")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @GetMapping
    @Operation(summary = "Get all bookmarked experiences and roadmap items for current user")
    public ResponseEntity<ApiResponse<List<BookmarkResponse>>> getMyBookmarks(Authentication authentication) {
        List<BookmarkResponse> bookmarks = bookmarkService.getUserBookmarks(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Bookmarks retrieved successfully", bookmarks));
    }

    @GetMapping("/ids")
    @Operation(summary = "Get list of bookmarked experience IDs for current user")
    public ResponseEntity<ApiResponse<List<Long>>> getBookmarkedIds(Authentication authentication) {
        List<Long> ids = bookmarkService.getUserBookmarkedExperienceIds(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Bookmarked IDs retrieved successfully", ids));
    }

    @PostMapping("/{experienceId}/toggle")
    @Operation(summary = "Toggle bookmark for an experience (Add if not present, remove if present)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleBookmark(
            @PathVariable Long experienceId,
            Authentication authentication
    ) {
        BookmarkResponse result = bookmarkService.toggleBookmark(experienceId, authentication.getName());
        boolean isBookmarked = result != null;
        String message = isBookmarked ? "Experience saved to your Prep List" : "Experience removed from your Prep List";
        return ResponseEntity.ok(ApiResponse.success(message, Map.of(
                "bookmarked", isBookmarked,
                "bookmark", result != null ? result : Map.of()
        )));
    }

    @RequestMapping(value = "/{experienceId}", method = {RequestMethod.POST, RequestMethod.PUT})
    @Operation(summary = "Save or update roadmap notes and status for an experience")
    public ResponseEntity<ApiResponse<BookmarkResponse>> saveOrUpdate(
            @PathVariable Long experienceId,
            @RequestBody(required = false) BookmarkRequest request,
            Authentication authentication
    ) {
        BookmarkResponse response = bookmarkService.saveOrUpdateBookmark(experienceId, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Prep item updated successfully", response));
    }

    @PatchMapping("/{experienceId}/status")
    @Operation(summary = "Update prep status (PLANNING, IN_PROGRESS, REVIEWED, MASTERED)")
    public ResponseEntity<ApiResponse<BookmarkResponse>> updateStatus(
            @PathVariable Long experienceId,
            @RequestParam BookmarkStatus status,
            Authentication authentication
    ) {
        BookmarkResponse response = bookmarkService.updateStatus(experienceId, status, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Status updated to " + status, response));
    }

    @DeleteMapping("/{experienceId}")
    @Operation(summary = "Remove an experience from bookmarks")
    public ResponseEntity<ApiResponse<Void>> deleteBookmark(
            @PathVariable Long experienceId,
            Authentication authentication
    ) {
        bookmarkService.deleteBookmark(experienceId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Removed from bookmarks", null));
    }
}
