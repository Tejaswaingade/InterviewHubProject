import apiClient from './axios'

export const roundApi = {
  /**
   * Retrieves all interview rounds across platform, or rounds for a specific experience
   * GET /api/rounds  or  GET /api/experiences/{experienceId}/rounds
   */
  getRounds: (experienceId) => {
    if (experienceId) {
      return apiClient.get(`/experiences/${experienceId}/rounds`)
    }
    return apiClient.get('/rounds')
  },

  /**
   * Retrieves a round by ID
   * GET /api/rounds/{roundId}
   */
  getRoundById: (roundId) => apiClient.get(`/rounds/${roundId}`),

  /**
   * Adds a new interview round to an experience
   * POST /api/experiences/{experienceId}/rounds
   * Payload: { roundName, roundNumber }
   */
  createRound: (experienceId, data) => apiClient.post(`/experiences/${experienceId}/rounds`, data),

  /**
   * Updates an existing interview round
   * PUT /api/rounds/{roundId}
   */
  updateRound: (roundId, data) => apiClient.put(`/rounds/${roundId}`, data),

  /**
   * Partially updates an interview round
   * PATCH /api/rounds/{roundId}
   */
  patchRound: (roundId, data) => apiClient.patch(`/rounds/${roundId}`, data),

  /**
   * Deletes an interview round
   * DELETE /api/rounds/{roundId}
   */
  deleteRound: (roundId) => apiClient.delete(`/rounds/${roundId}`),
}

export default roundApi
