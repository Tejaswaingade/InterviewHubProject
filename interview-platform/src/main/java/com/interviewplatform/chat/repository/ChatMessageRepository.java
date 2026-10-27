package com.interviewplatform.chat.repository;

import com.interviewplatform.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT c FROM ChatMessage c WHERE (c.senderId = :userA AND c.receiverId = :userB) OR (c.senderId = :userB AND c.receiverId = :userA) ORDER BY c.createdAt ASC")
    List<ChatMessage> findConversationBetween(@Param("userA") Long userA, @Param("userB") Long userB);

    @Query("SELECT c FROM ChatMessage c WHERE c.senderId = :userId OR c.receiverId = :userId ORDER BY c.createdAt DESC")
    List<ChatMessage> findAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE ChatMessage c SET c.isRead = true WHERE c.senderId = :senderId AND c.receiverId = :receiverId AND c.isRead = false")
    int markMessagesAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    @Query("SELECT COUNT(c) FROM ChatMessage c WHERE c.receiverId = :receiverId AND c.isRead = false")
    long countUnreadMessages(@Param("receiverId") Long receiverId);
}