package com.interviewplatform.question.service;

import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.question.dto.CreateQuestionRequest;
import com.interviewplatform.question.dto.PatchQuestionRequest;
import com.interviewplatform.question.dto.QuestionResponse;
import com.interviewplatform.question.dto.UpdateQuestionRequest;
import com.interviewplatform.question.entity.Question;
import com.interviewplatform.question.repository.QuestionRepository;
import com.interviewplatform.round.entity.InterviewRound;
import com.interviewplatform.round.repository.InterviewRoundRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final InterviewRoundRepository roundRepository;

    public QuestionService(QuestionRepository questionRepository, InterviewRoundRepository roundRepository) {
        this.questionRepository = questionRepository;
        this.roundRepository = roundRepository;
    }

    @Transactional
    public QuestionResponse createQuestion(Long roundId, CreateQuestionRequest request, String currentUserEmail, boolean isAdmin) {
        InterviewRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview round not found with id: " + roundId));

        InterviewExperience experience = round.getExperience();
        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to add questions to this interview round");
        }

        Question question = Question.builder()
                .round(round)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .difficulty(request.getDifficulty())
                .topic(request.getTopic())
                .answer(request.getAnswer())
                .build();

        Question saved = questionRepository.save(question);
        return toResponse(saved);
    }

    public List<QuestionResponse> getQuestionsByRound(Long roundId) {
        if (!roundRepository.existsById(roundId)) {
            throw new ResourceNotFoundException("Interview round not found with id: " + roundId);
        }

        return questionRepository.findByRoundIdOrderByCreatedAtAsc(roundId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<QuestionResponse> getAllQuestions() {
        return questionRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public QuestionResponse updateQuestion(Long questionId, UpdateQuestionRequest request, String currentUserEmail, boolean isAdmin) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

        InterviewExperience experience = question.getRound().getExperience();
        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to update this question");
        }

        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setDifficulty(request.getDifficulty());
        question.setTopic(request.getTopic());
        question.setAnswer(request.getAnswer());

        Question updated = questionRepository.save(question);
        return toResponse(updated);
    }

    @Transactional
    public QuestionResponse patchQuestion(Long questionId, PatchQuestionRequest request, String currentUserEmail, boolean isAdmin) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

        InterviewExperience experience = question.getRound().getExperience();
        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to update this question");
        }

        if (request.getQuestionText() != null && !request.getQuestionText().isBlank()) {
            question.setQuestionText(request.getQuestionText());
        }

        if (request.getQuestionType() != null) {
            question.setQuestionType(request.getQuestionType());
        }

        if (request.getDifficulty() != null) {
            question.setDifficulty(request.getDifficulty());
        }

        if (request.getTopic() != null) {
            question.setTopic(request.getTopic());
        }

        if (request.getAnswer() != null) {
            question.setAnswer(request.getAnswer());
        }

        Question updated = questionRepository.save(question);
        return toResponse(updated);
    }

    @Transactional
    public void deleteQuestion(Long questionId, String currentUserEmail, boolean isAdmin) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

        InterviewExperience experience = question.getRound().getExperience();
        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to delete this question");
        }

        questionRepository.delete(question);
    }

    private QuestionResponse toResponse(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .roundId(question.getRound().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .difficulty(question.getDifficulty())
                .topic(question.getTopic())
                .answer(question.getAnswer())
                .createdAt(question.getCreatedAt())
                .build();
    }
}
