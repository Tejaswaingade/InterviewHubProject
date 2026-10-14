import React from 'react'

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
  const inputId = id || name

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="form-control"
        style={error ? { borderColor: 'var(--color-danger)' } : {}}
        {...props}
      />
      {error ? (
        <span className="form-error">{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{helperText}</span>
      ) : null}
    </div>
  )
}

export default Input
