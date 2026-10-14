import React, { useState, useEffect } from 'react'

export const ROUND_TYPES = [
  { value: 'ONLINE_ASSESSMENT', label: 'Online Assessment' },
  { value: 'CODING', label: 'Coding' },
  { value: 'DSA', label: 'DSA (Data Structures & Algorithms)' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'MANAGERIAL', label: 'Managerial' },
  { value: 'HR', label: 'HR' },
  { value: 'OTHER', label: 'Other' },
]

export function getRoundTypeLabel(type) {
  const found = ROUND_TYPES.find((t) => t.value === type)
  return found ? found.label : type ? String(type).replace('_', ' ') : 'Technical'
}

export function RoundFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues = null,
  isEditing = false,
  defaultNextRoundNumber = 1,
}) {
  const [formData, setFormData] = useState({
    roundNumber: defaultNextRoundNumber,
    roundType: 'TECHNICAL',
    roundName: '',
    description: '',
    difficulty: 'MEDIUM',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset or populate form when modal opens or initialValues change
  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setFormData({
          roundNumber: initialValues.roundNumber || defaultNextRoundNumber,
          roundType: initialValues.roundType || 'TECHNICAL',
          roundName: initialValues.roundName || initialValues.title || '',
          description: initialValues.description || '',
          difficulty: initialValues.difficulty || 'MEDIUM',
        })
      } else {
        setFormData({
          roundNumber: defaultNextRoundNumber,
          roundType: 'ONLINE_ASSESSMENT',
          roundName: '',
          description: '',
          difficulty: 'MEDIUM',
        })
      }
      setFieldErrors({})
      setApiError(null)
    }
  }, [isOpen, initialValues, defaultNextRoundNumber])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (apiError) setApiError(null)
  }

  const validate = () => {
    const errors = {}
    if (!formData.roundNumber || Number(formData.roundNumber) < 1) {
      errors.roundNumber = 'Round number must be at least 1'
    }
    if (!formData.roundType) {
      errors.roundType = 'Please select a round type'
    }
    if (!formData.roundName || !formData.roundName.trim()) {
      errors.roundName = 'Round title is required'
    }
    if (!formData.difficulty) {
      errors.difficulty = 'Please select a difficulty'
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        roundNumber: Number(formData.roundNumber),
        roundType: formData.roundType,
        roundName: formData.roundName.trim(),
        description: formData.description ? formData.description.trim() : '',
        difficulty: formData.difficulty,
      })
      onClose()
    } catch (err) {
      console.error('[RoundFormModal] Submit error:', err)
      setApiError(
        err.data?.message ||
          err.message ||
          'Failed to save round details. Please check inputs and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      id="round-form-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        className="card"
        id="round-form-modal"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '2rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <h3
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
            id="round-modal-title"
          >
            {isEditing ? '✏️ Edit Interview Round' : '➕ Add Interview Round'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            id="btn-close-round-modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.2rem',
            }}
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div
            id="round-modal-api-error"
            style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--brand-danger, #ef4444)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--brand-danger, #ef4444)',
              fontSize: '0.875rem',
            }}
          >
            ⚠️ {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} id="round-form" noValidate>
          {/* Row: Round Number & Round Type */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Round Number */}
            <div id="field-roundNumber">
              <label
                htmlFor="input-round-number"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Round # <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
              </label>
              <input
                id="input-round-number"
                type="number"
                min="1"
                value={formData.roundNumber}
                onChange={(e) => handleChange('roundNumber', e.target.value)}
                disabled={isSubmitting}
                className="form-control"
                style={{
                  width: '100%',
                  borderColor: fieldErrors.roundNumber ? 'var(--brand-danger, #ef4444)' : undefined,
                }}
              />
              {fieldErrors.roundNumber && (
                <span
                  style={{
                    display: 'block',
                    color: 'var(--brand-danger, #ef4444)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {fieldErrors.roundNumber}
                </span>
              )}
            </div>

            {/* Round Type */}
            <div id="field-roundType">
              <label
                htmlFor="input-round-type"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Round Type <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
              </label>
              <select
                id="input-round-type"
                value={formData.roundType}
                onChange={(e) => handleChange('roundType', e.target.value)}
                disabled={isSubmitting}
                className="form-control"
                style={{
                  width: '100%',
                  borderColor: fieldErrors.roundType ? 'var(--brand-danger, #ef4444)' : undefined,
                }}
              >
                {ROUND_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {fieldErrors.roundType && (
                <span
                  style={{
                    display: 'block',
                    color: 'var(--brand-danger, #ef4444)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {fieldErrors.roundType}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div id="field-roundTitle" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="input-round-title"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Round Title <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
            </label>
            <input
              id="input-round-title"
              type="text"
              placeholder="e.g. Data Structures & Algorithms, System Architecture, etc."
              value={formData.roundName}
              onChange={(e) => handleChange('roundName', e.target.value)}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                borderColor: fieldErrors.roundName ? 'var(--brand-danger, #ef4444)' : undefined,
              }}
            />
            {fieldErrors.roundName && (
              <span
                style={{
                  display: 'block',
                  color: 'var(--brand-danger, #ef4444)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                }}
              >
                {fieldErrors.roundName}
              </span>
            )}
          </div>

          {/* Description */}
          <div id="field-roundDescription" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="input-round-description"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Description / Focus Areas
            </label>
            <textarea
              id="input-round-description"
              rows={3}
              placeholder="Overview of questions asked, format, duration, interviewer level, or key preparation tips..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Difficulty */}
          <div id="field-roundDifficulty" style={{ marginBottom: '1.75rem' }}>
            <label
              htmlFor="input-round-difficulty"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Difficulty <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
            </label>
            <select
              id="input-round-difficulty"
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                borderColor: fieldErrors.difficulty ? 'var(--brand-danger, #ef4444)' : undefined,
              }}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            {fieldErrors.difficulty && (
              <span
                style={{
                  display: 'block',
                  color: 'var(--brand-danger, #ef4444)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                }}
              >
                {fieldErrors.difficulty}
              </span>
            )}
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
              id="btn-cancel-round-modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              id="btn-submit-round-modal"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Round' : 'Add Round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoundFormModal
