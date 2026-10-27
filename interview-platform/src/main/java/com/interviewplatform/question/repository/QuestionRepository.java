package com.interviewplatform.question.repository;

import com.interviewplatform.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByRoundId(Long roundId);

    List<Question> findByRoundIdOrderByCreatedAtAsc(Long roundId);
}
