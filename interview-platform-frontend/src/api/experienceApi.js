import apiClient from './axios'

export const experienceApi = {
  /**
   * Retrieves paginated list of interview experiences with optional filtering
   * GET /api/experiences?page=0&size=10&companyId=&difficulty=&jobRole=
   */
  getExperiences: (params = {}) => apiClient.get('/experiences', { params }),

  /**
   * Retrieves all interview experiences as an unpaginated list
   * GET /api/experiences/all
   */
  getAllExperiencesList: () => apiClient.get('/experiences/all'),

  /**
   * Retrieves single interview experience by ID
   * GET /api/experiences/{id}
   */
  getExperienceById: (id) => apiClient.get(`/experiences/${id}`),

  /**
   * Retrieves interview experiences submitted by current user
   * GET /api/experiences/my?page=0&size=10
   */
  getMyExperiences: (params = {}) => apiClient.get('/experiences/my', { params }),

  /**
   * Searches interview experiences by keyword
   * GET /api/experiences/search?keyword=...&page=0&size=10
   */
  searchExperiences: (keyword, params = {}) =>
    apiClient.get('/experiences/search', { params: { keyword, ...params } }),

  /**
   * Creates a new interview experience
   * POST /api/experiences
   */
  createExperience: (data) => apiClient.post('/experiences', data),

  /**
   * Updates an existing interview experience
   * PUT /api/experiences/{id}
   */
  updateExperience: (id, data) => apiClient.put(`/experiences/${id}`, data),

  /**
   * Partially updates an interview experience
   * PATCH /api/experiences/{id}
   */
  patchExperience: (id, data) => apiClient.patch(`/experiences/${id}`, data),

  /**
   * Deletes an interview experience by ID
   * DELETE /api/experiences/{id}
   */
  deleteExperience: (id) => apiClient.delete(`/experiences/${id}`),
}

export default experienceApi
