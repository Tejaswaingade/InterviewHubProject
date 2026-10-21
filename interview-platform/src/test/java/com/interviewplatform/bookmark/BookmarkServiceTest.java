package com.interviewplatform.bookmark;

import com.interviewplatform.bookmark.dto.BookmarkRequest;
import com.interviewplatform.bookmark.dto.BookmarkResponse;
import com.interviewplatform.bookmark.entity.Bookmark;
import com.interviewplatform.bookmark.entity.BookmarkStatus;
import com.interviewplatform.bookmark.repository.BookmarkRepository;
import com.interviewplatform.bookmark.service.BookmarkService;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.experience.dto.ExperienceResponse;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.experience.service.InterviewExperienceService;
import com.interviewplatform.user.entity.Role;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookmarkServiceTest {

    @Mock
    private BookmarkRepository bookmarkRepository;

    @Mock
    private InterviewExperienceRepository experienceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InterviewExperienceService experienceService;

    @InjectMocks
    private BookmarkService bookmarkService;

    private User user;
    private InterviewExperience experience;
    private Bookmark bookmark;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .name("Tejas")
                .email("tejas@example.com")
                .role(Role.USER)
                .build();

        Company company = Company.builder()
                .id(1L)
                .name("Google")
                .build();

        experience = InterviewExperience.builder()
                .id(10L)
                .user(user)
                .company(company)
                .jobRole("Senior Software Engineer")
                .experienceTitle("Google SDE-3 Interview")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .baseSalary(3500000.0)
                .totalCompensation(5200000.0)
                .currency("INR")
                .build();

        bookmark = Bookmark.builder()
                .id(100L)
                .user(user)
                .experience(experience)
                .status(BookmarkStatus.PLANNING)
                .notes("Review system design notes")
                .build();
    }

    @Test
    @DisplayName("Should retrieve all bookmarks for user")
    void shouldGetUserBookmarks() {
        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(user));
        when(bookmarkRepository.findAllByUserIdWithDetails(1L)).thenReturn(List.of(bookmark));
        when(experienceService.getById(10L)).thenReturn(ExperienceResponse.builder().id(10L).jobRole("Senior Software Engineer").build());

        List<BookmarkResponse> result = bookmarkService.getUserBookmarks("tejas@example.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getExperienceId()).isEqualTo(10L);
        assertThat(result.get(0).getStatus()).isEqualTo(BookmarkStatus.PLANNING);
    }

    @Test
    @DisplayName("Should toggle bookmark: add when not present")
    void shouldAddBookmarkWhenNotPresent() {
        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(user));
        when(bookmarkRepository.findByUserIdAndExperienceId(1L, 10L)).thenReturn(Optional.empty());
        when(experienceRepository.findById(10L)).thenReturn(Optional.of(experience));
        when(bookmarkRepository.save(any(Bookmark.class))).thenReturn(bookmark);
        when(experienceService.getById(10L)).thenReturn(ExperienceResponse.builder().id(10L).build());

        BookmarkResponse response = bookmarkService.toggleBookmark(10L, "tejas@example.com");

        assertThat(response).isNotNull();
        assertThat(response.getExperienceId()).isEqualTo(10L);
        verify(bookmarkRepository).save(any(Bookmark.class));
    }

    @Test
    @DisplayName("Should toggle bookmark: delete when already present")
    void shouldDeleteBookmarkWhenAlreadyPresent() {
        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(user));
        when(bookmarkRepository.findByUserIdAndExperienceId(1L, 10L)).thenReturn(Optional.of(bookmark));

        BookmarkResponse response = bookmarkService.toggleBookmark(10L, "tejas@example.com");

        assertThat(response).isNull();
        verify(bookmarkRepository).delete(bookmark);
    }

    @Test
    @DisplayName("Should update bookmark status")
    void shouldUpdateBookmarkStatus() {
        when(userRepository.findByEmail("tejas@example.com")).thenReturn(Optional.of(user));
        when(bookmarkRepository.findByUserIdAndExperienceId(1L, 10L)).thenReturn(Optional.of(bookmark));
        when(bookmarkRepository.save(any(Bookmark.class))).thenReturn(bookmark);
        when(experienceService.getById(10L)).thenReturn(ExperienceResponse.builder().id(10L).build());

        BookmarkResponse response = bookmarkService.updateStatus(10L, BookmarkStatus.MASTERED, "tejas@example.com");

        assertThat(response).isNotNull();
        assertThat(bookmark.getStatus()).isEqualTo(BookmarkStatus.MASTERED);
        verify(bookmarkRepository).save(bookmark);
    }
}
