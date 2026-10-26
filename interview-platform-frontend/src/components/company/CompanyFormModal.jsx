import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import companyApi from '../../api/companyApi'
import { resolveCompanyLogoOnline } from '../../utils/companyBrands'

export function CompanyFormModal({ isOpen, onClose, company = null, onSuccess }) {
  const isEditing = Boolean(company && company.id)

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      if (company && isEditing) {
        setFormData({
          name: company.name || '',
          website: company.website || '',
          description: company.description || '',
        })
      } else {
        setFormData({
          name: '',
          website: '',
          description: '',
        })
      }
      setFieldErrors({})
      setApiError(null)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [company, isEditing, isOpen])

  if (!isOpen) return null

  // Auto-resolve logo based on company name and website
  const detectedLogo = resolveCompanyLogoOnline(formData.name, formData.website)

  const validate = () => {
    const errors = {}
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Company name is required'
    }

    if (formData.website && formData.website.trim()) {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+(:[0-9]+)?(\/.*)?$/
      if (!urlPattern.test(formData.website.trim())) {
        errors.website = 'Please enter a valid website URL'
      }
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
        name: formData.name.trim(),
        logo: detectedLogo || null,
        website: formData.website.trim() || null,
        description: formData.description.trim() || null,
      }

      let res
      if (isEditing) {
        res = await companyApi.updateCompany(company.id, payload)
      } else {
        res = await companyApi.createCompany(payload)
      }

      if (onSuccess) {
        onSuccess(res.data || res)
      }
      onClose()
    } catch (err) {
      console.error('[CompanyFormModal] Save failed:', err)
      const msg =
        err.data?.message ||
        err.message ||
        (err.status === 409 || (err.message && err.message.includes('already exists'))
          ? 'A company with this name already exists in the directory.'
          : 'Failed to save company profile. Please try again.')
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalNode = (
    <div
      className="modal-overlay"
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
        if (e.target.id === 'company-form-modal-overlay' && !isSubmitting) onClose()
      }}
      id="company-form-modal-overlay"
    >
      <div
        className="modal-content-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '2rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg, 16px)',
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
          <div>
            <h3
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
              id="company-modal-title"
            >
              {isEditing ? `Edit Company: ${company.name}` : 'Create New Company Profile'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Add a target tech employer to the interview platform directory
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'var(--transition-fast)',
            }}
            id="btn-close-company-modal"
            aria-label="Close modal"
          >
            âœ•
          </button>
        </div>

        {apiError && (
          <div
            id="company-modal-api-error"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              color: 'var(--color-danger)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>âš ï¸</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} id="company-form">
          {/* Field 1: Name */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="input-modal-company-name"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Company Name <span style={{ color: 'var(--color-danger, #ef4444)' }}>*</span>
            </label>
            <input
              id="input-modal-company-name"
              type="text"
              placeholder="Company name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null })
              }}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                borderColor: fieldErrors.name ? 'var(--color-danger, #ef4444)' : undefined,
              }}
              autoFocus
            />
            {fieldErrors.name && (
              <span
                id="error-modal-company-name"
                style={{
                  display: 'block',
                  color: 'var(--color-danger, #ef4444)',
                  fontSize: '0.8rem',
                  marginTop: '0.3rem',
                }}
              >
                {fieldErrors.name}
              </span>
            )}
          </div>

                    {/* Subtle Collapsible Logo Hint */}
          <details
            id="company-logo-logic-card"
            style={{
              marginBottom: '1.25rem',
              padding: '0.5rem 0.85rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <summary style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>💡</span> How Company Logos Are Automatically Fetched
            </summary>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.775rem' }}>
              <div><strong style={{ color: 'var(--text-primary)' }}>By Real Company Name:</strong> Official logo attached automatically for popular tech companies.</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Smart Monogram Fallback:</strong> Clean initials badge generated if no public icon is found.</div>
            </div>
          </details>
{/* Field 2: Website */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="input-modal-company-website"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Careers / Official Website{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                (Optional)
              </span>
            </label>
            <input
              id="input-modal-company-website"
              type="text"
              placeholder="https://careers.company.com or https://company.com"
              value={formData.website}
              onChange={(e) => {
                setFormData({ ...formData, website: e.target.value })
                if (fieldErrors.website) setFieldErrors({ ...fieldErrors, website: null })
              }}
              disabled={isSubmitting}
              className="form-control"
              style={{
                width: '100%',
                borderColor: fieldErrors.website ? 'var(--color-danger, #ef4444)' : undefined,
              }}
            />
            {fieldErrors.website && (
              <span
                id="error-modal-company-website"
                style={{
                  display: 'block',
                  color: 'var(--color-danger, #ef4444)',
                  fontSize: '0.8rem',
                  marginTop: '0.3rem',
                }}
              >
                {fieldErrors.website}
              </span>
            )}
          </div>

          {/* Field 3: Description */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="input-modal-company-desc"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Description{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                (Optional)
              </span>
            </label>
            <textarea
              id="input-modal-company-desc"
              rows={3}
              placeholder="Brief overview of the engineering culture, hiring bar, or headquarters location..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              className="form-control"
              style={{ width: '100%', fontFamily: 'inherit' }}
            />
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
              id="btn-cancel-company-modal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              id="btn-submit-company-modal"
            >
              {isSubmitting
                ? isEditing
                  ? 'Saving Changes...'
                  : 'Creating Company...'
                : isEditing
                ? 'Save Changes'
                : 'Create Company'}
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

export default CompanyFormModal
