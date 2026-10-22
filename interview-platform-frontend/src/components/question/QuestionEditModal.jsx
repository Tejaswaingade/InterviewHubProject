import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import questionApi from '../../api/questionApi'

const QUESTION_TYPES = [
  { value: 'DSA', label: 'Data Structures & Algorithms (DSA)' },
  { value: 'JAVA', label: 'Core Java' },
  { value: 'SPRING_BOOT', label: 'Spring Boot' },
  { value: 'DATABASE', label: 'Database / SQL' },
  { value: 'SYSTEM_DESIGN', label: 'System Design' },
  { value: 'HR', label: 'HR / Culture Fit' },
  { value: 'BEHAVIORAL', label: 'Behavioral' },
  { value: 'OTHER', label: 'Other' },
]

export function QuestionEditModal({ isOpen, onClose, question = null, onSuccess }) {
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

  useEffect(() => {
    if (question && isOpen) {
      document.body.style.overflow = 'hidden'
      setFormData({
        questionText: question.questionText || '',
        questionType: question.questionType || 'DSA',
        difficulty: question.difficulty || 'MEDIUM',
        topic: question.topic || '',
        answer: question.answer || '',
      })
      setFieldErrors({})
      setApiError(null)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [question, isOpen])

  if (!isOpen || !question) return null

  const validate = () => {
    const errors = {}
    if (!formData.questionText || !formData.questionText.trim()) {
      errors.questionText = 'Question prompt is required'
    }
    if (!formData.questionType) {
      errors.questionType = 'Please select a question type'
    }
    if (!formData.difficulty) {
      errors.difficulty = 'Please select a difficulty level'
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
      const payload = {
        questionText: formData.questionText.trim(),
        questionType: formData.questionType,
        difficulty: formData.difficulty,
        topic: formData.topic.trim() || null,
        answer: formData.answer.trim() || null,
      }

      const res = await questionApi.updateQuestion(question.id, payload)
      if (onSuccess) {
        onSuccess(res.data || res)
      }
      onClose()
    } catch (err) {
      console.error('[QuestionEditModal] Update failed:', err)
      setApiError(err.data?.message || err.message || 'Failed to update interview question.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const modalNode = (
    <div
      id="question-edit-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 10, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.5rem',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target.id === 'question-edit-modal-overlay' && !isSubmitting) onClose()
      }}
    >
      <div
        className="card"
        id="question-edit-modal"
        style={{
          maxWidth: '600px',
          width: '100%',
          padding: '2rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          overflowY: 'auto',
          margin: 'auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h3
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
            id="question-edit-modal-title"
          >
            Edit Question #{question.id}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem',
            }}
            id="btn-close-question-edit-modal"
          >
            ✕
          </button>
        </div>

        {apiError && (
          <div
            id="question-edit-api-error"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--brand-danger, #ef4444)',
              color: 'var(--brand-danger, #ef4444)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}
          >
            ⚠️ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} id="question-edit-form">
          {/* Question Text */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label
              htmlFor="input-edit-q-text"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Question Prompt / Description <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
            </label>
            <textarea
              id="input-edit-q-text"
              rows={3}
              value={formData.questionText}
              onChange={(e) => {
                setFormData({ ...formData, questionText: e.target.value })
                if (fieldErrors.questionText) setFieldErrors({ ...fieldErrors, questionText: null })
              }}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                fontFamily: 'inherit',
                borderColor: fieldErrors.questionText ? 'var(--brand-danger, #ef4444)' : undefined,
              }}
            />
            {fieldErrors.questionText && (
              <span style={{ color: 'var(--brand-danger, #ef4444)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                {fieldErrors.questionText}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '1.2rem',
            }}
          >
            {/* Question Type */}
            <div>
              <label
                htmlFor="select-edit-q-type"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Question Type <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
              </label>
              <select
                id="select-edit-q-type"
                value={formData.questionType}
                onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                disabled={isSubmitting}
                className="form-control"
                style={{ width: '100%' }}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label
                htmlFor="select-edit-q-diff"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Difficulty <span style={{ color: 'var(--brand-danger, #ef4444)' }}>*</span>
              </label>
              <select
                id="select-edit-q-diff"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                disabled={isSubmitting}
                className="form-control"
                style={{ width: '100%' }}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Topic */}
            <div>
              <label
                htmlFor="input-edit-q-topic"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                Topic / Category
              </label>
              <input
                id="input-edit-q-topic"
                type="text"
                placeholder="e.g. Dynamic Programming"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                disabled={isSubmitting}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Answer */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="input-edit-q-answer"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.35rem',
              }}
            >
              Candidate's Solution / Tips
            </label>
            <textarea
              id="input-edit-q-answer"
              rows={4}
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              disabled={isSubmitting}
              className="form-control"
              style={{ width: '100%', fontFamily: 'inherit' }}
            />
          </div>

          {/* Action buttons */}
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
              id="btn-cancel-edit-q"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              id="btn-submit-edit-q"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body)
  }
  return modalNode
}

export default QuestionEditModal
