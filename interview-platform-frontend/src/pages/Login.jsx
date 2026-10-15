import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import { authApi } from '../api/authApi'
import logoDark from '../assets/logo-dark.svg'
import logoLight from '../assets/logo-light.svg'

export function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const { showToast } = useNotification()
  const logo = theme === 'dark' ? logoDark : logoLight

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || '',
    password: '',
  })

  // Mode: 'login' | 'reset-request' | 'reset-confirm'
  const [authMode, setAuthMode] = useState('login')

  // Password reset state
  const [resetData, setResetData] = useState({
    email: '',
    resetToken: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [validationErrors, setValidationErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Clear incoming message or update when route state changes
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage)
    }
  }, [location.state])

  // When user logs in or is already authenticated, always redirect cleanly to target or /dashboard
  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      const searchParams = new URLSearchParams(location.search)
      const redirectQuery = searchParams.get('redirect')
      const fromPath = location.state?.from?.pathname || redirectQuery
      const destination = (fromPath && fromPath !== '/' && fromPath !== '/login') ? fromPath : '/dashboard'
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, isSubmitting, location.state, location.search, navigate])

  const validateField = (field, value, allValues = formData) => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address'
        }
        return ''
      case 'password':
        if (!value) return 'Password is required'
        return ''
      case 'resetToken': {
        const cleaned = value.trim().replace(/^G-?/i, '')
        if (!cleaned) return 'Verification code is required'
        if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) {
          return 'Verification code must be 6 digits (e.g. G-123456 or 123456)'
        }
        return ''
      }
      case 'newPassword':
        if (!value) return 'New password is required'
        if (value.length < 8) return 'Password must be at least 8 characters long'
        return ''
      case 'confirmPassword':
        if (!value) return 'Please confirm your new password'
        if (value !== allValues.newPassword) return 'Passwords do not match'
        return ''
      default:
        return ''
    }
  }

  const validateLoginForm = () => {
    const errors = {}
    const emailErr = validateField('email', formData.email)
    if (emailErr) errors.email = emailErr

    const passErr = validateField('password', formData.password)
    if (passErr) errors.password = passErr

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLoginChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (apiError) setApiError('')

    // Clear or update validation error dynamically if one was already triggered
    if (validationErrors[name]) {
      const fieldError = validateField(name, value)
      setValidationErrors((prev) => ({ ...prev, [name]: fieldError }))
    }
  }

  const handleLoginBlur = (e) => {
    const { name, value } = e.target
    if (value && value.trim()) {
      const fieldError = validateField(name, value)
      if (fieldError) {
        setValidationErrors((prev) => ({ ...prev, [name]: fieldError }))
      }
    }
  }

  const handleResetChange = (e) => {
    const { name, value } = e.target
    const updated = { ...resetData, [name]: value }
    setResetData(updated)
    if (apiError) setApiError('')

    const fieldError = validateField(name, value, updated)
    setValidationErrors((prev) => ({ ...prev, [name]: fieldError }))
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    if (!validateLoginForm()) return

    setIsSubmitting(true)
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      await login(payload)

      showToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'Successfully logged in to InterviewHub.',
      })

      // Clean redirect to target or /dashboard upon login
      const searchParams = new URLSearchParams(location.search)
      const redirectQuery = searchParams.get('redirect')
      const fromPath = location.state?.from?.pathname || redirectQuery
      const destination = (fromPath && fromPath !== '/' && fromPath !== '/login') ? fromPath : '/dashboard'
      navigate(destination, { replace: true })
    } catch (err) {
      console.error('[InterviewHub Login] Authentication failed:', err.message)
      const serverMessage = err.message || 'Invalid email or password. Please try again.'
      setApiError(serverMessage)
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        message: serverMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password Reset: Step 1 - Request OTP code to email
  const handleRequestResetCode = async (e) => {
    e.preventDefault()
    setApiError('')

    const emailErr = validateField('email', resetData.email)
    if (emailErr) {
      setValidationErrors({ email: emailErr })
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.forgotPassword(resetData.email.trim().toLowerCase())

      showToast({
        type: 'success',
        title: 'Verification Code Sent',
        message: `A Google-format verification code (valid for 10 minutes) was sent to ${resetData.email}.`,
      })

      setSuccessMessage(`Google-format verification code sent to ${resetData.email} (valid for 10 minutes). Enter it below with your new password.`)
      setAuthMode('reset-confirm')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send password reset email. Please try again.'
      setApiError(msg)
      showToast({
        type: 'error',
        title: 'Reset Request Failed',
        message: msg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password Reset: Step 2 - Verify OTP & Set New Password
  const handleConfirmResetPassword = async (e) => {
    e.preventDefault()
    setApiError('')

    const errors = {}
    const tokenErr = validateField('resetToken', resetData.resetToken)
    if (tokenErr) errors.resetToken = tokenErr

    const newPassErr = validateField('newPassword', resetData.newPassword)
    if (newPassErr) errors.newPassword = newPassErr

    const confirmErr = validateField('confirmPassword', resetData.confirmPassword, resetData)
    if (confirmErr) errors.confirmPassword = confirmErr

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const cleanToken = resetData.resetToken.trim().replace(/^G-?/i, '')
      const payload = {
        email: resetData.email.trim().toLowerCase(),
        resetToken: cleanToken,
        newPassword: resetData.newPassword,
      }

      await authApi.resetPassword(payload)

      showToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been successfully reset! You can now log in.',
      })

      setSuccessMessage('Password reset successfully! Please log in with your new password.')
      setFormData((prev) => ({ ...prev, email: resetData.email, password: '' }))
      setAuthMode('login')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please check your verification code.'
      setApiError(msg)
      showToast({
        type: 'error',
        title: 'Password Reset Error',
        message: msg,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openResetMode = () => {
    setApiError('')
    setValidationErrors({})
    setResetData({
      email: formData.email || '',
      resetToken: '',
      newPassword: '',
      confirmPassword: '',
    })
    setAuthMode('reset-request')
  }

  return (
    <div className="auth-page-wrapper" id="login-page">
      {/* Google Luxury Radiant Aurora Glows */}
      <div className="auth-ambient-glow-1" aria-hidden="true"></div>
      <div className="auth-ambient-glow-2" aria-hidden="true"></div>
      <div className="auth-luxury-container">
        {/* Prominent Centered Brand Logo ("in between") */}
        <div className="auth-centered-brand-header">
          <Link to="/" id="login-brand-logo" className="auth-brand-link" title="InterviewHub Home">
            <img
              src={logo}
              alt="Interview Hub - connect.prep.grow"
              id="app-auth-logo"
              className="auth-brand-logo"
            />
          </Link>
          <p className="auth-brand-tagline">
            Empowering engineers with authentic interview insights, round debriefs & preparation loops
          </p>
        </div>

        {/* Balanced Grid: Eliminating Empty Void on Left & Right */}
        <div className="auth-grid-layout">
          {/* Left Column: Platform Highlights & Trust Pillars */}
          <div className="auth-showcase-panel">
            <div className="auth-showcase-badge">
            </div>

            <h2 className="auth-showcase-title">
              Crack Top Tech Interviews With Insider Knowledge
            </h2>

            <p className="auth-showcase-description">
              Dive into authentic round-by-round experiences shared by candidates who interviewed at Tier-1 companies. Learn what questions they faced and how they solved them.
            </p>

            <div className="auth-benefits-list">
              <div className="auth-benefit-card float-card-1">
                <div className="auth-benefit-icon">🏢</div>
                <div className="auth-benefit-content">
                  <h4>Top Tier Company Loops</h4>
                  <p>In-depth interview loops from Uber, Amazon AWS, Google, and high-growth tech teams.</p>
                </div>
              </div>

              <div className="auth-benefit-card float-card-2">
                <div className="auth-benefit-icon">🎯</div>
                <div className="auth-benefit-content">
                  <h4>Exact Questions & Solutions</h4>
                  <p>Real DSA problems, distributed system architectures, and behavioral questions.</p>
                </div>
              </div>

              <div className="auth-benefit-card float-card-3">
                <div className="auth-benefit-icon">🔒</div>
                <div className="auth-benefit-content">
                  <h4>Secure & Community Driven</h4>
                  <p>Verified candidate reports with zero noise. Free and confidential for every engineer.</p>
                </div>
              </div>
            </div>

            </div>

          {/* Right Column: Sign In Form Card */}
          <div className="auth-card-container">
            <div className="card auth-main-card">
              {/* Iridescent Accent Bar */}
              <div className="auth-card-accent-bar" aria-hidden="true"></div>
              <div className="auth-card-header">
                <h3 className="auth-card-title">
                  {authMode === 'login' && 'Welcome Back'}
                  {authMode === 'reset-request' && 'Reset Password'}
                  {authMode === 'reset-confirm' && 'Set New Password'}
                </h3>
                <p className="auth-card-subtitle">
                  {authMode === 'login' && 'Sign in to access your dashboard, shared experiences, and rounds'}
                  {authMode === 'reset-request' && 'Enter your registered email to receive a 6-digit recovery code'}
                  {authMode === 'reset-confirm' && 'Enter the verification code sent to your email to create a new password'}
                </p>
              </div>

              {/* Success Notification Banner */}
              {successMessage && (
                <div
                  id="login-success-banner"
                  className="auth-alert-banner success"
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-success-bg, rgba(16, 185, 129, 0.1))',
                    border: '1px solid var(--color-success-border, rgba(16, 185, 129, 0.3))',
                    color: 'var(--color-success, #10b981)',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✓</span>
                  <div style={{ flex: 1 }}>{successMessage}</div>
                </div>
              )}

              {/* API Error Banner */}
              {apiError && (
                <div
                  id="login-error-banner"
                  className="auth-alert-banner danger"
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-danger-bg, rgba(239, 68, 68, 0.1))',
                    border: '1px solid var(--color-danger-border, rgba(239, 68, 68, 0.3))',
                    color: 'var(--color-danger, #ef4444)',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <strong>Notice:</strong>
                    <div style={{ marginTop: '0.2rem' }}>{apiError}</div>
                  </div>
                </div>
              )}

              {/* MODE 1: Standard Login Form */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} noValidate id="login-form">
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    id="login-email"
                    value={formData.email}
                    onChange={handleLoginChange}
                    error={validationErrors.email}
                    disabled={isSubmitting}
                    required
                  />

                  <div style={{ position: 'relative' }}>
                    <Input
                      label="Password"
                      type="password"
                      name="password"
                      id="login-password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleLoginChange}
                      error={validationErrors.password}
                      disabled={isSubmitting}
                      required
                    />
                    {/* Reset Password Button / Link */}
                    <div style={{ textAlign: 'right', marginTop: '-0.25rem', marginBottom: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={openResetMode}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--brand-primary)',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'none',
                        }}
                        id="login-forgot-password-btn"
                      >
                        Forgot Password? Reset here
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    className="auth-luxury-submit-btn" id="login-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing In...' : 'Login'}
                  </Button>

                  <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                      Create Account
                    </Link>
                  </p>
                </form>
              )}

              {/* MODE 2: Reset Request - Send OTP to email */}
              {authMode === 'reset-request' && (
                <form onSubmit={handleRequestResetCode} noValidate id="forgot-password-form">
                  <Input
                    label="Registered Account Email"
                    type="email"
                    name="email"
                    id="reset-request-email"
                    value={resetData.email}
                    onChange={handleResetChange}
                    error={validationErrors.email}
                    disabled={isSubmitting}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    style={{ width: '100%', marginTop: '1rem' }}
                    id="reset-request-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending Verification Code...' : 'Send Reset Code to Email'}
                  </Button>

                  <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setApiError('')
                        setValidationErrors({})
                        setAuthMode('login')
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      id="back-to-login-btn"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: Reset Confirm - Enter OTP & New Password */}
              {authMode === 'reset-confirm' && (
                <form onSubmit={handleConfirmResetPassword} noValidate id="reset-password-confirm-form">
                  <Input
                    label="Verification Code (Google Format)"
                    type="text"
                    name="resetToken"
                    id="reset-confirm-token"
                    placeholder="e.g. G-482910 or 482910"
                    helperText="Standard Google format (G-XXXXXX or 6 digits), valid for 10 minutes"
                    value={resetData.resetToken}
                    onChange={handleResetChange}
                    error={validationErrors.resetToken}
                    disabled={isSubmitting}
                    maxLength={8}
                    required
                  />

                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    id="reset-confirm-new-password"
                    placeholder="Minimum 8 characters"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    error={validationErrors.newPassword}
                    disabled={isSubmitting}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    id="reset-confirm-confirm-password"
                    placeholder="Re-enter new password"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    error={validationErrors.confirmPassword}
                    disabled={isSubmitting}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    style={{ width: '100%', marginTop: '1rem' }}
                    id="reset-password-save-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password & Login'}
                  </Button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setAuthMode('reset-request')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brand-primary)',
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Resend Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setApiError('')
                        setValidationErrors({})
                        setAuthMode('login')
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
