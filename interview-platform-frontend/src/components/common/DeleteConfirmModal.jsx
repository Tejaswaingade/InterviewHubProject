import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Universal Reusable Delete Confirmation Dialogue Box
 * Uses React Portal to mount into document.body to ensure perfect viewport centering.
 */
export function DeleteConfirmModal({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this item?',
  itemName = '',
  isDeleting = false,
  error = null,
  onConfirm,
  onCancel,
  confirmButtonText = 'Yes',
  cancelButtonText = 'No',
  id = 'delete-confirm-modal',
}) {
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
        if (e.target.id === `${id}-overlay` && !isDeleting) onCancel()
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
        <div style={{ fontSize: '2.75rem', lineHeight: 1, marginBottom: '1.15rem' }}>⚠️</div>

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
          {title}
        </h3>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '1rem',
          }}
          id={`${id}-message`}
        >
          {message}{' '}
          {itemName && (
            <strong style={{ color: 'var(--text-primary)' }}>"{itemName}"</strong>
          )}
        </p>

        <div
          id={`${id}-undo-warning`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--color-danger, #ef4444)',
            fontWeight: 700,
            fontSize: '0.88rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--radius-full, 9999px)',
            marginBottom: '1.5rem',
          }}
        >
          <span>⚠️</span>
          <span>This cannot be undone.</span>
        </div>

        {error && (
          <div
            id={`${id}-error`}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger, #ef4444)',
              color: 'var(--color-danger, #ef4444)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              textAlign: 'left',
            }}
          >
            ⚠️ {error}
          </div>
        )}

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
            disabled={isDeleting}
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
            {cancelButtonText || 'No'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn btn-primary"
            id={`${id}-yes-btn`}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.925rem',
              backgroundColor: 'var(--color-danger, #ef4444)',
              borderColor: 'var(--color-danger, #ef4444)',
              borderRadius: '10px',
            }}
          >
            {isDeleting ? 'Deleting...' : (confirmButtonText || 'Yes')}
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

export default DeleteConfirmModal
