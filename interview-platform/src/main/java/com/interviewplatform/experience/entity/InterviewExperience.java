package com.interviewplatform.experience.entity;

import com.interviewplatform.company.entity.Company;
import com.interviewplatform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_experiences", indexes = {
        @Index(name = "idx_exp_company_id", columnList = "company_id"),
        @Index(name = "idx_exp_user_id", columnList = "user_id"),
        @Index(name = "idx_exp_difficulty", columnList = "overall_difficulty"),
        @Index(name = "idx_exp_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "job_role", nullable = false)
    private String jobRole;

    @Column(name = "experience_title", nullable = false)
    private String experienceTitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "overall_difficulty", nullable = false)
    private Difficulty overallDifficulty;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false)
    private ResultStatus result;

    @Column(name = "years_of_experience")
    private Double yearsOfExperience;

    // --- Verified Offer & Compensation Details (Optional) ---
    @Column(name = "base_salary")
    private Double baseSalary;

    @Column(name = "stock_grant")
    private Double stockGrant;

    @Column(name = "signing_bonus")
    private Double signingBonus;

    @Column(name = "total_compensation")
    private Double totalCompensation;

    @Column(name = "currency", length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "job_level", length = 50)
    private String jobLevel;

    @Column(name = "offer_accepted")
    private Boolean offerAccepted;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
