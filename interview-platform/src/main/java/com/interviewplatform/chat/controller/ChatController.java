package com.interviewplatform.chat.controller;

import com.interviewplatform.chat.dto.ChatMessageDto;
import com.interviewplatform.chat.dto.ChatUserDto;
import com.interviewplatform.chat.dto.ConversationSummaryDto;
import com.interviewplatform.chat.dto.SendMessageRequest;
import com.interviewplatform.chat.service.ChatService;
import com.interviewplatform.common.response.ApiResponse;
import com.interviewplatform.config.OpenApiConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/chat", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Live Chat APIs", description = "Endpoints for real-time candidate and peer messaging with persistent history")
@SecurityRequirement(name = OpenApiConfig.SECURITY_SCHEME_NAME)
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/messages")
    @Operation(summary = "Send a chat message", description = "Sends a real-time message to another candidate or author and saves it in database")
    public ResponseEntity<ApiResponse<ChatMessageDto>> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();
        ChatMessageDto result = chatService.sendMessage(request, currentUserEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", result));
    }

    @GetMapping("/messages/{otherUserId}")
    @Operation(summary = "Get conversation history", description = "Retrieves chronological message history between current user and specified user")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getConversationHistory(
            @PathVariable Long otherUserId,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();
        List<ChatMessageDto> history = chatService.getConversationHistory(otherUserId, currentUserEmail);
        return ResponseEntity.ok(ApiResponse.success("Chat history retrieved successfully", history));
    }

    @GetMapping("/conversations")
    @Operation(summary = "Get active conversations", description = "Retrieves recent conversation threads with unread counts and latest messages")
    public ResponseEntity<ApiResponse<List<ConversationSummaryDto>>> getConversations(
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();
        List<ConversationSummaryDto> list = chatService.getConversations(currentUserEmail);
        return ResponseEntity.ok(ApiResponse.success("Conversations retrieved successfully", list));
    }

    @GetMapping("/users")
    @Operation(summary = "Get available users to chat with", description = "Lists platform candidates, interview authors, and peers available for live discussion")
    public ResponseEntity<ApiResponse<List<ChatUserDto>>> getAvailableUsers(
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();
        List<ChatUserDto> users = chatService.getAvailableUsers(currentUserEmail);
        return ResponseEntity.ok(ApiResponse.success("Available chat contacts retrieved successfully", users));
    }

    @PutMapping("/read/{otherUserId}")
    @Operation(summary = "Mark messages as read", description = "Marks all unread messages from a contact as read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long otherUserId,
            Authentication authentication
    ) {
        String currentUserEmail = authentication.getName();
        chatService.markAsRead(otherUserId, currentUserEmail);
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read"));
    }
}