package com.interviewplatform.round.repository;

import com.interviewplatform.round.entity.InterviewRound;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewRoundRepository extends JpaRepository<InterviewRound, Long> {

    List<InterviewRound> findByExperienceId(Long experienceId);
}
