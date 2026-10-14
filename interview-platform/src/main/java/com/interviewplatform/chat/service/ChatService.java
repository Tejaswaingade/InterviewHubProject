package com.interviewplatform.chat.service;

import com.interviewplatform.chat.dto.ChatMessageDto;
import com.interviewplatform.chat.dto.ChatUserDto;
import com.interviewplatform.chat.dto.ConversationSummaryDto;
import com.interviewplatform.chat.dto.SendMessageRequest;

import java.util.List;

public interface ChatService {
    ChatMessageDto sendMessage(SendMessageRequest request, String currentUserEmail);
    List<ChatMessageDto> getConversationHistory(Long otherUserId, String currentUserEmail);
    List<ConversationSummaryDto> getConversations(String currentUserEmail);
    List<ChatUserDto> getAvailableUsers(String currentUserEmail);
    void markAsRead(Long otherUserId, String currentUserEmail);
}