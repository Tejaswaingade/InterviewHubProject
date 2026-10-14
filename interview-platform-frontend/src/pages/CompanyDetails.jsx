import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import companyApi from '../api/companyApi'
import experienceApi from '../api/experienceApi'
import { getCompanyBrand } from '../utils/companyBrands'
import { useAuth } from '../context/AuthContext'
import ExperienceCard from '../components/experience/ExperienceCard'
import DeleteConfirmModal from '../components/common/DeleteConfirmModal'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'

export function CompanyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'

  const [company, setCompany] = useState(null)
  const [experiences, setExperiences] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const loadCompanyAndExperiences = async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)

    try {
      // 1. Fetch company by ID
      const compRes = await companyApi.getCompanyById(id)
      const compData = compRes.data || compRes
      if (!compData || !compData.id) {
        setNotFound(true)
        return
      }
      setCompany(compData)

      // 2. Fetch experiences linked to this company
      try {
        const expRes = await experienceApi.getExperiences({
          companyId: id,
          page: 0,
          size: 20,
          sort: 'createdAt,desc',
        })
        const expData = expRes.data || expRes || {}
        const items = Array.isArray(expData) ? expData : expData.content || []
        setExperiences(items)
      } catch (expErr) {
        console.warn('[CompanyDetails] Failed to load experiences for company:', expErr.message)
        setExperiences([])
      }
    } catch (err) {
      console.error('[CompanyDetails] Error loading company:', err)
      if (err.status === 404 || (err.message && err.message.includes('404'))) {
        setNotFound(true)
      } else {
        setError(err.message || 'Failed to load company profile and experiences.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadCompanyAndExperiences()
    }
  }, [id])

  // Handle Admin Deleting Company
  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await companyApi.deleteCompany(id)
      setIsDeleting(false)
      setShowDeleteModal(false)
      navigate('/companies', { replace: true })
    } catch (err) {
      console.error('[CompanyDetails] Delete error:', err)
      setIsDeleting(false)
      setDeleteError(err.message || 'Failed to delete company profile.')
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="container page-wrapper" style={{ maxWidth: '920px' }} id="company-details-loading">
        <Loading message="Loading company profile and interview experiences..." />
      </div>
    )
  }

  // Not Found State (404)
  if (notFound) {
    return (
      <div className="container page-wrapper" style={{ maxWidth: '720px' }} id="company-not-found">
        <EmptyState
          icon="🔍"
          title="Company Not Found"
          description={`The company with ID #${id} could not be found. It may have been removed or the link is invalid.`}
          action={
            <Link to="/companies" className="btn btn-primary" id="btn-back-to-companies">
              ← Browse All Companies
            </Link>
          }
        />
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="container page-wrapper" style={{ maxWidth: '800px' }} id="company-details-error">
        <ErrorMessage message={error} onRetry={loadCompanyAndExperiences} />
      </div>
    )
  }

  if (!company) return null

  // Enrich with authentic brand metadata
  const brand = getCompanyBrand(company)

  // Initials fallback
  const initials = brand.name
    ? brand.name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CO'

  const formattedWebsite = brand.website
    ? brand.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : null

  return (
    <div className="container page-wrapper" id="company-details-page">
      {/* Back link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/companies"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--brand-primary)',
            textDecoration: 'none',
          }}
          id="link-back-to-companies"
        >
          <span>←</span>
          <span>Back to Companies Directory</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <section
        className="card"
        id="company-header-card"
        style={{
          padding: '2.5rem 2rem',
          marginBottom: '2.5rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* Left: Logo & Company Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              id="company-profile-logo"
              style={{
                width: '68px',
                height: '68px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                padding: '6px',
              }}
            >
              {brand.logo && !logoError ? (
                <img
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  onError={() => setLogoError(true)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                <span
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: brand.brandColor || 'var(--brand-primary)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {initials}
                </span>
              )}
            </div>

            <div>
              <h1
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.35rem 0',
                }}
                id="company-details-name"
              >
                {brand.name}
              </h1>

              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="company-details-website"
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--brand-primary)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 600,
                  }}
                >
                  <span>🌐</span>
                  <span>{formattedWebsite}</span>
                  <span style={{ fontSize: '0.75rem' }}>↗</span>
                </a>
              )}
            </div>
          </div>

          {/* Right: Actions (Share Experience + Admin Delete) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/create-experience"
              className="btn btn-primary btn-sm"
              id="btn-share-company-experience"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>➕</span>
              <span>Share Experience</span>
            </Link>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-sm"
                id="btn-delete-company-details"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  backgroundColor: 'var(--color-danger-bg, #fef2f2)',
                  color: 'var(--color-danger, #dc2626)',
                  border: '1px solid var(--color-danger-border, #fecaca)',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm, 6px)',
                  cursor: 'pointer',
                }}
              >
                <span>🗑️</span>
                <span>Delete Company</span>
              </button>
            )}
          </div>
        </div>

        {/* Tagline */}
        {brand.tagline && (
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--brand-primary)',
              marginTop: '1.25rem',
              fontStyle: 'italic',
            }}
            id="company-details-tagline"
          >
            "{brand.tagline}"
          </div>
        )}

        {/* Company Description */}
        {brand.description && (
          <p
            style={{
              marginTop: '1rem',
              marginBottom: 0,
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
            }}
            id="company-details-description"
          >
            {brand.description}
          </p>
        )}
      </section>

      {/* Linked Interview Experiences Section */}
      <section id="company-experiences-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
            id="company-experiences-heading"
          >
            Interview Experiences ({experiences.length})
          </h2>
        </div>

        {experiences.length === 0 ? (
          <div id="company-experiences-empty">
            <EmptyState
              icon="📝"
              title={`No interview experiences for ${brand.name} yet`}
              description={`Be the first engineer to share your interview journey, round breakdown, and questions for ${brand.name}!`}
              action={
                <Link
                  to="/create-experience"
                  className="btn btn-primary btn-sm"
                  id="btn-be-first-to-share"
                >
                  Share Your Experience
                </Link>
              }
            />
          </div>
        ) : (
          <div
            id="company-experiences-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {experiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </section>

      {/* Admin Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Company Profile"
        message={`Are you sure you want to permanently delete "${brand.name}" from the platform directory? Associated interview experiences may also be removed.`}
        itemName={brand.name}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeleteError(null)
        }}
        confirmButtonText="Yes"
        cancelButtonText="No"
      />
    </div>
  )
}

export default CompanyDetails
