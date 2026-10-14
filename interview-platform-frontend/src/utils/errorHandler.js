/**
 * Centralized Error Sanitizer and Formatter
 * Sanitizes internal stack traces and handles standard status codes,
 * while preserving specific application error messages for the user.
 */

export function getFriendlyErrorMessage(error, defaultMessage = 'An unexpected error occurred. Please try again.') {
  if (!error) return defaultMessage

  // 1. Extract potential raw message string
  let rawMsg = ''
  if (typeof error === 'string') {
    rawMsg = error
  } else if (error.response?.data?.message && typeof error.response.data.message === 'string') {
    rawMsg = error.response.data.message
  } else if (error.data?.message && typeof error.data.message === 'string') {
    rawMsg = error.data.message
  } else if (error.message && typeof error.message === 'string') {
    rawMsg = error.message
  }

  const status = error.status || error.response?.status

  if (rawMsg) {
    const trimmed = rawMsg.trim()

    // Detect 403 forbidden / AccessDenied keywords
    if (
      status === 403 ||
      trimmed.toLowerCase().includes('forbidden') ||
      trimmed.toLowerCase().includes('access is denied') ||
      trimmed.toLowerCase().includes('accessdenied')
    ) {
      return "You don't have permission to perform this action."
    }

    // Detect generic 401 unauthorized keywords
    if (
      trimmed.toLowerCase() === 'unauthorized' ||
      trimmed.toLowerCase().includes('unauthorized: full authentication') ||
      trimmed.toLowerCase().includes('full authentication is required')
    ) {
      return 'Your session has expired or you are not authorized. Please log in again.'
    }

    // Filter out stack traces or internal backend implementation details
    const looksLikeStackTraceOrInternal =
      trimmed.includes('org.springframework') ||
      trimmed.includes('com.interviewplatform') ||
      trimmed.includes('HibernateException') ||
      trimmed.includes('SQLException') ||
      trimmed.includes('could not execute statement') ||
      trimmed.includes('Cannot invoke') ||
      trimmed.includes('at line ')

    if (looksLikeStackTraceOrInternal) {
      return 'The operation could not be completed. Please check your inputs and try again.'
    }

    // Return specific business error message (e.g. "No account registered with email...", "Invalid code")
    return trimmed
  }

  // 2. HTTP Status fallbacks when no message is provided
  if (status === 401) {
    return 'Your session has expired or you are not authorized. Please log in again.'
  }

  if (status === 403) {
    return "You don't have permission to perform this action."
  }

  if (status === 404) {
    return 'The requested resource could not be found.'
  }

  if (status >= 500) {
    return 'A temporary server error occurred. Please try again in a few moments.'
  }

  return defaultMessage
}

export default getFriendlyErrorMessage