import apiClient from './axios'

export const userApi = {
  /**
   * Retrieves all registered users (Requires authentication)
   * GET /api/users
   */
  getAllUsers: () => apiClient.get('/users'),

  /**
   * Retrieves single user profile by ID
   * GET /api/users/{id}
   */
  getUserById: (id) => apiClient.get(`/users/${id}`),

  /**
   * Updates user profile
   * PUT /api/users/{id}
   */
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),

  /**
   * Partially updates user profile
   * PATCH /api/users/{id}
   */
  patchUser: (id, data) => apiClient.patch(`/users/${id}`, data),

  /**
   * Updates candidate profile photo in database
   * PUT /api/users/{id}/photo
   */
  updateProfilePhoto: (id, profilePhoto) => apiClient.put(`/users/${id}/photo`, { profilePhoto }),

  /**
   * Permanently deletes a user account (Admin role required)
   * DELETE /api/users/{id}
   */
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
}

export default userApi
