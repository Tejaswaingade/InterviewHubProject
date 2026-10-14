import React from 'react'

export function Loading({
  message = 'Loading contents...',
  fullPage = false,
  size = 'md',
  id = 'loading-spinner'
}) {
  const spinnerSize = size === 'sm' ? '24px' : size === 'lg' ? '48px' : '36px'
  const borderWidth = size === 'sm' ? '2px' : '3px'

  const containerStyle = fullPage
    ? {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-card, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '2rem',
        gap: '1rem',
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 1.5rem',
        gap: '1rem',
      }

  return (
    <div style={containerStyle} id={id}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: `${borderWidth} solid var(--border-medium, #e2e8f0)`,
          borderTopColor: 'var(--brand-primary, #6366f1)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
        id={`${id}-circle`}
      />
      {message && (
        <p
          style={{
            color: 'var(--text-secondary, #64748b)',
            fontSize: '0.925rem',
            fontWeight: 500,
            margin: 0,
          }}
          id={`${id}-text`}
        >
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Loading
