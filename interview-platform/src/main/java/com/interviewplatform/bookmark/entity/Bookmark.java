package com.interviewplatform.bookmark.entity;

import com.interviewplatform.experience.entity.InterviewExperience;
import com.interviewplatform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookmarks", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_experience_bookmark", columnNames = {"user_id", "experience_id"})
}, indexes = {
        @Index(name = "idx_bookmark_user_id", columnList = "user_id"),
        @Index(name = "idx_bookmark_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "experience_id", nullable = false)
    private InterviewExperience experience;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BookmarkStatus status = BookmarkStatus.PLANNING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "target_date")
    private LocalDateTime targetDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
