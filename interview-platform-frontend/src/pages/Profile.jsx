import userApi from '../api/userApi'
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authApi from '../api/authApi'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export function Profile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(authUser || null)
  const [loading, setLoading] = useState(!authUser)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const fileInputRef = useRef(null)

  // Initialize avatar from localStorage
  useEffect(() => {
    const email = profile?.email || authUser?.email
    if (email) {
      const savedAvatar = localStorage.getItem(`interviewhub_avatar_${email}`)
      if (savedAvatar) {
        setAvatarUrl(savedAvatar)
      }
    }
  }, [profile?.email, authUser?.email])

  const fetchUserProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.getCurrentUser()
      const data = res.data || res
      setProfile(data)
      if (data?.profilePhoto) {
        setAvatarUrl(data.profilePhoto)
        localStorage.setItem(`interviewhub_avatar_${data.email}`, data.profilePhoto)
      } else if (data?.email) {
        const savedAvatar = localStorage.getItem(`interviewhub_avatar_${data.email}`)
        if (savedAvatar) setAvatarUrl(savedAvatar)
      }
    } catch (err) {
      console.error('[Profile] Failed to fetch current user profile:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  // Handle photo file selection and conversion
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError({ message: 'Please select a valid image file (PNG, JPG, WebP, GIF).' })
      return
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError({ message: 'Image size exceeds 2MB limit. Please choose a smaller photo.' })
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Data = reader.result
      setAvatarUrl(base64Data)

      const email = profile?.email || authUser?.email
      if (email) {
        localStorage.setItem(`interviewhub_avatar_${email}`, base64Data)
        try {
          const storedUser = JSON.parse(localStorage.getItem('interviewhub_user') || '{}')
          storedUser.profilePhoto = base64Data
          storedUser.avatar = base64Data
          localStorage.setItem('interviewhub_user', JSON.stringify(storedUser))
          window.dispatchEvent(new Event('interviewhub_avatar_changed'))
        } catch {
          // ignore parsing error
        }

        // Persist photo directly to PostgreSQL database via backend API
        if (profile?.id) {
          try {
            await userApi.updateProfilePhoto(profile.id, base64Data)
          } catch (apiErr) {
            console.warn('[Profile] Failed to save photo to backend DB, kept in local storage:', apiErr)
          }
        }
      }

      setSuccessMessage('Profile photo updated and saved to database successfully!')
      setTimeout(() => setSuccessMessage(null), 4000)
    }

    reader.onerror = () => {
      setError({ message: 'Failed to read image file. Please try another image.' })
    }

    reader.readAsDataURL(file)
  }

  // Handle removing photo
  const handleRemovePhoto = async () => {
    setAvatarUrl(null)
    const email = profile?.email || authUser?.email
    if (email) {
      localStorage.removeItem(`interviewhub_avatar_${email}`)
      try {
        const storedUser = JSON.parse(localStorage.getItem('interviewhub_user') || '{}')
        delete storedUser.avatar
        delete storedUser.profilePhoto
        localStorage.setItem('interviewhub_user', JSON.stringify(storedUser))
        window.dispatchEvent(new Event('interviewhub_avatar_changed'))
      } catch {
        // ignore
      }
      if (profile?.id) {
        try {
          await userApi.updateProfilePhoto(profile.id, null)
        } catch (apiErr) {
          console.warn('[Profile] Failed to remove photo from backend DB:', apiErr)
        }
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setSuccessMessage('Profile photo removed.')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  if (loading) {
    return (
      <div className="container section" style={{ maxWidth: '680px', padding: '4rem 1.5rem' }} id="profile-loading">
        <Loading message="Loading your candidate profile..." />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container section" style={{ maxWidth: '680px', padding: '3rem 1.5rem' }} id="profile-error">
        <ErrorMessage error={error} onRetry={fetchUserProfile} />
      </div>
    )
  }

  const roleBadgeStyle =
    profile?.role === 'ADMIN'
      ? {
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          color: '#8b5cf6',
          border: '1px solid rgba(124, 58, 237, 0.3)',
        }
      : {
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }

  return (
    <div className="container section" style={{ maxWidth: '680px' }} id="profile-page">
      {/* Page Heading */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }} id="profile-title">
          Candidate Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          Manage your verified account credentials, profile photo, and interview records.
        </p>
      </div>

      {error && <ErrorMessage error={error} onRetry={fetchUserProfile} />}

      {successMessage && (
        <div
          id="profile-success-alert"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div
        className="card"
        id="profile-card"
        style={{
          padding: '2.5rem 2rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        {/* Avatar & Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Avatar Container with Photo Upload Action */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-subtle)',
                border: '2px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
              id="profile-avatar"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.name || 'User avatar'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  id="profile-avatar-img"
                />
              ) : (
                <span>👤</span>
              )}
            </div>

            {/* Camera Overlay Icon Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-primary)',
                color: '#ffffff',
                border: '2px solid var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-sm)',
              }}
              title="Upload profile photo"
              id="btn-upload-photo-icon"
            >
              📷
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }} id="profile-name">
              {profile?.name || 'Candidate Engineer'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              {/* Photo Upload Hidden Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/png, image/jpeg, image/webp, image/gif"
                style={{ display: 'none' }}
                id="profile-photo-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                id="btn-change-photo"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                📷 {avatarUrl ? 'Change Photo' : 'Add Photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn btn-ghost btn-sm"
                  id="btn-remove-photo"
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--brand-danger, #ef4444)',
                    padding: '0.35rem 0.6rem',
                  }}
                >
                  ✕ Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        {/* Detail Fields (User ID is removed as requested) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address
            </span>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-primary)', margin: '0.25rem 0 0' }} id="profile-email">
              {profile?.email || 'candidate@example.com'}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Privilege
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span className="badge" style={{ ...roleBadgeStyle, fontSize: '0.8rem', fontWeight: 700 }} id="profile-role">
                {profile?.role === 'ADMIN' ? '🛡️ SUPER ADMIN' : '💼 CANDIDATE'}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Member Since
            </span>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '0.25rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }} id="profile-created">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Active Member'}
            </p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        {/* Quick Nav Actions */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <Link to="/dashboard" className="btn btn-secondary" id="btn-profile-dashboard">
            View My Dashboard →
          </Link>
          <Link to="/create-experience" className="btn btn-primary" id="btn-profile-share">
            + Share New Experience
          </Link>
          {profile?.role === 'ADMIN' && (
            <Link to="/admin" className="btn btn-outline" id="btn-profile-admin">
              Admin Console 🛡️
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
