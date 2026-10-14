import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import companyApi from '../api/companyApi'
import experienceApi from '../api/experienceApi'
import ExperienceCard from '../components/experience/ExperienceCard'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import { getCompanyBrand } from '../utils/companyBrands'

export function Home() {
  const { user, isAdmin } = useAuth()
  const hasAdminRole = isAdmin || user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'
  // Popular Companies State
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companiesError, setCompaniesError] = useState(null)

  // Latest Experiences State
  const [experiences, setExperiences] = useState([])
  const [loadingExperiences, setLoadingExperiences] = useState(true)
  const [experiencesError, setExperiencesError] = useState(null)

  // Fetch Companies from Spring Boot GET /api/v1/companies
  const fetchCompanies = async () => {
    setLoadingCompanies(true)
    setCompaniesError(null)
    try {
      const response = await companyApi.getCompanies()
      const data = response.data || response || []
      // Display up to 6 popular companies on the landing page
      setCompanies(Array.isArray(data) ? data.slice(0, 6) : [])
    } catch (err) {
      console.error('[Home] Failed to load companies from backend:', err.message)
      setCompaniesError(err.message || 'Failed to load popular companies.')
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Fetch Latest Experiences from Spring Boot GET /api/v1/experiences?page=0&size=6&sort=createdAt,desc
  const fetchExperiences = async () => {
    setLoadingExperiences(true)
    setExperiencesError(null)
    try {
      const response = await experienceApi.getExperiences({
        page: 0,
        size: 6,
        sort: 'createdAt,desc',
      })
      const pageData = response.data || response || {}
      const items = pageData.content || (Array.isArray(pageData) ? pageData : [])
      setExperiences(items)
    } catch (err) {
      console.error('[Home] Failed to load experiences from backend:', err.message)
      setExperiencesError(err.message || 'Failed to load recent interview experiences.')
    } finally {
      setLoadingExperiences(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
    fetchExperiences()
  }, [])

  return (
    <div id="home-page">
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="hero-pill" id="hero-badge" style={{ margin: '0 auto 1.5rem auto' }}>
            <span>⚡</span>
            <span>Developer-Led Interview Knowledge Platform</span>
          </div>

          <h1 className="hero-title" id="hero-title">
            Real Interview Experiences <br />
            <span style={{ color: 'var(--brand-primary)' }}>From Real Candidates</span>
          </h1>

          <p className="hero-description" id="hero-subtitle">
            Learn from real interviews, discover actual questions, and prepare smarter.
          </p>

          <div className="hero-buttons">
            <Link to="/experiences" className="btn btn-primary btn-lg" id="hero-cta-explore">
              Explore Experiences
            </Link>
            {hasAdminRole ? (
              <Link to="/admin" className="btn btn-secondary btn-lg" id="hero-cta-admin">
                Admin Console
              </Link>
            ) : (
              <Link to="/create-experience" className="btn btn-secondary btn-lg" id="hero-cta-share">
                Share Your Experience
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Popular Companies Section */}
      <section className="section section-light" id="popular-companies-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Companies</h2>
            <p className="section-subtitle">
              Explore real candidate rounds and interview feedback from leading tech enterprises
            </p>
          </div>

          {/* Loading State */}
          {loadingCompanies && (
            <Loading message="Loading popular companies from backend..." />
          )}

          {/* Error State */}
          {!loadingCompanies && companiesError && (
            <ErrorMessage
              message={companiesError}
              onRetry={fetchCompanies}
            />
          )}

          {/* Empty State */}
          {!loadingCompanies && !companiesError && companies.length === 0 && (
            <EmptyState
              icon="🏢"
              title="No companies found"
              description="No registered companies found in the database yet."
            />
          )}

          {/* Company Cards Grid */}
          {!loadingCompanies && !companiesError && companies.length > 0 && (
            <div className="grid-cards" id="popular-companies-grid">
              {companies.map((rawCompany) => {
                const company = getCompanyBrand(rawCompany)
                return (
                  <article
                    key={company.id}
                    className="card"
                    id={`company-card-${company.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '1.75rem',
                      borderRadius: 'var(--radius-lg)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                          padding: '4px',
                        }}
                      >
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={`${company.name} logo`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 800, color: company.brandColor || 'var(--brand-primary)' }}>
                            {company.name ? company.name.charAt(0).toUpperCase() : '🏢'}
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            margin: 0,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {company.name}
                        </h3>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--brand-primary)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <span>🔗</span>
                            <span>{company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {company.tagline && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: 'var(--brand-primary)',
                          marginBottom: '0.5rem',
                          fontStyle: 'italic',
                        }}
                      >
                        "{company.tagline}"
                      </div>
                    )}

                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.55,
                        marginBottom: '1.25rem',
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {company.description || 'Leading technology company hiring engineers and designers across teams.'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.85rem',
                        borderTop: '1px solid var(--border-subtle)',
                        marginTop: 'auto',
                      }}
                    >
                      <Link
                        to={`/companies/${company.id}`}
                        className="btn btn-sm btn-outline"
                        id={`view-company-btn-${company.id}`}
                        style={{ width: '100%', textAlign: 'center' }}
                      >
                        View Interviews →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {!loadingCompanies && !companiesError && companies.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link to="/companies" className="btn btn-secondary" id="btn-all-companies">
                View All Companies →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Latest Experiences Section */}
      <section className="section" id="latest-experiences-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Latest Experiences</h2>
            <p className="section-subtitle">
              Fresh candidate insights, round breakdowns, and preparation advice updated daily
            </p>
          </div>

          {/* Loading State */}
          {loadingExperiences && (
            <Loading message="Loading latest interview experiences..." />
          )}

          {/* Error State */}
          {!loadingExperiences && experiencesError && (
            <ErrorMessage
              message={experiencesError}
              onRetry={fetchExperiences}
            />
          )}

          {/* Empty State */}
          {!loadingExperiences && !experiencesError && experiences.length === 0 && (
            <EmptyState
              icon="📝"
              title="No experiences shared yet"
              description="Be the first candidate to share your technical interview journey!"
              action={!hasAdminRole ? (
                <Link to="/create-experience" className="btn btn-primary" id="empty-state-share-btn">
                  Share Experience
                </Link>
              ) : null}
            />
          )}

          {/* Experiences Grid */}
          {!loadingExperiences && !experiencesError && experiences.length > 0 && (
            <div className="grid-cards" id="latest-experiences-grid">
              {experiences.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))}
            </div>
          )}

          {!loadingExperiences && !experiencesError && experiences.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link to="/experiences" className="btn btn-secondary" id="btn-browse-all-experiences">
                Browse All Experiences →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why InterviewHub Section */}
      <section className="section section-light" id="why-interviewhub-section" style={{ padding: "4.5rem 0" }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why InterviewHub?</h2>
            <p className="section-subtitle">
              Everything you need to prepare for real-world technical interviews and land your target role
            </p>
          </div>

          <div className="grid-cards" id="why-interviewhub-grid">
            <div className="card" style={{ padding: '2rem' }} id="why-card-experiences">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📖</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Real Interview Experiences
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Read authentic, unedited walkthroughs from actual candidates across engineering, product, and design roles. Understand round structures, interview timelines, interviewer styles, and clear outcome reflections.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }} id="why-card-questions">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💡</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Actual Interview Questions
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Discover the actual coding challenges, system design problems, algorithms, and behavioral scenarios asked by top tech teams during live rounds, with preparation context and sample solutions.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }} id="why-card-community">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤝</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Community-Driven Preparation
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Powered by a collaborative community of developers paying it forward. Compare difficulty ratings, discover proven preparation tips, and gain the confidence to ace your next technical hiring loop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section" style={{ textAlign: "center", padding: "4.5rem 0", marginTop: "1.5rem" }}>
        <div className="container" style={{ maxWidth: '780px' }}>
          <div
            className="card"
            style={{
              padding: '3.5rem 2rem',
              backgroundColor: 'var(--brand-light)',
              borderColor: 'var(--brand-light-border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Ready to Share Your Interview Journey?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Whether you landed the offer or gained valuable lessons, your experience helps fellow engineers prepare with clarity and confidence.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {hasAdminRole ? (
                <Link to="/admin" className="btn btn-primary btn-lg" id="bottom-cta-share">
                  Admin Dashboard →
                </Link>
              ) : (
                <Link to="/create-experience" className="btn btn-primary btn-lg" id="bottom-cta-share">
                  Share Your Experience
                </Link>
              )}
              <Link to="/register" className="btn btn-secondary btn-lg" id="bottom-cta-register">
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
