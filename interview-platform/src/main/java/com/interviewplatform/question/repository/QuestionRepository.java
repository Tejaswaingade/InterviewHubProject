package com.interviewplatform.question.repository;

import com.interviewplatform.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByRoundId(Long roundId);

    List<Question> findByRoundIdOrderByCreatedAtAsc(Long roundId);
}
