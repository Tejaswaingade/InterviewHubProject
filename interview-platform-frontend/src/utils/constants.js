export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  EXPERIENCES: '/experiences',
  EXPERIENCE_DETAILS: '/experiences/:id',
  CREATE_EXPERIENCE: '/create-experience',
  EDIT_EXPERIENCE: '/experiences/:id/edit',
  DASHBOARD: '/dashboard',
  COMPANIES: '/companies',
  COMPANY_DETAILS: '/companies/:id',
  PROFILE: '/profile',
  ADMIN: '/admin',
}

export const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD']
export const RESULT_STATUSES = ['SELECTED', 'REJECTED', 'WAITING', 'WITHDRAWN', 'UNKNOWN']
export const QUESTION_TYPES = ['DSA', 'JAVA', 'SPRING_BOOT', 'DATABASE', 'SYSTEM_DESIGN', 'HR', 'BEHAVIORAL', 'OTHER']

export default {
  API_BASE_URL,
  ROUTES,
  DIFFICULTY_LEVELS,
  RESULT_STATUSES,
  QUESTION_TYPES,
}
