import apiClient from './axios'

export const companyApi = {
  /**
   * Retrieves companies list with optional search query
   * GET /api/companies?search=...
   */
  getCompanies: (params = {}) => apiClient.get('/companies', { params }),

  /**
   * Searches companies by keyword
   * GET /api/companies/search?search=...
   */
  searchCompanies: (search) => apiClient.get('/companies/search', { params: { search } }),

  /**
   * Retrieves company details by ID
   * GET /api/companies/{id}
   */
  getCompanyById: (id) => apiClient.get(`/companies/${id}`),

  /**
   * Creates a new company (Admin role required)
   * POST /api/companies
   */
  createCompany: (data) => apiClient.post('/companies', data),

  /**
   * Updates company details (Admin role required)
   * PUT /api/companies/{id}
   */
  updateCompany: (id, data) => apiClient.put(`/companies/${id}`, data),

  /**
   * Partially updates company details (Admin role required)
   * PATCH /api/companies/{id}
   */
  patchCompany: (id, data) => apiClient.patch(`/companies/${id}`, data),

  /**
   * Deletes a company by ID (Admin role required)
   * DELETE /api/companies/{id}
   */
  deleteCompany: (id) => apiClient.delete(`/companies/${id}`),
}

export default companyApi
