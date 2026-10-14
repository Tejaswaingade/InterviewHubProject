import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'
import logoDark from '../assets/logo-dark.svg'
import logoLight from '../assets/logo-light.svg'

export function Register() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const { showToast } = useNotification()
  const logo = theme === 'dark' ? logoDark : logoLight

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [validationErrors, setValidationErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const validateField = (field, value, allData = formData) => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required'
        return ''
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address'
        }
        return ''
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) {
          return 'Password must be at least 8 characters long'
        }
        return ''
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== allData.password) {
          return 'Passwords do not match'
        }
        return ''
      default:
        return ''
    }
  }

  const validateForm = () => {
    const errors = {}
    const nameErr = validateField('name', formData.name)
    if (nameErr) errors.name = nameErr

    const emailErr = validateField('email', formData.email)
    if (emailErr) errors.email = emailErr

    const passErr = validateField('password', formData.password)
    if (passErr) errors.password = passErr

    const confirmErr = validateField('confirmPassword', formData.confirmPassword, formData)
    if (confirmErr) errors.confirmPassword = confirmErr

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updatedForm = { ...formData, [name]: value }
    setFormData(updatedForm)

    if (apiError) setApiError('')

    const fieldError = validateField(name, value, updatedForm)
    setValidationErrors((prev) => ({
      ...prev,
      [name]: fieldError,
      ...(name === 'password' && updatedForm.confirmPassword
        ? { confirmPassword: validateField('confirmPassword', updatedForm.confirmPassword, updatedForm) }
        : {}),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      await register(payload)

      showToast({
        type: 'success',
        title: 'Welcome to InterviewHub! 🎉',
        message: 'Account created successfully! A welcome confirmation email has been dispatched to your inbox.',
      })

      // Redirect to /login with success message and prefilled email
      navigate('/login', {
        state: {
          successMessage: 'Account created successfully! A welcome email was sent to your inbox. Please sign in.',
          registeredEmail: payload.email,
        },
      })
    } catch (err) {
      console.error('[InterviewHub Register] Registration failed:', err.message)
      const serverMessage = err.message || 'Registration failed. Please try again.'
      setApiError(serverMessage)

      if (err.errors && typeof err.errors === 'object') {
        setValidationErrors((prev) => ({
          ...prev,
          ...err.errors,
        }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-page-wrapper" id="register-page">
      {/* Google Luxury Radiant Aurora Glows */}
      <div className="auth-ambient-glow-1" aria-hidden="true"></div>
      <div className="auth-ambient-glow-2" aria-hidden="true"></div>
      <div className="auth-luxury-container">
        {/* Prominent Centered Brand Logo ("in between") */}
        <div className="auth-centered-brand-header">
          <Link to="/" id="register-brand-logo" className="auth-brand-link" title="InterviewHub Home">
            <img
              src={logo}
              alt="Interview Hub - connect.prep.grow"
              id="app-auth-logo"
              className="auth-brand-logo"
            />
          </Link>
          <p className="auth-brand-tagline">
            Join the engineer-driven platform for real interview rounds, questions & preparation loops
          </p>
        </div>

        {/* Balanced Grid: Eliminating Empty Space on Left & Right */}
        <div className="auth-grid-layout">
          {/* Left Column: Platform Highlights & Community Values */}
          <div className="auth-showcase-panel">
            <div className="auth-showcase-badge">
              <span className="auth-badge-dot"></span>
              <span>Join 100% Free Forever</span>
            </div>

            <h2 className="auth-showcase-title">
              Level Up Your Career With Authentic Experiences
            </h2>

            <p className="auth-showcase-description">
              Create your candidate profile to track your interview rounds, bookmark questions, share verified loops, and connect with peers prepping for the same companies.
            </p>

            <div className="auth-benefits-list">
              <div className="auth-benefit-card float-card-1">
                <div className="auth-benefit-icon">🚀</div>
                <div className="auth-benefit-content">
                  <h4>Personal Dashboard</h4>
                  <p>Organize all your experiences, upcoming technical rounds, and practice questions in one place.</p>
                </div>
              </div>

              <div className="auth-benefit-card float-card-2">
                <div className="auth-benefit-icon">💬</div>
                <div className="auth-benefit-content">
                  <h4>Candidate Discussions</h4>
                  <p>Participate in live discussions and ask questions about interview formats and expectations.</p>
                </div>
              </div>

              <div className="auth-benefit-card float-card-3">
                <div className="auth-benefit-icon">🛡️</div>
                <div className="auth-benefit-content">
                  <h4>Privacy Guaranteed</h4>
                  <p>Choose whether to share publicly or keep your company applications private and confidential.</p>
                </div>
              </div>
            </div>

            </div>

          {/* Right Column: Register Form Card */}
          <div className="auth-card-container">
            <div className="card auth-main-card">
              {/* Iridescent Accent Bar */}
              <div className="auth-card-accent-bar" aria-hidden="true"></div>
              <div className="auth-card-header">
                <h3 className="auth-card-title">Create Free Account</h3>
                <p className="auth-card-subtitle">
                  Join Interview Hub to view, manage, and share interview loops
                </p>
              </div>

              {/* API Error Banner */}
              {apiError && (
                <div
                  id="register-error-banner"
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
                    <strong>Registration Notice:</strong>
                    <div style={{ marginTop: '0.2rem' }}>{apiError}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate id="register-form">
                <Input
                  label="Name"
                  type="text"
                  name="name"
                  id="register-name"
                  placeholder="e.g. Alex Chen"
                  value={formData.name}
                  onChange={handleChange}
                  error={validationErrors.name}
                  disabled={isSubmitting}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  id="register-email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={validationErrors.email}
                  disabled={isSubmitting}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  id="register-password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  error={validationErrors.password}
                  disabled={isSubmitting}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  id="register-confirm-password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={validationErrors.confirmPassword}
                  disabled={isSubmitting}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  className="auth-luxury-submit-btn" id="register-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                    Sign In
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
