package com.interviewplatform.bookmark.service;

import com.interviewplatform.bookmark.dto.BookmarkRequest;
import com.interviewplatform.bookmark.dto.BookmarkResponse;
import com.interviewplatform.bookmark.entity.Bookmark;
import com.interviewplatform.bookmark.entity.BookmarkStatus;
import com.interviewplatform.bookmark.repository.BookmarkRepository;
import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.experience.dto.ExperienceResponse;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.experience.service.InterviewExperienceService;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final InterviewExperienceRepository experienceRepository;
    private final UserRepository userRepository;
    private final InterviewExperienceService experienceService;

    @Transactional(readOnly = true)
    public List<BookmarkResponse> getUserBookmarks(String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        return bookmarkRepository.findAllByUserIdWithDetails(user.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Long> getUserBookmarkedExperienceIds(String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        return bookmarkRepository.findAllByUserIdWithDetails(user.getId())
                .stream()
                .map(b -> b.getExperience().getId())
                .collect(Collectors.toList());
    }

    @Transactional
    public BookmarkResponse toggleBookmark(Long experienceId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        Optional<Bookmark> existing = bookmarkRepository.findByUserIdAndExperienceId(user.getId(), experienceId);

        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            return null; // indicates removed
        } else {
            InterviewExperience exp = experienceRepository.findById(experienceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Interview experience not found with id: " + experienceId));
            Bookmark bookmark = Bookmark.builder()
                    .user(user)
                    .experience(exp)
                    .status(BookmarkStatus.PLANNING)
                    .build();
            Bookmark saved = bookmarkRepository.save(bookmark);
            return toResponse(saved);
        }
    }

    @Transactional
    public BookmarkResponse saveOrUpdateBookmark(Long idOrExperienceId, BookmarkRequest request, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);

        Bookmark bookmark = bookmarkRepository.findById(idOrExperienceId)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .or(() -> bookmarkRepository.findByUserIdAndExperienceId(user.getId(), idOrExperienceId))
                .orElseGet(() -> {
                    InterviewExperience exp = experienceRepository.findById(idOrExperienceId)
                            .orElseThrow(() -> new ResourceNotFoundException("Interview experience not found with id: " + idOrExperienceId));
                    return Bookmark.builder()
                            .user(user)
                            .experience(exp)
                            .status(BookmarkStatus.PLANNING)
                            .build();
                });

        if (request != null) {
            if (request.getStatus() != null) bookmark.setStatus(request.getStatus());
            if (request.getNotes() != null) bookmark.setNotes(request.getNotes());
            if (request.getTargetDate() != null) bookmark.setTargetDate(request.getTargetDate());
        }

        Bookmark saved = bookmarkRepository.save(bookmark);
        return toResponse(saved);
    }

    @Transactional
    public BookmarkResponse updateStatus(Long idOrExperienceId, BookmarkStatus status, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        Bookmark bookmark = bookmarkRepository.findById(idOrExperienceId)
                .filter(b -> b.getUser().getId().equals(user.getId()))
                .or(() -> bookmarkRepository.findByUserIdAndExperienceId(user.getId(), idOrExperienceId))
                .orElseThrow(() -> new ResourceNotFoundException("Bookmark not found for id: " + idOrExperienceId));

        bookmark.setStatus(status);
        Bookmark saved = bookmarkRepository.save(bookmark);
        return toResponse(saved);
    }

    @Transactional
    public void deleteBookmark(Long idOrExperienceId, String currentUserEmail) {
        User user = getUserByEmail(currentUserEmail);
        Optional<Bookmark> byId = bookmarkRepository.findById(idOrExperienceId)
                .filter(b -> b.getUser().getId().equals(user.getId()));

        if (byId.isPresent()) {
            bookmarkRepository.delete(byId.get());
        } else {
            bookmarkRepository.deleteByUserIdAndExperienceId(user.getId(), idOrExperienceId);
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private BookmarkResponse toResponse(Bookmark b) {
        ExperienceResponse expResponse = experienceService.getById(b.getExperience().getId());
        return BookmarkResponse.builder()
                .id(b.getId())
                .experienceId(b.getExperience().getId())
                .experience(expResponse)
                .status(b.getStatus())
                .notes(b.getNotes())
                .targetDate(b.getTargetDate())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
