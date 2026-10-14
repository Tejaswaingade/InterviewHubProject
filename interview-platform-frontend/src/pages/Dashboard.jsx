import DeleteConfirmModal from '../components/common/DeleteConfirmModal'
import React, { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import experienceApi from '../api/experienceApi'
import roundApi from '../api/roundApi'
import questionApi from '../api/questionApi'
import ExperienceCard from '../components/experience/ExperienceCard'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'

export function Dashboard() {
  const { user, isAdmin } = useAuth()
  const hasAdminRole = isAdmin || user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'

  const [experiences, setExperiences] = useState([])
  const [totalRounds, setTotalRounds] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [userRounds, setUserRounds] = useState([])
  const [userQuestions, setUserQuestions] = useState([])
  const [activeTab, setActiveTab] = useState('experiences') // 'experiences' | 'rounds' | 'questions'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Delete experience confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingExperience, setDeletingExperience] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Fetch user's experiences and aggregate counts
  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true)
      setError(null)
    }

    try {
      // 1. Fetch user's experiences: GET /api/experiences/my
      const res = await experienceApi.getMyExperiences({ page: 0, size: 50, sort: 'createdAt,desc' })
      const data = res.data || res || {}
      const items = Array.isArray(data) ? data : data.content || []
      setExperiences(items)

      // 2. Aggregate statistics: calculate total rounds and total questions across user's experiences
      const collectedRounds = []
      const collectedQuestions = []

      if (items.length > 0) {
        // Fetch rounds in parallel for all user's experiences
        const roundsResults = await Promise.allSettled(
          items.map((exp) => roundApi.getRounds(exp.id))
        )

        roundsResults.forEach((rRes, idx) => {
          if (rRes.status === 'fulfilled') {
            const raw = rRes.value.data || rRes.value || []
            const exp = items[idx]
            if (Array.isArray(raw)) {
              raw.forEach((r) => {
                collectedRounds.push({
                  ...r,
                  expId: exp.id,
                  expTitle: exp.experienceTitle,
                  companyName: exp.company?.name || exp.companyName || 'Company',
                  jobRole: exp.jobRole || 'Role',
                })
              })
            }
          }
        })

        // Fetch questions in parallel for all collected rounds
        if (collectedRounds.length > 0) {
          const questionsResults = await Promise.allSettled(
            collectedRounds.map((rnd) => questionApi.getQuestions(rnd.id))
          )
          questionsResults.forEach((qRes, idx) => {
            if (qRes.status === 'fulfilled') {
              const raw = qRes.value.data || qRes.value || []
              const rnd = collectedRounds[idx]
              if (Array.isArray(raw)) {
                raw.forEach((q) => {
                  collectedQuestions.push({
                    ...q,
                    roundId: rnd.id,
                    roundName: rnd.roundName,
                    expId: rnd.expId,
                    expTitle: rnd.expTitle,
                    companyName: rnd.companyName,
                  })
                })
              }
            }
          })
        }
      }

      setUserRounds(collectedRounds)
      setUserQuestions(collectedQuestions)
      setTotalRounds(collectedRounds.length)
      setTotalQuestions(collectedQuestions.length)
    } catch (err) {
      console.error('[Dashboard] Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load your dashboard experiences. Please try again.')
    } finally {
      if (!isSilent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Smooth scroll and tab redirect handler
  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey)
    const sectionEl = document.getElementById('my-experiences-section')
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Delete Experience Handler
  const handleDeleteClick = (exp) => {
    setDeletingExperience(exp)
    setDeleteError(null)
    setShowDeleteModal(true)
  }

  // Delete Experience Confirmation Handler
  const handleConfirmDelete = async () => {
    if (!deletingExperience) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await experienceApi.deleteExperience(deletingExperience.id)
      setShowDeleteModal(false)
      setDeletingExperience(null)
      await loadDashboardData(true)
    } catch (err) {
      console.error('[Dashboard] Error deleting experience:', err)
      setDeleteError(err.message || 'Failed to delete interview experience.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (hasAdminRole) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="container section" id="dashboard-page">
      {/* HEADER: Welcome, {user.name} */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
            id="dashboard-welcome-heading"
          >
            Welcome, {user?.name || 'Candidate'}
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              marginTop: '0.35rem',
              marginBottom: 0,
            }}
          >
            Manage your shared interview experiences, rounds, and candidate questions.
          </p>
        </div>

        {!isAdmin && (
        <Link to="/create-experience" className="btn btn-primary" id="dashboard-share-btn">
          ➕ Share Your Experience
        </Link>
      )}
      </div>

      {/* STATISTICS CARDS - Clickable, Responsive & Interactive */}
      <div
        className="grid-cards"
        id="dashboard-stats-grid"
      >
        {/* Stat 1: My Experiences */}
        <div
          className={`card dashboard-stat-card ${activeTab === 'experiences' ? 'active-stat-card' : ''}`}
          id="stat-my-experiences"
          role="button"
          tabIndex={0}
          onClick={() => handleSelectTab('experiences')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectTab('experiences')}
          style={{
            borderColor: activeTab === 'experiences' ? 'var(--brand-primary)' : 'var(--border-card)',
            boxShadow: activeTab === 'experiences' ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'var(--shadow-sm)',
          }}
          title="Click to view your experiences"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.35rem' }}>📝</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                My Experiences
              </span>
            </div>
            <span
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                color: 'var(--brand-primary)',
                display: 'block',
              }}
              id="stat-experiences-count"
            >
              {experiences.length}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.785rem',
              color: 'var(--brand-primary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.75rem',
            }}
          >
            <span>View Experiences</span>
            <span>↓</span>
          </div>
        </div>

        {/* Stat 2: Total Rounds */}
        <div
          className={`card dashboard-stat-card ${activeTab === 'rounds' ? 'active-stat-card' : ''}`}
          id="stat-total-rounds"
          role="button"
          tabIndex={0}
          onClick={() => handleSelectTab('rounds')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectTab('rounds')}
          style={{
            borderColor: activeTab === 'rounds' ? '#8b5cf6' : 'var(--border-card)',
            boxShadow: activeTab === 'rounds' ? '0 0 16px rgba(139, 92, 246, 0.25)' : 'var(--shadow-sm)',
          }}
          title="Click to view all interview rounds"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.35rem' }}>🎯</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total Rounds
              </span>
            </div>
            <span
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                color: '#8b5cf6',
                display: 'block',
              }}
              id="stat-rounds-count"
            >
              {totalRounds}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.785rem',
              color: '#8b5cf6',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.75rem',
            }}
          >
            <span>View All Rounds</span>
            <span>↓</span>
          </div>
        </div>

        {/* Stat 3: Total Questions */}
        <div
          className={`card dashboard-stat-card ${activeTab === 'questions' ? 'active-stat-card' : ''}`}
          id="stat-total-questions"
          role="button"
          tabIndex={0}
          onClick={() => handleSelectTab('questions')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectTab('questions')}
          style={{
            borderColor: activeTab === 'questions' ? '#10b981' : 'var(--border-card)',
            boxShadow: activeTab === 'questions' ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'var(--shadow-sm)',
          }}
          title="Click to view all questions"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.35rem' }}>❓</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total Questions
              </span>
            </div>
            <span
              style={{
                fontSize: '2.25rem',
                fontWeight: 800,
                color: '#10b981',
                display: 'block',
              }}
              id="stat-questions-count"
            >
              {totalQuestions}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.785rem',
              color: '#10b981',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.75rem',
            }}
          >
            <span>View All Questions</span>
            <span>↓</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SECTION */}
      <section id="my-experiences-section" style={{ scrollMarginTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Section Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('experiences')}
              id="dashboard-tab-experiences"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                border: activeTab === 'experiences' ? '1px solid var(--brand-primary)' : '1px solid var(--border-medium)',
                backgroundColor: activeTab === 'experiences' ? 'var(--brand-light)' : 'var(--bg-card)',
                color: activeTab === 'experiences' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>📝</span>
              <span>My Experiences</span>
              <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)' }}>
                {experiences.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rounds')}
              id="dashboard-tab-rounds"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                border: activeTab === 'rounds' ? '1px solid #8b5cf6' : '1px solid var(--border-medium)',
                backgroundColor: activeTab === 'rounds' ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-card)',
                color: activeTab === 'rounds' ? '#a78bfa' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>🎯</span>
              <span>Total Rounds</span>
              <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)' }}>
                {totalRounds}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              id="dashboard-tab-questions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                border: activeTab === 'questions' ? '1px solid #10b981' : '1px solid var(--border-medium)',
                backgroundColor: activeTab === 'questions' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                color: activeTab === 'questions' ? '#34d399' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <span>❓</span>
              <span>Total Questions</span>
              <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)' }}>
                {totalQuestions}
              </span>
            </button>
          </div>

          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
            }}
            id="my-experiences-badge"
          >
            {activeTab === 'experiences' && `${experiences.length} ${experiences.length === 1 ? 'Experience' : 'Experiences'}`}
            {activeTab === 'rounds' && `${totalRounds} ${totalRounds === 1 ? 'Round' : 'Rounds'}`}
            {activeTab === 'questions' && `${totalQuestions} ${totalQuestions === 1 ? 'Question' : 'Questions'}`}
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ padding: '3rem 1rem' }} id="dashboard-loading">
            <Loading message="Loading your interview experiences and statistics..." />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{ padding: '2rem 1rem' }} id="dashboard-error">
            <ErrorMessage message={error} onRetry={() => loadDashboardData(false)} />
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && experiences.length === 0 && (
          <div id="dashboard-empty-state">
            <EmptyState
              icon="📝"
              title="You haven't shared an interview experience yet."
              description="Help other developers prepare by documenting your interview rounds, technical questions, and key preparation takeaways."
              action={
                !isAdmin ? (
                  <Link
                    to="/create-experience"
                    className="btn btn-primary"
                    id="btn-dashboard-share-empty"
                  >
                    Share Your Experience
                  </Link>
                ) : null
              }
            />
          </div>
        )}

        {/* VIEW 1: POPULATED EXPERIENCES GRID */}
        {!loading && !error && experiences.length > 0 && activeTab === 'experiences' && (
          <div
            id="my-experiences-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {experiences.map((exp) => (
              <ExperienceCard
                key={exp.id}
                experience={exp}
                showActions={true}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}

        {/* VIEW 2: INTERVIEW ROUNDS BREAKDOWN */}
        {!loading && !error && experiences.length > 0 && activeTab === 'rounds' && (
          <div
            id="my-rounds-grid"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {userRounds.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No rounds logged yet for your experiences.
              </div>
            ) : (
              userRounds.map((r, i) => (
                <div
                  key={r.id || i}
                  className="card"
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                        Round {r.roundNumber || i + 1}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {r.companyName} • {r.jobRole}
                      </span>
                      {r.difficulty && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: r.difficulty === 'HARD' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: r.difficulty === 'HARD' ? '#f87171' : '#fbbf24' }}>
                          {r.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem' }}>
                      {r.roundName}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {r.description || 'Comprehensive evaluation covering domain architecture and problem-solving.'}
                    </p>
                  </div>

                  <Link
                    to={`/experiences/${r.expId}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', flexShrink: 0 }}
                  >
                    View Experience →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW 3: QUESTIONS LOGGED BREAKDOWN */}
        {!loading && !error && experiences.length > 0 && activeTab === 'questions' && (
          <div
            id="my-questions-grid"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {userQuestions.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No questions logged yet for your rounds.
              </div>
            ) : (
              userQuestions.map((q, i) => (
                <div
                  key={q.id || i}
                  className="card"
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                        {q.topic || 'General'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                        {q.companyName} • {q.roundName}
                      </span>
                      {q.difficulty && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', backgroundColor: q.difficulty === 'HARD' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: q.difficulty === 'HARD' ? '#f87171' : '#fbbf24' }}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem' }}>
                      {q.questionText}
                    </h3>
                    {q.answer && (
                      <div
                        style={{
                          fontSize: '0.825rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.5rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md, 8px)',
                          backgroundColor: 'var(--bg-surface, rgba(0,0,0,0.2))',
                          border: '1px solid var(--border-subtle)',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong style={{ color: 'var(--text-secondary)' }}>Solution / Approach: </strong>
                        {q.answer}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/experiences/${q.expId}`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', flexShrink: 0 }}
                  >
                    View in Experience →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Delete Experience Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal && Boolean(deletingExperience)}
        title="Delete Interview Experience?"
        message="Are you sure you want to delete this interview experience?"
        itemName={deletingExperience ? `${deletingExperience.company?.name || 'Company'} (${deletingExperience.jobRole || 'Role'})` : ''}
        isDeleting={isDeleting}
        error={deleteError}
        confirmButtonText="Yes"
        cancelButtonText="No"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeletingExperience(null)
          setDeleteError(null)
        }}
        id="delete-experience-modal"
      />
    </div>
  )
}

export default Dashboard
