import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCompanyBrand } from '../../utils/companyBrands'
import { useAuth } from '../../context/AuthContext'

export function CompanyCard({ company, onDelete }) {
  const [logoError, setLogoError] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'

  if (!company) return null

  // Enrich with authentic branding and taglines
  const brand = getCompanyBrand(company)

  // Initials fallback if logo fails or is missing
  const initials = brand.name
    ? brand.name
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CO'

  // Clean URL display for website link
  const formattedWebsite = brand.website
    ? brand.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    : null

  return (
    <article
      className="card company-card"
      id={`company-card-${brand.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '1.75rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease',
      }}
    >
      {/* Top Row: Company Logo & Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Authentic Brand Logo or Stylized Avatar */}
        <div
          id={`company-logo-${brand.id}`}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            padding: '4px',
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
                fontSize: '1.15rem',
                fontWeight: 800,
                color: brand.brandColor || 'var(--brand-primary)',
                letterSpacing: '0.05em',
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Company Name & Website Link */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 0.25rem 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            id={`company-name-${brand.id}`}
          >
            <Link
              to={`/companies/${brand.id}`}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {brand.name}
            </Link>
          </h3>

          {brand.website ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              id={`company-website-${brand.id}`}
              style={{
                fontSize: '0.8rem',
                color: 'var(--brand-primary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                wordBreak: 'break-all',
              }}
            >
              <span>🔗</span>
              <span>{formattedWebsite}</span>
              <span style={{ fontSize: '0.7rem' }}>↗</span>
            </a>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Verified Tech Profile
            </span>
          )}
        </div>
      </div>

      {/* Tagline if available */}
      {brand.tagline && (
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--brand-primary)',
            marginBottom: '0.65rem',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
          id={`company-tagline-${brand.id}`}
        >
          "{brand.tagline}"
        </div>
      )}

      {/* Real Corporate Description */}
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          flex: 1,
        }}
        id={`company-description-${brand.id}`}
      >
        {brand.description ||
          'Explore real interview experiences, technical questions, and hiring process insights for this company.'}
      </p>

      {/* Card Action Row */}
      <div
        style={{
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Link
          to={`/companies/${brand.id}`}
          className="btn btn-sm btn-primary"
          id={`view-company-experiences-btn-${brand.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <span>View Experiences</span>
          <span>→</span>
        </Link>

        {isAdmin && onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete(company)
            }}
            className="btn btn-sm"
            id={`btn-delete-company-card-${brand.id}`}
            title={`Delete ${brand.name} profile`}
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
              transition: 'all 0.15s ease',
            }}
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        )}
      </div>
    </article>
  )
}

export default CompanyCard
