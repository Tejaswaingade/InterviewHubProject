import axios from 'axios'
import { getToken, removeToken, removeUser } from '../utils/storage'
import { getFriendlyErrorMessage } from '../utils/errorHandler'

// Read base URL from environment variable
// The Spring Boot backend exposes endpoints mounted under /api
// We normalize any trailing /v1 to match actual backend routes seamlessly
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
const baseURL = rawBaseUrl.replace(/\/v1\/?$/, '')

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

// Request Interceptor: Automatically send Authorization: Bearer <JWT> if token exists
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Extract data, sanitize errors, handle 401 & 403
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const responseData = error.response?.data

    // Standardize error message using centralized sanitizer
    const friendlyMessage = getFriendlyErrorMessage({
      status,
      response: error.response,
      data: responseData,
      message: error.message,
    })

    // If backend returns 401 Unauthorized (invalid or expired token)
    if (status === 401) {
      removeToken()
      removeUser()

      // Notify application of session invalidation
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth:unauthorized', { detail: { message: friendlyMessage } })
        )

        const path = window.location.pathname
        // Redirect to /login if user is not already on an auth page
        if (path !== '/login' && path !== '/register') {
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
          }, 100)
        }
      }
    }

    const enrichedError = new Error(friendlyMessage)
    enrichedError.status = status
    enrichedError.data = responseData
    enrichedError.errors = responseData?.errors || null
    enrichedError.originalError = error

    return Promise.reject(enrichedError)
  }
)

export default apiClient
