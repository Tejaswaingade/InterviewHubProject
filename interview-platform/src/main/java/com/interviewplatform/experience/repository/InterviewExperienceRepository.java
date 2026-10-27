package com.interviewplatform.experience.repository;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InterviewExperienceRepository extends JpaRepository<InterviewExperience, Long>, JpaSpecificationExecutor<InterviewExperience> {

    Page<InterviewExperience> findByUserId(Long userId, Pageable pageable);

    Page<InterviewExperience> findByCompanyId(Long companyId, Pageable pageable);

    List<InterviewExperience> findByCompanyId(Long companyId);

    List<InterviewExperience> findByUserId(Long userId);

    Page<InterviewExperience> findByOverallDifficulty(Difficulty overallDifficulty, Pageable pageable);

    Page<InterviewExperience> findByJobRoleContainingIgnoreCase(String jobRole, Pageable pageable);

    @Query("SELECT DISTINCT e.user.id FROM InterviewExperience e WHERE e.user.id IS NOT NULL")
    List<Long> findDistinctAuthorUserIds();
}
