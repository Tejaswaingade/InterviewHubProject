package com.interviewplatform.bookmark.repository;

import com.interviewplatform.bookmark.entity.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    @Query("SELECT b FROM Bookmark b JOIN FETCH b.experience e JOIN FETCH e.company JOIN FETCH e.user WHERE b.user.id = :userId ORDER BY b.createdAt DESC")
    List<Bookmark> findAllByUserIdWithDetails(Long userId);

    @Query("SELECT b FROM Bookmark b JOIN FETCH b.experience e JOIN FETCH e.company JOIN FETCH e.user WHERE b.user.id = :userId")
    Page<Bookmark> findByUserId(Long userId, Pageable pageable);

    Optional<Bookmark> findByUserIdAndExperienceId(Long userId, Long experienceId);

    boolean existsByUserIdAndExperienceId(Long userId, Long experienceId);

    void deleteByUserIdAndExperienceId(Long userId, Long experienceId);

    long countByUserId(Long userId);
}
