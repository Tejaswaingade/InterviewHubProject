import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ExperienceForm from '../components/experience/ExperienceForm'

export function CreateExperience() {
  const { user, isAdmin } = useAuth()
  const hasAdminRole = isAdmin || user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'

  if (hasAdminRole) {
    return <Navigate to="/admin" replace />
  }
  return (
    <div className="container section" style={{ maxWidth: '880px', width: '100%', boxSizing: 'border-box', padding: '1.5rem 1rem' }} id="create-experience-page">
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/experiences"
          id="link-back-to-experiences"
          style={{
            color: 'var(--brand-primary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          ← Back to Experiences
        </Link>
      </div>

      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--brand-primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
          }}
        >
          <span>✨</span>
          <span>4-Step Experience Wizard</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
          id="create-experience-heading"
        >
          Share Your Interview Experience
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            maxWidth: '660px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
          id="create-experience-subheading"
        >
          Help fellow candidates prepare with realistic round breakdowns, technical questions, and interview advice.
        </p>
      </div>

      {/* Validated 4-Step Experience Stepper Wizard */}
      <ExperienceForm />
    </div>
  )
}

export default CreateExperience