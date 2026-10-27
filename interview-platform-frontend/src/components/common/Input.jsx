import React, { useState } from 'react'

export function Input({
  label,
  type = 'text',
  name,
  id,
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  required = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || name
  const isPassword = type === 'password'
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

  const handleTogglePassword = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowPassword((prev) => !prev)
  }

  return (
    <div className="form-group" style={{ marginBottom: '1.15rem' }}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        <input
          type={effectiveType}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="form-control"
          style={{
            width: '100%',
            ...(error ? { borderColor: 'var(--color-danger)' } : {}),
            ...(isPassword ? { paddingRight: '2.75rem' } : {}),
            ...(props.style || {}),
          }}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            id={`${inputId}-toggle-visibility`}
            onClick={handleTogglePassword}
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '0.45rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              color: showPassword ? 'var(--brand-primary, #3b82f6)' : 'var(--text-muted, #94a3b8)',
              transition: 'color 0.15s ease, transform 0.15s ease',
              lineHeight: 1,
            }}
          >
            {showPassword ? (
              // Eye with slash: click to hide password
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              // Open Eye: click to show password
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error ? (
        <span className="form-error" style={{ display: 'block', marginTop: '0.25rem' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{helperText}</span>
      ) : null}
    </div>
  )
}

export default Input
