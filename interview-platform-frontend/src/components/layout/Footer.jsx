import logoDark from '../../assets/logo-dark.svg'
import logoLight from '../../assets/logo-light.svg'
import { useTheme } from '../../context/ThemeContext'
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function Footer() {
  const { isAuthenticated, user, logout } = useAuth()
  const { theme } = useTheme()
  const footerLogo = theme === 'dark' ? logoDark : logoLight
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState(null)

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveModal(null)
    }
    if (activeModal) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [activeModal])

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  // Modal content dictionary
  const modalContents = {
    prep: {
      title: '🎯 Interview Preparation Guidelines',
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
          <h4 style={{ color: 'var(--text-primary)', marginTop: 0 }}>1. Data Structures & Algorithms</h4>
          <p>
            Master core fundamentals: Arrays, HashMaps, Sliding Windows, Trees, Graphs (BFS/DFS), and Dynamic Programming. Practice articulating time and space complexities (Big-O) aloud as you write code.
          </p>
          <h4 style={{ color: 'var(--text-primary)' }}>2. System Design & Scalability</h4>
          <p>
            For mid to senior positions, structure design discussions methodically: clarify requirements and constraints, calculate rough scale (QPS, storage), draft high-level component diagrams, and drill down into bottlenecks (caching, database sharding, message queues).
          </p>
          <h4 style={{ color: 'var(--text-primary)' }}>3. Behavioral & STAR Method</h4>
          <p>
            Prepare stories using Situation, Task, Action, Result. Highlight leadership, navigating technical disagreements, learning from failures, and driving impact.
          </p>
        </div>
      ),
    },
    community: {
      title: '🤝 Community Standards & Code of Conduct',
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
          <p>
            InterviewHub is built on radical generosity and mutual respect. We exist to level the playing field for software engineering candidates worldwide.
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: '1rem 0' }}>
            <li><strong>Authenticity:</strong> Share real, personal interview accounts without embellished outcomes or NDA-violating internal proprietary code.</li>
            <li><strong>Constructiveness:</strong> Frame critical feedback about interview loops constructively, focusing on interviewer styles and process transparency.</li>
            <li><strong>Inclusivity:</strong> Zero tolerance for harassment, discrimination, or abusive comments across interview submissions and discussion boards.</li>
          </ul>
        </div>
      ),
    },
    privacy: {
      title: '🔒 Privacy Policy & Data Protection',
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
          <p>
            We respect your candidate privacy. We do not sell your personal information or contact details to recruiters or third-party advertisers.
          </p>
          <p>
            Your account credentials, hashed passwords, and authenticated session tokens are safeguarded with industry-standard bcrypt encryption and HTTPS transport encryption.
          </p>
        </div>
      ),
    },
    terms: {
      title: '📜 Terms of Service',
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
          <p>
            By using InterviewHub, you agree to submit truthful interview experiences and respect the intellectual property and confidentiality agreements of employers.
          </p>
          <p>
            InterviewHub reserves the right to moderate, edit, or remove submissions that violate community guidelines, contain hate speech, or leak confidential proprietary code.
          </p>
        </div>
      ),
    },
    security: {
      title: '🛡️ Security Architecture & Practices',
      body: (
        <div style={{ lineHeight: 1.7, fontSize: '0.925rem', color: 'var(--text-secondary)' }}>
          <p>
            InterviewHub enforces defense-in-depth security including authenticated Spring Boot REST endpoints, stateless JWT token authorization, SQL injection prevention via Hibernate JPA parameters, and role-based access controls for candidate moderation.
          </p>
        </div>
      ),
    },
  }

  const currentModal = activeModal ? modalContents[activeModal] : null

  return (
    <footer className="footer" id="app-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand">
            <Link
              to="/"
              className="brand-logo"
              style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '0.75rem' }}
            >
              <img
                src={footerLogo}
                alt="Interview Hub - connect.prep.grow"
                id="app-footer-logo"
                style={{
                  height: '48px',
                  width: 'auto',
                  maxWidth: '240px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </Link>
            <p>
              Learn from real interviews. Prepare with confidence. Empowering engineers to break into top tier technology companies.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="footer-heading">Platform</h4>
            <div className="footer-links">
              <Link to="/experiences" id="footer-link-experiences">Explore Experiences</Link>
              <Link to="/companies" id="footer-link-companies">Companies Directory</Link>
              <Link to="/create-experience" id="footer-link-share">Share an Experience</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="footer-heading">Resources</h4>
            <div className="footer-links">
              <Link to="/about" id="footer-link-about">About InterviewHub</Link>
              <button
                type="button"
                onClick={() => setActiveModal('prep')}
                className="footer-link-btn"
                id="footer-btn-prep-guide"
              >
                Preparation Guide
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('community')}
                className="footer-link-btn"
                id="footer-btn-community"
              >
                Community Standards
              </button>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=interviewhub21@gmail.com&su=Customer%20Support%20-%20InterviewHub&body=Hello%20InterviewHub%20Support,%0A%0AI%20have%20a%20query%20regarding:%0A"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link-btn"
                id="footer-link-customer-support"
                title="Customer Support (Redirects to Google Mail)"
              >
                Customer Support ↗
              </a>
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="footer-heading">Account</h4>
            <div className="footer-links">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" id="footer-link-profile">
                    Signed in as <strong>{user?.name?.split(' ')[0] || 'Candidate'}</strong>
                  </Link>
                  <Link to="/dashboard" id="footer-link-dashboard">Candidate Dashboard</Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="footer-link-btn"
                    id="footer-btn-signout"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" id="footer-link-login">Sign In</Link>
                  <Link to="/register" id="footer-link-register">Create Free Account</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-links">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=interviewhub21@gmail.com&su=InterviewHub%20Support%20Query&body=Hello%20InterviewHub%20Support%20Team,%0A%0AMy%20question/query:%0A"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link-btn"
              id="footer-link-mail-support"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--brand-primary)',
                fontWeight: 600,
              }}
              title="Reach out or type any query to customer support via Google Mail"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>interviewhub21@gmail.com</span>
            </a>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="footer-link-btn"
              id="footer-btn-privacy"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="footer-link-btn"
              id="footer-btn-terms"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('security')}
              className="footer-link-btn"
              id="footer-btn-security"
            >
              Security
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Interactive Footer Modal */}
      {activeModal && currentModal && (
        <div
          id="footer-modal-overlay"
          onClick={() => setActiveModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            className="card"
            id="footer-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '620px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem 2.25rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
                id="footer-modal-title"
              >
                {currentModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem 0.5rem',
                  lineHeight: 1,
                }}
                id="footer-modal-close"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div id="footer-modal-body" style={{ color: 'var(--text-primary)' }}>
              {currentModal.body}
            </div>

            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'right',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-primary btn-sm"
                id="footer-modal-close-btn"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default Footer
