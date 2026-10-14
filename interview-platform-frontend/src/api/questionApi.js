import apiClient from './axios'

export const questionApi = {
  /**
   * Retrieves questions: all questions across platform, or questions for a specific round
   * GET /api/questions  or  GET /api/rounds/{roundId}/questions
   */
  getQuestions: (roundId) => {
    if (roundId) {
      return apiClient.get(`/rounds/${roundId}/questions`)
    }
    return apiClient.get('/questions')
  },

  /**
   * Adds an interview question to a specific round
   * POST /api/rounds/{roundId}/questions
   * Payload: { questionText, questionType, difficulty, topic, answer }
   */
  createQuestion: (roundId, data) => apiClient.post(`/rounds/${roundId}/questions`, data),

  /**
   * Updates an interview question
   * PUT /api/questions/{questionId}
   */
  updateQuestion: (questionId, data) => apiClient.put(`/questions/${questionId}`, data),

  /**
   * Partially updates an interview question
   * PATCH /api/questions/{questionId}
   */
  patchQuestion: (questionId, data) => apiClient.patch(`/questions/${questionId}`, data),

  /**
   * Deletes an interview question
   * DELETE /api/questions/{questionId}
   */
  deleteQuestion: (questionId) => apiClient.delete(`/questions/${questionId}`),
}

export default questionApi
