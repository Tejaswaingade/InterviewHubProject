import React, { useState, useEffect } from 'react'

export const QUESTION_TYPES = [
  { value: 'DSA', label: 'DSA' },
  { value: 'JAVA', label: 'Java' },
  { value: 'SPRING_BOOT', label: 'Spring Boot' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'HR', label: 'HR' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'OTHER', label: 'Other' },
]

export function getQuestionTypeLabel(type) {
  const found = QUESTION_TYPES.find((t) => t.value === type)
  if (found) return found.label
  if (!type) return 'Other'
  return String(type).replace('_', ' ')
}

export function QuestionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues = null,
  isEditing = false,
  roundTitle = 'this round',
}) {
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'DSA',
    difficulty: 'MEDIUM',
    topic: '',
    answer: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Populate or reset form whenever modal opens or initialValues changes
  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setFormData({
          questionText: initialValues.questionText || initialValues.title || '',
          questionType: initialValues.questionType || 'DSA',
          difficulty: initialValues.difficulty || 'MEDIUM',
          topic: initialValues.topic || '',
          answer: initialValues.answer || '',
        })
      } else {
        setFormData({
          questionText: '',
          questionType: 'DSA',
          difficulty: 'MEDIUM',
          topic: '',
          answer: '',
        })
      }
      setFieldErrors({})
      setApiError(null)
    }
  }, [isOpen, initialValues])

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
    if (!formData.questionText || !formData.questionText.trim()) {
      errors.questionText = 'Question prompt text is required'
    }
    if (!formData.questionType) {
      errors.questionType = 'Please select a question type'
    }
    if (!formData.difficulty) {
      errors.difficulty = 'Please select a difficulty rating'
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
        questionText: formData.questionText.trim(),
        questionType: formData.questionType,
        difficulty: formData.difficulty,
        topic: formData.topic ? formData.topic.trim() : '',
        answer: formData.answer ? formData.answer.trim() : '',
      })
      onClose()
    } catch (err) {
      console.error('[QuestionFormModal] Submit error:', err)
      setApiError(
        err.data?.message ||
          err.message ||
          'Failed to save question. Please check inputs and try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      id="question-form-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        className="card"
        id="question-form-modal"
        style={{
          maxWidth: '580px',
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
        {/* Header */}
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
          <div>
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
              }}
              id="question-modal-title"
            >
              {isEditing ? '✏️ Edit Interview Question' : '➕ Add Question to Round'}
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0 0',
              }}
            >
              {isEditing ? 'Update the details for this question' : `Adding to ${roundTitle}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            id="btn-close-question-modal"
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

        {/* API Error alert */}
        {apiError && (
          <div
            id="question-modal-api-error"
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

        {/* Question Form */}
        <form onSubmit={handleSubmit} id="question-form" noValidate>
          {/* Question Text */}
          <div id="field-questionText" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="input-question-text"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Question Text <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
            </label>
            <textarea
              id="input-question-text"
              rows={3}
              placeholder="e.g. How does HashMap resolve collisions? Implement LRU cache..."
              value={formData.questionText}
              onChange={(e) => handleChange('questionText', e.target.value)}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                borderColor: fieldErrors.questionText ? 'var(--brand-danger, #ef4444)' : undefined,
              }}
            />
            {fieldErrors.questionText && (
              <span
                style={{
                  display: 'block',
                  color: 'var(--brand-danger, #ef4444)',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                }}
              >
                {fieldErrors.questionText}
              </span>
            )}
          </div>

          {/* Row: Question Type & Difficulty */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Question Type */}
            <div id="field-questionType">
              <label
                htmlFor="input-question-type"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Question Type <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
              </label>
              <select
                id="input-question-type"
                value={formData.questionType}
                onChange={(e) => handleChange('questionType', e.target.value)}
                disabled={isSubmitting}
                className="form-control"
                style={{
                  width: '100%',
                  borderColor: fieldErrors.questionType ? 'var(--brand-danger, #ef4444)' : undefined,
                }}
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {fieldErrors.questionType && (
                <span
                  style={{
                    display: 'block',
                    color: 'var(--brand-danger, #ef4444)',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  {fieldErrors.questionType}
                </span>
              )}
            </div>

            {/* Difficulty */}
            <div id="field-difficulty">
              <label
                htmlFor="input-question-difficulty"
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
                id="input-question-difficulty"
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
          </div>

          {/* Topic */}
          <div id="field-topic" style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="input-question-topic"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Topic / Tag
            </label>
            <input
              id="input-question-topic"
              type="text"
              placeholder="e.g. Binary Trees, Concurrency, Sharding, Behavioral..."
              value={formData.topic}
              onChange={(e) => handleChange('topic', e.target.value)}
              disabled={isSubmitting}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          {/* Answer / Solution */}
          <div id="field-answer" style={{ marginBottom: '1.75rem' }}>
            <label
              htmlFor="input-question-answer"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Answer / Solution Approach
            </label>
            <textarea
              id="input-question-answer"
              rows={4}
              placeholder="Key points explained, code approach, algorithms used, or ideal answer guidelines..."
              value={formData.answer}
              onChange={(e) => handleChange('answer', e.target.value)}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
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
              id="btn-cancel-question-modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              id="btn-submit-question-modal"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuestionFormModal
