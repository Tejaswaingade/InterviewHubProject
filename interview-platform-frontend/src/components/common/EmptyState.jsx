import React from 'react'

export function EmptyState({
  icon = '📭',
  title = 'No records found',
  description = 'There is no data matching your current selection.',
  action = null,
  id = 'empty-state',
  style = {}
}) {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        padding: '3.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '1.5rem 0',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
      id={id}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1 }} id={`${id}-icon`}>
        {icon}
      </div>
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: 'var(--text-primary)',
        }}
        id={`${id}-title`}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            color: 'var(--text-secondary)',
            maxWidth: '460px',
            marginBottom: action ? '1.5rem' : 0,
            fontSize: '0.95rem',
            lineHeight: 1.5,
          }}
          id={`${id}-description`}
        >
          {description}
        </p>
      )}
      {action && <div id={`${id}-action`}>{action}</div>}
    </div>
  )
}

export default EmptyState
