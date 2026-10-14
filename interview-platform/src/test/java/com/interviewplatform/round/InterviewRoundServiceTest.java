package com.interviewplatform.round;

import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.round.dto.CreateRoundRequest;
import com.interviewplatform.round.dto.RoundResponse;
import com.interviewplatform.round.dto.UpdateRoundRequest;
import com.interviewplatform.round.entity.InterviewRound;
import com.interviewplatform.round.repository.InterviewRoundRepository;
import com.interviewplatform.round.service.InterviewRoundService;
import com.interviewplatform.user.entity.Role;
import com.interviewplatform.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterviewRoundServiceTest {

    @Mock
    private InterviewRoundRepository roundRepository;

    @Mock
    private InterviewExperienceRepository experienceRepository;

    @InjectMocks
    private InterviewRoundService roundService;

    private User owner;
    private User otherUser;
    private InterviewExperience experience;
    private InterviewRound round1;
    private InterviewRound round2;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .role(Role.USER)
                .build();

        otherUser = User.builder()
                .id(2L)
                .name("Bob")
                .email("bob@example.com")
                .role(Role.USER)
                .build();

        Company company = Company.builder().id(10L).name("Google").build();

        experience = InterviewExperience.builder()
                .id(100L)
                .user(owner)
                .company(company)
                .jobRole("Software Engineer")
                .experienceTitle("Google SDE 2")
                .description("Rounds description")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .yearsOfExperience(3.0)
                .build();

        round1 = InterviewRound.builder()
                .id(501L)
                .experience(experience)
                .roundName("Technical Coding Round")
                .roundNumber(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        round2 = InterviewRound.builder()
                .id(502L)
                .experience(experience)
                .roundName("System Design Round")
                .roundNumber(2)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Create round - Success as Owner: Saves and returns RoundResponse")
    void createRound_asOwner_success() {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundName("Technical Coding Round")
                .roundNumber(1)
                .build();

        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));
        when(roundRepository.save(any(InterviewRound.class))).thenReturn(round1);

        RoundResponse response = roundService.createRound(100L, request, "alice@example.com", false);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(501L);
        assertThat(response.getRoundName()).isEqualTo("Technical Coding Round");
        assertThat(response.getRoundNumber()).isEqualTo(1);
        assertThat(response.getExperienceId()).isEqualTo(100L);
        verify(roundRepository).save(any(InterviewRound.class));
    }

    @Test
    @DisplayName("Create round - Success as Admin: Can add round to any experience")
    void createRound_asAdmin_success() {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundName("Technical Coding Round")
                .roundNumber(1)
                .build();

        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));
        when(roundRepository.save(any(InterviewRound.class))).thenReturn(round1);

        RoundResponse response = roundService.createRound(100L, request, "admin@example.com", true);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(501L);
    }

    @Test
    @DisplayName("Create round - Unauthorized User: Throws AccessDeniedException")
    void createRound_unauthorized_throwsAccessDenied() {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundName("Hacked Round")
                .roundNumber(1)
                .build();

        when(experienceRepository.findById(100L)).thenReturn(Optional.of(experience));

        assertThatThrownBy(() -> roundService.createRound(100L, request, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to add rounds to this interview experience");

        verify(roundRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create round - Experience Not Found: Throws ResourceNotFoundException")
    void createRound_experienceNotFound_throwsException() {
        CreateRoundRequest request = CreateRoundRequest.builder().roundName("Round").roundNumber(1).build();
        when(experienceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roundService.createRound(999L, request, "alice@example.com", false))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Interview experience not found with id: 999");
    }

    @Test
    @DisplayName("GetRoundsByExperienceId - Success: Returns list of rounds")
    void getRoundsByExperienceId_success() {
        when(experienceRepository.existsById(100L)).thenReturn(true);
        when(roundRepository.findByExperienceId(100L)).thenReturn(List.of(round1, round2));

        List<RoundResponse> rounds = roundService.getRoundsByExperienceId(100L);

        assertThat(rounds).hasSize(2);
        assertThat(rounds.get(0).getRoundName()).isEqualTo("Technical Coding Round");
        assertThat(rounds.get(1).getRoundName()).isEqualTo("System Design Round");
    }

    @Test
    @DisplayName("GetRoundsByExperienceId - Experience Not Found: Throws ResourceNotFoundException")
    void getRoundsByExperienceId_notFound_throwsException() {
        when(experienceRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> roundService.getRoundsByExperienceId(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Interview experience not found with id: 999");
    }

    @Test
    @DisplayName("GetRoundById - Success: Returns RoundResponse")
    void getRoundById_success() {
        when(roundRepository.findById(501L)).thenReturn(Optional.of(round1));

        RoundResponse response = roundService.getRoundById(501L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(501L);
        assertThat(response.getRoundName()).isEqualTo("Technical Coding Round");
    }

    @Test
    @DisplayName("GetRoundById - Not Found: Throws ResourceNotFoundException")
    void getRoundById_notFound_throwsException() {
        when(roundRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roundService.getRoundById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Interview round not found with id: 999");
    }

    @Test
    @DisplayName("GetAllRounds - Returns all rounds across platform")
    void getAllRounds_returnsAll() {
        when(roundRepository.findAll()).thenReturn(List.of(round1, round2));

        List<RoundResponse> rounds = roundService.getAllRounds();

        assertThat(rounds).hasSize(2);
    }

    @Test
    @DisplayName("Update round - Success as Owner: Updates roundName and roundNumber")
    void updateRound_asOwner_success() {
        UpdateRoundRequest request = UpdateRoundRequest.builder()
                .roundName("HR Discussion")
                .roundNumber(3)
                .build();

        when(roundRepository.findById(501L)).thenReturn(Optional.of(round1));
        when(roundRepository.save(any(InterviewRound.class))).thenAnswer(i -> i.getArgument(0));

        RoundResponse response = roundService.updateRound(501L, request, "alice@example.com", false);

        assertThat(response).isNotNull();
        assertThat(response.getRoundName()).isEqualTo("HR Discussion");
        assertThat(response.getRoundNumber()).isEqualTo(3);
    }

    @Test
    @DisplayName("Update round - Success as Admin: Updates any round")
    void updateRound_asAdmin_success() {
        UpdateRoundRequest request = UpdateRoundRequest.builder()
                .roundName("Admin Edited Round")
                .roundNumber(1)
                .build();

        when(roundRepository.findById(501L)).thenReturn(Optional.of(round1));
        when(roundRepository.save(any(InterviewRound.class))).thenAnswer(i -> i.getArgument(0));

        RoundResponse response = roundService.updateRound(501L, request, "admin@example.com", true);

        assertThat(response).isNotNull();
        assertThat(response.getRoundName()).isEqualTo("Admin Edited Round");
    }

    @Test
    @DisplayName("Update round - Unauthorized User: Throws AccessDeniedException")
    void updateRound_unauthorized_throwsAccessDenied() {
        UpdateRoundRequest request = UpdateRoundRequest.builder()
                .roundName("Hacked")
                .build();

        when(roundRepository.findById(501L)).thenReturn(Optional.of(round1));

        assertThatThrownBy(() -> roundService.updateRound(501L, request, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to update this interview round");

        verify(roundRepository, never()).save(any());
    }

    @Test
    @DisplayName("Delete round - Success as Owner: Deletes round")
    void deleteRound_asOwner_success() {
        when(roundRepository.findById(501L)).thenReturn(Optional.of(round1));

        roundService.deleteRound(501L, "alice@example.com", false);

        verify(roundRepository).delete(round1);
    }

    @Test
    @DisplayName("Delete round - Success as Admin: Deletes any round")
    void deleteRound_asAdmin_success() {
        when(roundRepository.findById(501L)).thenReturn(Optional.of(round1));

        roundService.deleteRound(501L, "admin@example.com", true);

        verify(roundRepository).delete(round1);
    }

    @Test
    @DisplayName("Delete round - Unauthorized User: Throws AccessDeniedException")
    void deleteRound_unauthorized_throwsAccessDenied() {
        when(roundRepository.findById(501L)).thenReturn(Optional.of(round1));

        assertThatThrownBy(() -> roundService.deleteRound(501L, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to delete this interview round");

        verify(roundRepository, never()).delete(any());
    }
}
