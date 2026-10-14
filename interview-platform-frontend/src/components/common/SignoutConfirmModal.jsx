import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Universal Reusable Signout Confirmation Dialogue Box
 * Uses React Portal to mount directly to document.body, guaranteeing
 * perfect viewport centering and immunity to sticky/backdrop-filter parents.
 */
export function SignoutConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  userName = '',
  id = 'signout-confirm-modal',
}) {
  // Prevent background scroll while confirmation modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalNode = (
    <div
      id={`${id}-overlay`}
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
      }}
      onClick={(e) => {
        if (e.target.id === `${id}-overlay`) onCancel()
      }}
    >
      <div
        className="card"
        id={id}
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2.25rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          position: 'relative',
          margin: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '2.75rem', lineHeight: 1, marginBottom: '1.15rem' }}>👋</div>

        <h3
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.65rem',
            letterSpacing: '-0.02em',
          }}
          id={`${id}-title`}
        >
          Sign Out of InterviewHub?
        </h3>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '1.85rem',
          }}
          id={`${id}-message`}
        >
          {userName ? `Hi ${userName}, are you sure you want to sign out?` : 'Are you sure you want to sign out?'} You will need to sign in again to access your dashboard, shared experiences, and live discussions.
        </p>

        {/* Action Buttons: Strict No / Yes */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.85rem',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            id={`${id}-no-btn`}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.925rem',
              borderRadius: '10px',
            }}
          >
            No, Stay
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary"
            id={`${id}-yes-btn`}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.925rem',
              backgroundColor: '#ef4444',
              borderColor: '#ef4444',
              borderRadius: '10px',
            }}
          >
            Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body)
  }
  return modalNode
}

export default SignoutConfirmModal
