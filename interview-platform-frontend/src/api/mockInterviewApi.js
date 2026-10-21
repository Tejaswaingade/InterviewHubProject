import apiClient from './axios'

export const mockInterviewApi = {
  /**
   * Generates tailored interview questions based on candidate role, domain, difficulty, and experience
   * POST /api/ai/mock-interview/generate
   */
  generateQuestions: (data) => apiClient.post('/ai/mock-interview/generate', data),

  /**
   * Evaluates a candidate's answer with instant rubric scoring
   * POST /api/ai/mock-interview/evaluate
   */
  evaluateAnswer: (data) => apiClient.post('/ai/mock-interview/evaluate', data),

  /**
   * Retrieves list of supported tech roles for interview prep
   * GET /api/ai/mock-interview/roles
   */
  getSupportedRoles: () => apiClient.get('/ai/mock-interview/roles'),
}

export default mockInterviewApi
