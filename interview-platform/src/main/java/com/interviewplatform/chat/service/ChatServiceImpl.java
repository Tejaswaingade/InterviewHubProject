package com.interviewplatform.chat.service;

import com.interviewplatform.chat.dto.*;
import com.interviewplatform.chat.entity.ChatMessage;
import com.interviewplatform.chat.repository.ChatMessageRepository;
import com.interviewplatform.common.exception.ResourceNotFoundException;
import com.interviewplatform.experience.repository.InterviewExperienceRepository;
import com.interviewplatform.user.entity.User;
import com.interviewplatform.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final InterviewExperienceRepository interviewExperienceRepository;

    public ChatServiceImpl(ChatMessageRepository chatMessageRepository,
                           UserRepository userRepository,
                           InterviewExperienceRepository interviewExperienceRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.interviewExperienceRepository = interviewExperienceRepository;
    }

    @Override
    public ChatMessageDto sendMessage(SendMessageRequest request, String currentUserEmail) {
        User sender = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found with email: " + currentUserEmail));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found with id: " + request.getReceiverId()));

        ChatMessage message = ChatMessage.builder()
                .senderId(sender.getId())
                .senderName(sender.getName())
                .senderEmail(sender.getEmail())
                .receiverId(receiver.getId())
                .receiverName(receiver.getName())
                .receiverEmail(receiver.getEmail())
                .content(request.getContent().trim())
                .isRead(false)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        return toDto(saved);
    }

    @Override
    public List<ChatMessageDto> getConversationHistory(Long otherUserId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + currentUserEmail));

        // Mark incoming messages from other user as read
        chatMessageRepository.markMessagesAsRead(otherUserId, currentUser.getId());

        List<ChatMessage> messages = chatMessageRepository.findConversationBetween(currentUser.getId(), otherUserId);
        return messages.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationSummaryDto> getConversations(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + currentUserEmail));

        List<ChatMessage> allMessages = chatMessageRepository.findAllByUserId(currentUser.getId());

        // Group by other user ID
        Map<Long, List<ChatMessage>> byContact = new LinkedHashMap<>();
        for (ChatMessage msg : allMessages) {
            Long contactId = msg.getSenderId().equals(currentUser.getId()) ? msg.getReceiverId() : msg.getSenderId();
            byContact.computeIfAbsent(contactId, k -> new ArrayList<>()).add(msg);
        }

        List<ConversationSummaryDto> summaries = new ArrayList<>();
        for (Map.Entry<Long, List<ChatMessage>> entry : byContact.entrySet()) {
            Long contactId = entry.getKey();
            List<ChatMessage> thread = entry.getValue();
            if (thread.isEmpty()) continue;

            ChatMessage latest = thread.get(0);
            String contactName = latest.getSenderId().equals(currentUser.getId()) ? latest.getReceiverName() : latest.getSenderName();
            String contactEmail = latest.getSenderId().equals(currentUser.getId()) ? latest.getReceiverEmail() : latest.getSenderEmail();

            long unreadCount = thread.stream()
                    .filter(m -> m.getReceiverId().equals(currentUser.getId()) && !Boolean.TRUE.equals(m.getIsRead()))
                    .count();

            summaries.add(ConversationSummaryDto.builder()
                    .contactId(contactId)
                    .contactName(contactName)
                    .contactEmail(contactEmail)
                    .lastMessage(latest.getContent())
                    .lastMessageTime(latest.getCreatedAt() != null ? latest.getCreatedAt() : LocalDateTime.now())
                    .unreadCount(unreadCount)
                    .build());
        }

        return summaries;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatUserDto> getAvailableUsers(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + currentUserEmail));

        List<Long> authorIds = interviewExperienceRepository.findDistinctAuthorUserIds();
        if (authorIds == null) {
            authorIds = Collections.emptyList();
        }
        Set<Long> authorIdSet = new HashSet<>(authorIds);

        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(currentUser.getId()) && (u.getEmail() == null || !u.getEmail().equalsIgnoreCase(currentUserEmail)))
                .sorted((u1, u2) -> {
                    boolean u1Author = authorIdSet.contains(u1.getId());
                    boolean u2Author = authorIdSet.contains(u2.getId());
                    if (u1Author != u2Author) {
                        return u1Author ? -1 : 1;
                    }
                    return Long.compare(u2.getId(), u1.getId());
                })
                .map(u -> ChatUserDto.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(authorIdSet.contains(u.getId()) ? "EXPERIENCE_CONTRIBUTOR" : (u.getRole() != null ? u.getRole().name() : "USER"))
                        .hasSharedExperience(authorIdSet.contains(u.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Long otherUserId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + currentUserEmail));
        chatMessageRepository.markMessagesAsRead(otherUserId, currentUser.getId());
    }

    private ChatMessageDto toDto(ChatMessage m) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .senderEmail(m.getSenderEmail())
                .receiverId(m.getReceiverId())
                .receiverName(m.getReceiverName())
                .receiverEmail(m.getReceiverEmail())
                .content(m.getContent())
                .isRead(m.getIsRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
