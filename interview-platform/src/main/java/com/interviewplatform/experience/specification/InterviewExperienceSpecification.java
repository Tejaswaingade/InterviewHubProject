package com.interviewplatform.experience.specification;

import com.interviewplatform.experience.entity.Difficulty;
import com.interviewplatform.experience.entity.InterviewExperience;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class InterviewExperienceSpecification {

    public static Specification<InterviewExperience> withFilters(Long companyId, Difficulty difficulty, String jobRole, String keyword) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (difficulty != null) {
                predicates.add(cb.equal(root.get("overallDifficulty"), difficulty));
            }

            if (jobRole != null && !jobRole.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("jobRole")), "%" + jobRole.trim().toLowerCase() + "%"));
            }

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("experienceTitle")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("jobRole")), pattern),
                        cb.like(cb.lower(root.get("company").get("name")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<InterviewExperience> withKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return cb.conjunction();
            }

            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("experienceTitle")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("jobRole")), pattern),
                    cb.like(cb.lower(root.get("company").get("name")), pattern)
            );
        };
    }
}
