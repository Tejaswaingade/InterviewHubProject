import React from 'react'
import { getFriendlyErrorMessage } from '../../utils/errorHandler'

export function ErrorMessage({
  message,
  error,
  onRetry,
  id = 'error-banner',
  style = {}
}) {
  const displayMsg = message
    ? (typeof message === 'object' ? getFriendlyErrorMessage(message) : String(message))
    : error
    ? getFriendlyErrorMessage(error)
    : null

  if (!displayMsg) return null

  const isForbidden =
    displayMsg.includes("don't have permission") ||
    displayMsg.toLowerCase().includes('forbidden') ||
    displayMsg.toLowerCase().includes('access denied')

  const finalMessage = isForbidden
    ? "You don't have permission to perform this action."
    : displayMsg

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid var(--brand-danger, #ef4444)',
        color: 'var(--brand-danger, #ef4444)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        fontSize: '0.925rem',
        fontWeight: 500,
        gap: '1rem',
        flexWrap: 'wrap',
        ...style,
      }}
      id={id}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
        <span style={{ fontSize: '1.15rem' }}>{isForbidden ? '🛡️' : '⚠️'}</span>
        <span id={`${id}-text`}>{finalMessage}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-sm btn-secondary"
          id={`${id}-retry-btn`}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        >
          🔄 Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
