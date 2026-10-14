import React from 'react'
import { Link } from 'react-router-dom'

export function NotFound({
  code = '404',
  title = 'Page Not Found',
  description = 'The page or resource you are looking for does not exist, has been removed, or has moved to another address.',
  actionText = '← Return to Homepage',
  actionLink = '/',
  isPage = true,
  id = 'not-found-page'
}) {
  const content = (
    <div
      style={{
        textAlign: 'center',
        padding: isPage ? '6rem 1.5rem' : '4rem 1.5rem',
        maxWidth: '560px',
        margin: '0 auto',
      }}
      id={id}
    >
      <div
        style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          color: 'var(--brand-primary, #6366f1)',
          marginBottom: '0.5rem',
          lineHeight: 1,
        }}
        id={`${id}-code`}
      >
        {code}
      </div>

      <h1
        style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'var(--text-primary)',
        }}
        id={`${id}-title`}
      >
        {title}
      </h1>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}
        id={`${id}-description`}
      >
        {description}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to={actionLink} className="btn btn-primary" id={`${id}-action-btn`}>
          {actionText}
        </Link>
        {actionLink !== '/experiences' && (
          <Link to="/experiences" className="btn btn-outline" id={`${id}-secondary-btn`}>
            Browse Experiences
          </Link>
        )}
      </div>
    </div>
  )

  if (isPage) {
    return <div className="container section">{content}</div>
  }

  return content
}

export default NotFound
