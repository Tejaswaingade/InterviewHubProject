package com.interviewplatform.round.service;

import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.round.dto.CreateRoundRequest;
import com.interviewplatform.round.dto.PatchRoundRequest;
import com.interviewplatform.round.dto.RoundResponse;
import com.interviewplatform.round.dto.UpdateRoundRequest;
import com.interviewplatform.round.entity.InterviewRound;
import com.interviewplatform.round.repository.InterviewRoundRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class InterviewRoundService {

    private final InterviewRoundRepository roundRepository;
    private final InterviewExperienceRepository experienceRepository;

    public InterviewRoundService(InterviewRoundRepository roundRepository,
                                 InterviewExperienceRepository experienceRepository) {
        this.roundRepository = roundRepository;
        this.experienceRepository = experienceRepository;
    }

    @Transactional
    public RoundResponse createRound(Long experienceId, CreateRoundRequest request, String currentUserEmail, boolean isAdmin) {
        InterviewExperience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview experience not found with id: " + experienceId));

        if (!isAdmin && !experience.getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to add rounds to this interview experience");
        }

        InterviewRound round = InterviewRound.builder()
                .experience(experience)
                .roundName(request.getRoundName())
                .roundNumber(request.getRoundNumber())
                .roundType(request.getRoundType())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .build();

        InterviewRound saved = roundRepository.save(round);
        return toResponse(saved);
    }

    public List<RoundResponse> getRoundsByExperienceId(Long experienceId) {
        if (!experienceRepository.existsById(experienceId)) {
            throw new ResourceNotFoundException("Interview experience not found with id: " + experienceId);
        }

        return roundRepository.findByExperienceId(experienceId).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RoundResponse> getAllRounds() {
        return roundRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public RoundResponse getRoundById(Long roundId) {
        InterviewRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview round not found with id: " + roundId));
        return toResponse(round);
    }

    @Transactional
    public RoundResponse updateRound(Long roundId, UpdateRoundRequest request, String currentUserEmail, boolean isAdmin) {
        InterviewRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview round not found with id: " + roundId));

        if (!isAdmin && !round.getExperience().getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to update this interview round");
        }

        round.setRoundName(request.getRoundName());
        round.setRoundNumber(request.getRoundNumber());
        if (request.getRoundType() != null) {
            round.setRoundType(request.getRoundType());
        }
        if (request.getDescription() != null) {
            round.setDescription(request.getDescription());
        }
        if (request.getDifficulty() != null) {
            round.setDifficulty(request.getDifficulty());
        }

        InterviewRound updated = roundRepository.save(round);
        return toResponse(updated);
    }

    @Transactional
    public RoundResponse patchRound(Long roundId, PatchRoundRequest request, String currentUserEmail, boolean isAdmin) {
        InterviewRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview round not found with id: " + roundId));

        if (!isAdmin && !round.getExperience().getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to update this interview round");
        }

        if (request.getRoundName() != null && !request.getRoundName().isBlank()) {
            round.setRoundName(request.getRoundName());
        }

        if (request.getRoundNumber() != null) {
            round.setRoundNumber(request.getRoundNumber());
        }

        InterviewRound updated = roundRepository.save(round);
        return toResponse(updated);
    }

    @Transactional
    public void deleteRound(Long roundId, String currentUserEmail, boolean isAdmin) {
        InterviewRound round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview round not found with id: " + roundId));

        if (!isAdmin && !round.getExperience().getUser().getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new AccessDeniedException("You do not have permission to delete this interview round");
        }

        roundRepository.delete(round);
    }

    public RoundResponse toResponse(InterviewRound round) {
        return RoundResponse.builder()
                .id(round.getId())
                .experienceId(round.getExperience().getId())
                .roundName(round.getRoundName())
                .roundNumber(round.getRoundNumber())
                .roundType(round.getRoundType())
                .description(round.getDescription())
                .difficulty(round.getDifficulty())
                .createdAt(round.getCreatedAt())
                .updatedAt(round.getUpdatedAt())
                .build();
    }
}
