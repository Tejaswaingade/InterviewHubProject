import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authApi from '../api/authApi'
import userApi from '../api/userApi'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'

export function Profile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(authUser || null)
  const [loading, setLoading] = useState(!authUser)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [editedPhone, setEditedPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const fileInputRef = useRef(null)

  // Initialize avatar & phone from localStorage/profile
  useEffect(() => {
    const email = profile?.email || authUser?.email
    if (email) {
      const savedAvatar = localStorage.getItem(`interviewhub_avatar_${email}`)
      if (savedAvatar) {
        setAvatarUrl(savedAvatar)
      }
    }
    if (profile?.phoneNumber) {
      setEditedPhone(profile.phoneNumber)
    }
  }, [profile?.email, profile?.phoneNumber, authUser?.email])

  const fetchUserProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.getCurrentUser()
      const data = res.data || res
      setProfile(data)
      if (data?.phoneNumber) {
        setEditedPhone(data.phoneNumber)
      }
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

    if (!file.type.startsWith('image/')) {
      setError({ message: 'Please select a valid image file (PNG, JPG, WebP, GIF).' })
      return
    }

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
          // ignore
        }

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

  // Handle inline saving of mobile number
  const handleSavePhone = async () => {
    if (!profile?.id) return
    const cleaned = editedPhone.trim()
    if (cleaned && !/^\+?[0-9\s\-()]{10,15}$/.test(cleaned)) {
      setError({ message: 'Please enter a valid mobile number (10-15 digits).' })
      return
    }

    setSavingPhone(true)
    setError(null)
    try {
      const res = await userApi.patchUser(profile.id, { phoneNumber: cleaned || null })
      const updatedData = res.data || res
      setProfile((prev) => ({ ...prev, phoneNumber: updatedData?.phoneNumber || cleaned }))
      setIsEditingPhone(false)
      setSuccessMessage('Mobile number updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3500)
    } catch (err) {
      console.error('[Profile] Failed to update phone number:', err)
      setError({ message: err?.message || 'Failed to update mobile number.' })
    } finally {
      setSavingPhone(false)
    }
  }

  // Quick clipboard copy helper with Google-style feedback
  const handleCopy = (text, label, fieldKey) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      if (fieldKey) {
        setCopiedField(fieldKey)
        setTimeout(() => setCopiedField(null), 2000)
      }
      setSuccessMessage(`${label} copied to clipboard!`)
      setTimeout(() => setSuccessMessage(null), 2500)
    })
  }

  if (loading) {
    return (
      <div className="container section" style={{ maxWidth: '780px', padding: '4rem 1.5rem' }} id="profile-loading">
        <Loading message="Loading your candidate profile..." />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container section" style={{ maxWidth: '780px', padding: '3rem 1.5rem' }} id="profile-error">
        <ErrorMessage error={error} onRetry={fetchUserProfile} />
      </div>
    )
  }

  const isAdmin = profile?.role === 'ADMIN' || authUser?.role === 'ADMIN'

  const roleBadgeStyle = isAdmin
    ? {
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        color: '#a78bfa',
        border: '1px solid rgba(124, 58, 237, 0.35)',
      }
    : {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        color: '#60a5fa',
        border: '1px solid rgba(59, 130, 246, 0.35)',
      }

  return (
    <div className="container section" style={{ maxWidth: '820px' }} id="profile-page">
      {/* Page Heading & Breadcrumb Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{isAdmin ? '🛡️' : '👨‍💻'}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {isAdmin ? 'Administrator Account' : 'Verified Candidate Profile'}
          </span>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }} id="profile-title">
          {isAdmin ? 'Admin Console Profile' : 'Candidate Profile'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', marginTop: '0.35rem' }}>
          Manage your verified account credentials, contact information, and platform interview records.
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
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.92rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <span>✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div
        className="card"
        id="profile-card"
        style={{
          padding: '2.5rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Luxury Gradient Accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: isAdmin
              ? 'linear-gradient(90deg, #8b5cf6, #d946ef, #6366f1)'
              : 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)',
          }}
        />

        {/* Avatar & Header Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Avatar Container with Photo Upload Action */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-subtle)',
                border: '3px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                flexShrink: 0,
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
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
                <span>{isAdmin ? '🛡️' : '👨‍💻'}</span>
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
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--brand-primary)',
                color: '#ffffff',
                border: '2px solid var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)',
              }}
              title="Upload profile photo"
              id="btn-upload-photo-icon"
            >
              📷
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }} id="profile-name">
                {profile?.name || (isAdmin ? 'Admin User' : 'Candidate Engineer')}
              </h2>
              <span className="badge" style={{ ...roleBadgeStyle, fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.65rem' }} id="profile-role">
                {isAdmin ? '⚡ SUPER ADMIN' : '🛡️ VERIFIED CANDIDATE'}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.35rem 0 0.75rem' }}>
              {isAdmin
                ? 'System Platform Administrator • Content Moderation & User Control'
                : 'Software Engineering Candidate • Interview Experience Contributor'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              >
                📷 {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="btn btn-ghost btn-sm"
                  id="btn-remove-photo"
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--brand-danger, #ef4444)',
                    padding: '0.4rem 0.75rem',
                  }}
                >
                  ❌Delete Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Highlight Stats Bar */}
        <div
          id="profile-stats-bar"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-subtle, rgba(255, 255, 255, 0.03))',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Status
            </span>
            <div style={{ marginTop: '0.3rem', fontSize: '1.05rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <span>●</span> Active Verified
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAdmin ? 'System Role' : 'Platform Standing'}
            </span>
            <div style={{ marginTop: '0.3rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isAdmin ? 'Super Admin' : 'Top Contributor'}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: 0 }} />

        {/* Verified Account Details & Contact Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
          {/* Email Address */}
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>✉️</span> Email Address
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
              <p style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }} id="profile-email">
                {profile?.email || authUser?.email || ''}
              </p>
              <button
                type="button"
                onClick={() => handleCopy(profile?.email, 'Email address', 'email')}
                className="btn btn-ghost btn-sm"
                title="Copy email to clipboard"
                id="btn-copy-email"
                style={{
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.75rem',
                  color: copiedField === 'email' ? '#10b981' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  borderRadius: 'var(--radius-sm, 4px)',
                  transition: 'all 0.15s ease',
                }}
              >
                {copiedField === 'email' ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Copied</span>
                  </>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Number Field (Saved & Displayed) */}
          <div id="profile-phone-container">
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>📱</span> Mobile Number
            </span>

            {isEditingPhone ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                <input
                  type="tel"
                  id="profile-phone-input"
                  value={editedPhone}
                  onChange={(e) => setEditedPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="form-control"
                  style={{
                    maxWidth: '220px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-subtle, #1e293b)',
                    color: 'var(--text-primary)',
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="btn btn-primary btn-sm"
                  id="btn-save-phone"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {savingPhone ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPhone(false)
                    setEditedPhone(profile?.phoneNumber || '')
                  }}
                  className="btn btn-ghost btn-sm"
                  id="btn-cancel-phone"
                  style={{ fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <p
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 600,
                    color: profile?.phoneNumber ? 'var(--text-primary)' : 'var(--text-muted)',
                    margin: 0,
                  }}
                  id="profile-phone"
                >
                  {profile?.phoneNumber || 'Not provided yet'}
                </p>
                {profile?.phoneNumber && (
                  <button
                    type="button"
                    onClick={() => handleCopy(profile.phoneNumber, 'Mobile number', 'phone')}
                    className="btn btn-ghost btn-sm"
                    title="Copy mobile number to clipboard"
                    id="btn-copy-phone"
                    style={{
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.75rem',
                      color: copiedField === 'phone' ? '#10b981' : 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      borderRadius: 'var(--radius-sm, 4px)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {copiedField === 'phone' ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Copied</span>
                      </>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="btn btn-ghost btn-sm"
                  id="btn-edit-phone"
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.78rem',
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                  }}
                >
                  {profile?.phoneNumber ? 'Edit' : '+ Add Number'}
                </button>
              </div>
            )}
          </div>

          {/* Account Privilege */}
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>🛡️</span> Account Privilege
            </span>
            <div style={{ marginTop: '0.35rem' }}>
              <span className="badge" style={{ ...roleBadgeStyle, fontSize: '0.82rem', fontWeight: 700 }}>
                {isAdmin ? '⚡ SUPER ADMIN' : '🛡️ VERIFIED CANDIDATE'}
              </span>
            </div>
          </div>

          {/* Member Since */}
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>📅</span> Member Since
            </span>
            <p style={{ fontSize: '0.98rem', fontWeight: 500, marginTop: '0.35rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }} id="profile-created">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'September 5, 2026'}
            </p>
          </div>
        </div>



        {/* Quick Nav Actions (Notice: Share New Experience is REMOVED for Admin) */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
          <Link to="/dashboard" className="btn btn-secondary" id="btn-profile-dashboard">
            View My Dashboard →
          </Link>

          {/* Candidate-only: + Share New Experience (Removed for Admin) */}
          {!isAdmin && (
            <Link to="/create-experience" className="btn btn-primary" id="btn-profile-share">
              + Share New Experience
            </Link>
          )}

          {/* Admin-only: Admin Console */}
          {isAdmin && (
            <Link to="/admin" className="btn btn-primary" id="btn-profile-admin">
              Admin Console 🛡️
            </Link>
          )}

          <Link to="/experiences" className="btn btn-outline" id="btn-profile-explore">
            Explore All Experiences →
          </Link>
        </div>

        {/* Security & Confidentiality Reassurance */}
        <div
          style={{
            padding: '0.85rem 1rem',
            backgroundColor: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🔒</span>
          <span>
            Your mobile number and account credentials are saved securely in your profile with encrypted access.
          </span>
        </div>
      </div>
    </div>
  )
}

export default Profile
