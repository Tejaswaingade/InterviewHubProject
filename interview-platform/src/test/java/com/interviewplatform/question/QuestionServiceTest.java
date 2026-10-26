package com.interviewplatform.question;

import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.company.entity.Company;
import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.entity.ResultStatus;
import com.interviewplatform.question.dto.CreateQuestionRequest;
import com.interviewplatform.question.dto.QuestionResponse;
import com.interviewplatform.question.dto.UpdateQuestionRequest;
import com.interviewplatform.question.entity.Question;
import com.interviewplatform.question.entity.QuestionType;
import com.interviewplatform.question.repository.QuestionRepository;
import com.interviewplatform.question.service.QuestionService;
import com.interviewplatform.round.entity.InterviewRound;
import com.interviewplatform.round.repository.InterviewRoundRepository;
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
class QuestionServiceTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private InterviewRoundRepository roundRepository;

    @InjectMocks
    private QuestionService questionService;

    private User owner;
    private InterviewExperience experience;
    private InterviewRound round;
    private Question question1;
    private Question question2;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .role(Role.USER)
                .build();

        Company company = Company.builder().id(10L).name("Google").build();

        experience = InterviewExperience.builder()
                .id(100L)
                .user(owner)
                .company(company)
                .jobRole("Software Engineer")
                .experienceTitle("Google SDE 2")
                .overallDifficulty(Difficulty.HARD)
                .result(ResultStatus.SELECTED)
                .build();

        round = InterviewRound.builder()
                .id(500L)
                .experience(experience)
                .roundName("Technical Coding")
                .roundNumber(1)
                .build();

        question1 = Question.builder()
                .id(1001L)
                .round(round)
                .questionText("Implement LRU Cache")
                .questionType(QuestionType.DSA)
                .difficulty(Difficulty.MEDIUM)
                .topic("Data Structures")
                .answer("Use a Doubly Linked List and a HashMap")
                .createdAt(LocalDateTime.now())
                .build();

        question2 = Question.builder()
                .id(1002L)
                .round(round)
                .questionText("Explain Spring Boot Autoconfiguration")
                .questionType(QuestionType.SPRING_BOOT)
                .difficulty(Difficulty.EASY)
                .topic("Spring Boot")
                .answer("@EnableAutoConfiguration and spring.factories")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Create question - Success as Owner: Saves and returns QuestionResponse")
    void createQuestion_asOwner_success() {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("Implement LRU Cache")
                .questionType(QuestionType.DSA)
                .difficulty(Difficulty.MEDIUM)
                .topic("Data Structures")
                .answer("Use DLL and Map")
                .build();

        when(roundRepository.findById(500L)).thenReturn(Optional.of(round));
        when(questionRepository.save(any(Question.class))).thenReturn(question1);

        QuestionResponse response = questionService.createQuestion(500L, request, "alice@example.com", false);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1001L);
        assertThat(response.getQuestionText()).isEqualTo("Implement LRU Cache");
        assertThat(response.getQuestionType()).isEqualTo(QuestionType.DSA);
        assertThat(response.getRoundId()).isEqualTo(500L);
        verify(questionRepository).save(any(Question.class));
    }

    @Test
    @DisplayName("Create question - Success as Admin: Can add question to any round")
    void createQuestion_asAdmin_success() {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("Implement LRU Cache")
                .questionType(QuestionType.DSA)
                .difficulty(Difficulty.MEDIUM)
                .build();

        when(roundRepository.findById(500L)).thenReturn(Optional.of(round));
        when(questionRepository.save(any(Question.class))).thenReturn(question1);

        QuestionResponse response = questionService.createQuestion(500L, request, "admin@example.com", true);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1001L);
    }

    @Test
    @DisplayName("Create question - Unauthorized User: Throws AccessDeniedException")
    void createQuestion_unauthorized_throwsAccessDenied() {
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .questionText("Hacked Question")
                .build();

        when(roundRepository.findById(500L)).thenReturn(Optional.of(round));

        assertThatThrownBy(() -> questionService.createQuestion(500L, request, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to add questions to this interview round");

        verify(questionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create question - Round Not Found: Throws ResourceNotFoundException")
    void createQuestion_roundNotFound_throwsException() {
        CreateQuestionRequest request = CreateQuestionRequest.builder().questionText("Text").build();
        when(roundRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> questionService.createQuestion(999L, request, "alice@example.com", false))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Interview round not found with id: 999");
    }

    @Test
    @DisplayName("GetQuestionsByRound - Success: Returns list of questions in round")
    void getQuestionsByRound_success() {
        when(roundRepository.existsById(500L)).thenReturn(true);
        when(questionRepository.findByRoundIdOrderByCreatedAtAsc(500L)).thenReturn(List.of(question1, question2));

        List<QuestionResponse> questions = questionService.getQuestionsByRound(500L);

        assertThat(questions).hasSize(2);
        assertThat(questions.get(0).getQuestionText()).isEqualTo("Implement LRU Cache");
        assertThat(questions.get(1).getQuestionText()).isEqualTo("Explain Spring Boot Autoconfiguration");
    }

    @Test
    @DisplayName("GetQuestionsByRound - Round Not Found: Throws ResourceNotFoundException")
    void getQuestionsByRound_notFound_throwsException() {
        when(roundRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> questionService.getQuestionsByRound(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Interview round not found with id: 999");
    }

    @Test
    @DisplayName("GetAllQuestions - Returns all questions across platform")
    void getAllQuestions_returnsAll() {
        when(questionRepository.findAll()).thenReturn(List.of(question1, question2));

        List<QuestionResponse> questions = questionService.getAllQuestions();

        assertThat(questions).hasSize(2);
    }

    @Test
    @DisplayName("Update question - Success as Owner: Updates fields and returns QuestionResponse")
    void updateQuestion_asOwner_success() {
        UpdateQuestionRequest request = UpdateQuestionRequest.builder()
                .questionText("Updated LRU Cache")
                .questionType(QuestionType.DSA)
                .difficulty(Difficulty.HARD)
                .topic("Algorithms & Data Structures")
                .answer("Detailed answer")
                .build();

        when(questionRepository.findById(1001L)).thenReturn(Optional.of(question1));
        when(questionRepository.save(any(Question.class))).thenAnswer(i -> i.getArgument(0));

        QuestionResponse response = questionService.updateQuestion(1001L, request, "alice@example.com", false);

        assertThat(response).isNotNull();
        assertThat(response.getQuestionText()).isEqualTo("Updated LRU Cache");
        assertThat(response.getDifficulty()).isEqualTo(Difficulty.HARD);
    }

    @Test
    @DisplayName("Update question - Success as Admin: Updates any question")
    void updateQuestion_asAdmin_success() {
        UpdateQuestionRequest request = UpdateQuestionRequest.builder()
                .questionText("Admin Edited Question")
                .questionType(QuestionType.OTHER)
                .difficulty(Difficulty.EASY)
                .build();

        when(questionRepository.findById(1001L)).thenReturn(Optional.of(question1));
        when(questionRepository.save(any(Question.class))).thenAnswer(i -> i.getArgument(0));

        QuestionResponse response = questionService.updateQuestion(1001L, request, "admin@example.com", true);

        assertThat(response).isNotNull();
        assertThat(response.getQuestionText()).isEqualTo("Admin Edited Question");
    }

    @Test
    @DisplayName("Update question - Unauthorized User: Throws AccessDeniedException")
    void updateQuestion_unauthorized_throwsAccessDenied() {
        UpdateQuestionRequest request = UpdateQuestionRequest.builder()
                .questionText("Hacked")
                .build();

        when(questionRepository.findById(1001L)).thenReturn(Optional.of(question1));

        assertThatThrownBy(() -> questionService.updateQuestion(1001L, request, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to update this question");

        verify(questionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Delete question - Success as Owner: Deletes question")
    void deleteQuestion_asOwner_success() {
        when(questionRepository.findById(1001L)).thenReturn(Optional.of(question1));

        questionService.deleteQuestion(1001L, "alice@example.com", false);

        verify(questionRepository).delete(question1);
    }

    @Test
    @DisplayName("Delete question - Success as Admin: Deletes any question")
    void deleteQuestion_asAdmin_success() {
        when(questionRepository.findById(1001L)).thenReturn(Optional.of(question1));

        questionService.deleteQuestion(1001L, "admin@example.com", true);

        verify(questionRepository).delete(question1);
    }

    @Test
    @DisplayName("Delete question - Unauthorized User: Throws AccessDeniedException")
    void deleteQuestion_unauthorized_throwsAccessDenied() {
        when(questionRepository.findById(1001L)).thenReturn(Optional.of(question1));

        assertThatThrownBy(() -> questionService.deleteQuestion(1001L, "bob@example.com", false))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("You do not have permission to delete this question");

        verify(questionRepository, never()).delete(any());
    }
}
