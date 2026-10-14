import apiClient from './axios'

export const authApi = {
  /**
   * Registers a new user account
   * POST /api/auth/register
   * Payload: { name, email, password }
   */
  register: (userData) => apiClient.post('/auth/register', userData),

  /**
   * Authenticates user credentials
   * POST /api/auth/login
   * Payload: { email, password }
   */
  login: (credentials) => apiClient.post('/auth/login', credentials),

  /**
   * Requests a 6-digit password reset code sent to the email
   * POST /api/auth/forgot-password
   * Payload: { email }
   */
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),

  /**
   * Submits reset code and new password
   * POST /api/auth/reset-password
   * Payload: { email, resetToken, newPassword }
   */
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload),

  /**
   * Retrieves profile details for currently authenticated user
   * GET /api/users/me
   */
  getCurrentUser: () => apiClient.get('/users/me'),
}

export default authApi