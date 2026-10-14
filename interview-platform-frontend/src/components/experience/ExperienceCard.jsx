import React from 'react'
import { Link } from 'react-router-dom'
import CompanyLogo from '../common/CompanyLogo'

export function ExperienceCard({ experience, showActions = false, onDelete }) {
  if (!experience) return null

  const companyName = experience.company?.name || 'Tech Company'
  const title = experience.experienceTitle || 'Technical Interview Experience'
  const role = experience.jobRole || 'Software Engineer'
  const difficulty = experience.overallDifficulty || 'MEDIUM'
  const result = experience.result || 'SELECTED'
  const yearsExp =
    experience.yearsOfExperience !== undefined && experience.yearsOfExperience !== null
      ? `${experience.yearsOfExperience} yrs exp`
      : 'Entry / Fresher'

  const date = experience.createdAt
    ? new Date(experience.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const difficultyBadgeClass =
    difficulty === 'HARD'
      ? 'badge-hard'
      : difficulty === 'EASY'
      ? 'badge-easy'
      : 'badge-medium'

  const resultBadgeClass =
    result === 'SELECTED'
      ? 'badge-selected'
      : result === 'REJECTED'
      ? 'badge-rejected'
      : 'badge-brand'

  return (
    <article
      className="card"
      id={`experience-card-${experience.id}`}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Top Meta: Company Name with Authentic Logo & Creation Date */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontWeight: 800,
            color: 'var(--brand-primary)',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          id={`exp-company-${experience.id}`}
        >
          <CompanyLogo company={experience.company} name={companyName} size={22} />
          <span>{companyName}</span>
        </span>
        {date && (
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
            id={`exp-date-${experience.id}`}
          >
            <span>📅</span>
            <span>{date}</span>
          </span>
        )}
      </div>

      {/* Experience Title */}
      <h3
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: 'var(--text-primary)',
          lineHeight: 1.4,
        }}
        id={`exp-title-${experience.id}`}
      >
        <Link
          to={`/experiences/${experience.id}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          {title}
        </Link>
      </h3>

      {/* Role & Years of Experience */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
        }}
        id={`exp-meta-${experience.id}`}
      >
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          💼 {role}
        </span>
        <span style={{ color: 'var(--border-medium)' }}>•</span>
        <span
          style={{
            backgroundColor: 'var(--bg-subtle)',
            padding: '0.15rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
          id={`exp-years-${experience.id}`}
        >
          ⏱️ {yearsExp}
        </span>
      </div>

      {/* Author & Email */}
      {experience.user && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '0.85rem',
            flexWrap: 'wrap',
          }}
          id={`exp-author-${experience.id}`}
        >
          <span>Shared by:</span>
          <strong style={{ color: 'var(--text-secondary)' }}>{experience.user.name || 'Candidate'}</strong>
          {experience.user.email && (
            <span style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>({experience.user.email})</span>
          )}
        </div>
      )}

      {/* Brief Overview Snippet */}
      {experience.description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            marginBottom: '1.25rem',
            flex: 1,
          }}
        >
          {experience.description.length > 140
            ? `${experience.description.substring(0, 140)}...`
            : experience.description}
        </p>
      )}

      {/* Bottom Footer: Difficulty, Result Badges & Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`badge ${difficultyBadgeClass}`} id={`exp-diff-${experience.id}`}>
            {difficulty}
          </span>
          <span className={`badge ${resultBadgeClass}`} id={`exp-result-${experience.id}`}>
            {result}
          </span>
        </div>

        {showActions ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <Link
              to={`/experiences/${experience.id}`}
              className="btn btn-sm btn-outline"
              id={`view-experience-btn-${experience.id}`}
            >
              View
            </Link>
            <Link
              to={`/experiences/${experience.id}/edit`}
              className="btn btn-sm btn-secondary"
              id={`edit-experience-btn-${experience.id}`}
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => onDelete && onDelete(experience)}
              className="btn btn-sm btn-ghost"
              id={`delete-experience-btn-${experience.id}`}
              style={{ color: 'var(--brand-danger, #ef4444)' }}
            >
              Delete
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {experience.user?.id && (
              <Link
                to={`/chat?userId=${experience.user.id}&userName=${encodeURIComponent(experience.user.name || 'Author')}`}
                className="btn btn-sm btn-ghost"
                id={`chat-author-btn-${experience.id}`}
                title="Chat live with candidate"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600 }}
              >
                💬 Chat
              </Link>
            )}
            <Link
              to={`/experiences/${experience.id}`}
              className="btn btn-sm btn-outline"
              id={`view-experience-btn-${experience.id}`}
            >
              View Details →
            </Link>
          </div>
        )}
      </div>
    </article>
  )
}

export default ExperienceCard
