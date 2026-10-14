import apiClient from './axios'

export const chatApi = {
  /**
   * Sends a live chat message to another user / author
   * POST /api/chat/messages
   */
  sendMessage: (receiverId, content) =>
    apiClient.post('/chat/messages', { receiverId, content }),

  /**
   * Retrieves conversation message history between current user and contact
   * GET /api/chat/messages/{otherUserId}
   */
  getConversationHistory: (otherUserId) =>
    apiClient.get(`/chat/messages/${otherUserId}`),

  /**
   * Retrieves active conversation threads with unread counts
   * GET /api/chat/conversations
   */
  getConversations: () =>
    apiClient.get('/chat/conversations'),

  /**
   * Retrieves registered users/authors available to start a chat with
   * GET /api/chat/users
   */
  getAvailableUsers: () =>
    apiClient.get('/chat/users'),

  /**
   * Marks unread messages from contact as read
   * PUT /api/chat/read/{otherUserId}
   */
  markAsRead: (otherUserId) =>
    apiClient.put(`/chat/read/${otherUserId}`),
}

export default chatApi
