import apiClient from './axios'

export const bookmarkApi = {
  /**
   * Retrieves paginated list of bookmarks for the current user
   * GET /api/bookmarks?page=0&size=10&status=PLANNING
   */
  getBookmarks: (params = {}) => apiClient.get('/bookmarks', { params }),

  /**
   * Retrieves array of experience IDs bookmarked by the current user
   * GET /api/bookmarks/ids
   */
  getBookmarkedIds: () => apiClient.get('/bookmarks/ids'),

  /**
   * Toggles bookmark state for an experience
   * POST /api/bookmarks/{experienceId}/toggle
   */
  toggleBookmark: (experienceId, data = {}) =>
    apiClient.post(`/bookmarks/${experienceId}/toggle`, data),

  /**
   * Updates status or notes of an existing bookmark
   * PUT /api/bookmarks/{bookmarkId}
   */
  updateBookmark: (bookmarkId, data) =>
    apiClient.put(`/bookmarks/${bookmarkId}`, data),

  /**
   * Quick-update bookmark status (e.g., PLANNING -> MASTERED)
   * PATCH /api/bookmarks/{bookmarkId}/status?status=...
   */
  updateBookmarkStatus: (bookmarkId, status) =>
    apiClient.patch(`/bookmarks/${bookmarkId}/status`, null, { params: { status } }),

  /**
   * Removes a bookmark by ID
   * DELETE /api/bookmarks/{bookmarkId}
   */
  removeBookmark: (bookmarkId) => apiClient.delete(`/bookmarks/${bookmarkId}`),
}

export default bookmarkApi
