import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotification } from '../../hooks/useNotification'
import logoLight from '../../assets/logo-light.svg'
import logoDark from '../../assets/logo-dark.svg'
import SignoutConfirmModal from '../common/SignoutConfirmModal'

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAllAsRead, clearNotifications } = useNotification()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [navAvatar, setNavAvatar] = useState(null)
  const [showSignoutModal, setShowSignoutModal] = useState(false)
  const notifRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const updateAvatar = () => {
      const email = user?.email
      if (email) {
        const stored = localStorage.getItem(`interviewhub_avatar_${email}`)
        setNavAvatar(user?.profilePhoto || stored || user?.avatar || null)
      } else {
        setNavAvatar(null)
      }
    }
    updateAvatar()
    window.addEventListener('interviewhub_avatar_changed', updateAvatar)
    return () => window.removeEventListener('interviewhub_avatar_changed', updateAvatar)
  }, [user?.email, user?.avatar])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setMobileMenuOpen(false)
    setShowSignoutModal(false)
    navigate('/login')
  }

  const handleLogoutClick = () => {
    setMobileMenuOpen(false)
    setShowSignoutModal(true)
  }

  // Check if current user is an admin
  const hasAdminRole = isAdmin || user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'

  // Single official logo adapting seamlessly to current theme
  const officialLogo = theme === 'dark' ? logoDark : logoLight

  return (
    <header className="navbar" id="app-navbar">
      <div className="container navbar-inner">
        {/* Single Official Brand Logo */}
        <div className="brand-group">
          <Link
            to="/"
            className="brand-logo"
            id="nav-brand"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              padding: '0.2rem 0',
            }}
          >
            <img
              src={officialLogo}
              alt="InterviewHub - connect.prep.grow"
              id="app-nav-logo"
              style={{
                height: '50px',
                width: 'auto',
                maxWidth: '280px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Link>
        </div>

        {/* Navigation Links based on authentication & role */}
        <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`} id="nav-menu">
          {/* Public links always visible */}
          <NavLink
            to="/experiences"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            id="nav-link-experiences"
          >
            Experiences
          </NavLink>
          <NavLink
            to="/companies"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
            id="nav-link-companies"
          >
            Companies
          </NavLink>

          {/* Candidate-only links (Hidden for Admin accounts) */}
          {isAuthenticated && !hasAdminRole && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
                id="nav-link-dashboard"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/chat"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
                id="nav-link-chat"
              >
                Chat
              </NavLink>
              <NavLink
                to="/create-experience"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
                id="nav-link-share-experience"
              >
                Share Experience
              </NavLink>
            </>
          )}

          {/* Authenticated User Profile */}
          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              id="nav-link-profile"
            >
              Profile
            </NavLink>
          )}

          {/* Admin link (Admin-only) */}
          {hasAdminRole && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
              id="nav-link-admin-dashboard"
            >
              Admin Dashboard
            </NavLink>
          )}
        </nav>

        {/* Actions: Theme Toggle, Notifications, User Status & Logout */}
        <div className="nav-actions">
          {/* Notifications Bell with Dropdown */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen(!notifOpen)
                if (!notifOpen && unreadCount > 0) {
                  markAllAsRead()
                }
              }}
              style={{
                height: '38px',
                width: '38px',
                borderRadius: 'var(--radius-md)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              id="nav-notifications-btn"
              title="Notifications"
              aria-label="View notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '1px 5px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    border: '2px solid var(--bg-card)',
                    lineHeight: '1.2',
                  }}
                  id="notifications-badge-count"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '330px',
                  maxWidth: '90vw',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  backdropFilter: 'blur(16px)',
                }}
                id="notifications-dropdown-menu"
              >
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearNotifications}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.1rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        lineHeight: 1,
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.06)',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Light / Dark Mode Toggle Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            id="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle light and dark theme"
          >
            <span className="theme-icon" style={{ fontSize: '0.95rem', lineHeight: 1 }}>
              {theme === 'dark' ? '☼' : '☾'}
            </span>
            <span className="theme-text" style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1 }}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* Authentication Actions */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* User Profile Pill */}
              <Link
                to="/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: '38px',
                  padding: '0 0.85rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
                id="nav-user-info"
                title="View candidate profile"
              >
                {navAvatar ? (
                  <img
                    src={navAvatar}
                    alt={user?.name || 'User avatar'}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                    id="nav-user-avatar-img"
                  />
                ) : (
                  <span>👤</span>
                )}
                <span id="nav-user-name">{user?.name || (hasAdminRole ? 'Admin User' : 'Candidate')}</span>
              </Link>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="btn btn-outline btn-sm"
                id="nav-logout-btn"
                style={{
                  height: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 1rem',
                  boxSizing: 'border-box',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" id="nav-login-btn">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="nav-register-btn">
                Register
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            id="nav-mobile-toggle"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Dialogue Box */}
      <SignoutConfirmModal
        isOpen={showSignoutModal}
        userName={user?.name}
        onConfirm={handleLogout}
        onCancel={() => setShowSignoutModal(false)}
      />
    </header>
  )
}

export default Navbar