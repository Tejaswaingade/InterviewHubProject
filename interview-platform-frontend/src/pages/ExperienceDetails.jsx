import DeleteConfirmModal from '../components/common/DeleteConfirmModal'
import CodeCompilerPlayground from '../components/compiler/CodeCompilerPlayground'
import CompanyLogo from '../components/common/CompanyLogo'
import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import experienceApi from '../api/experienceApi'
import roundApi from '../api/roundApi'
import questionApi from '../api/questionApi'
import bookmarkApi from '../api/bookmarkApi'
import RoundCard from '../components/round/RoundCard'
import RoundFormModal from '../components/round/RoundFormModal'
import QuestionFormModal from '../components/question/QuestionFormModal'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import { formatCompensation } from '../utils/formatters'


function extractCodeSolution(text) {
  if (!text) return { cleanDescription: text || '', codeSolution: null }
  const match = text.match(/<!-- INTERVIEWHUB_CODE_SOLUTION\n([\s\S]*?)\nEND_INTERVIEWHUB_CODE_SOLUTION -->/)
  if (match) {
    try {
      const codeSolution = JSON.parse(match[1])
      const cleanDescription = text.replace(/<!-- INTERVIEWHUB_CODE_SOLUTION\n[\s\S]*?\nEND_INTERVIEWHUB_CODE_SOLUTION -->/, '').trim()
      return { cleanDescription, codeSolution }
    } catch {
      return { cleanDescription: text, codeSolution: null }
    }
  }
  return { cleanDescription: text, codeSolution: null }
}

export function ExperienceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  // Data states
  const [experience, setExperience] = useState(null)
  const [roundsWithQuestions, setRoundsWithQuestions] = useState([])
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  // Experience deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Round modal states (Add / Edit)
  const [roundModalOpen, setRoundModalOpen] = useState(false)
  const [editingRound, setEditingRound] = useState(null)

  // Round deletion modal state
  const [deletingRound, setDeletingRound] = useState(null)
  const [showDeleteRoundModal, setShowDeleteRoundModal] = useState(false)
  const [isDeletingRound, setIsDeletingRound] = useState(false)
  const [deleteRoundError, setDeleteRoundError] = useState(null)

  // Question modal states (Add / Edit)
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [activeRoundForQuestion, setActiveRoundForQuestion] = useState(null)
  const [editingQuestion, setEditingQuestion] = useState(null)

  // Question deletion modal state
  const [deletingQuestion, setDeletingQuestion] = useState(null)
  const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false)
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false)
  const [deleteQuestionError, setDeleteQuestionError] = useState(null)

  // Load experience, its rounds, and questions per round
  const loadExperienceDetails = async (isSilentRefresh = false) => {
    if (!isSilentRefresh) {
      setLoading(true)
      setError(null)
      setNotFound(false)
    }

    try {
      // 1. Fetch experience by ID
      const expRes = await experienceApi.getExperienceById(id)
      const expData = expRes.data || expRes
      if (!expData || !expData.id) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setExperience(expData)

      // 2. Fetch rounds for this experience
      let roundsList = []
      try {
        const roundsRes = await roundApi.getRounds(id)
        const rawRounds = roundsRes.data || roundsRes || []
        roundsList = Array.isArray(rawRounds) ? rawRounds : []
      } catch (roundErr) {
        console.warn('[ExperienceDetails] Failed to load rounds:', roundErr.message)
      }

      // Sort rounds by roundNumber ascending
      roundsList.sort((a, b) => (a.roundNumber || 0) - (b.roundNumber || 0))

      // 3. For each round, fetch its questions in parallel
      const enrichedRounds = await Promise.all(
        roundsList.map(async (rnd) => {
          try {
            const qRes = await questionApi.getQuestions(rnd.id)
            const questions = qRes.data || qRes || []
            return {
              round: rnd,
              questions: Array.isArray(questions) ? questions : [],
            }
          } catch (qErr) {
            console.warn(`[ExperienceDetails] Failed to load questions for round ${rnd.id}:`, qErr.message)
            return { round: rnd, questions: [] }
          }
        })
      )

      setRoundsWithQuestions(enrichedRounds)
      if (isAuthenticated) {
        bookmarkApi.getBookmarkedIds().then((res) => {
          const ids = res.data?.data || res.data || []
          if (Array.isArray(ids) && ids.includes(Number(id))) {
            setIsBookmarked(true)
          }
        }).catch(() => {})
      }
    } catch (err) {
      console.error('[ExperienceDetails] Error loading experience:', err)
      if (err.status === 404 || (err.message && err.message.includes('404'))) {
        setNotFound(true)
      } else {
        setError(err.message || 'Failed to load interview experience details.')
      }
    } finally {
      if (!isSilentRefresh) {
        setLoading(false)
      }
    }
  }

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save experiences to your prep list.')
      return
    }

    setIsBookmarking(true)
    try {
      const res = await bookmarkApi.toggleBookmark(id)
      const data = res.data?.data || res.data
      setIsBookmarked(data.bookmarked ?? !isBookmarked)
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    } finally {
      setIsBookmarking(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadExperienceDetails()
    }
  }, [id, isAuthenticated])

  // Owner and Admin Controls Check
  const isOwner = Boolean(
    isAuthenticated &&
      user &&
      experience?.user &&
      (String(user.id) === String(experience.user.id) ||
        (user.email && experience.user.email && user.email.toLowerCase() === experience.user.email.toLowerCase()))
  )

  const isAdmin = Boolean(isAuthenticated && user && user.role === 'ADMIN')
  const canManage = isOwner || isAdmin
  // Candidates/owners can add rounds; administrators view & moderate but cannot add rounds
  const canAddRound = isOwner && !isAdmin

  

  // Round Creation & Update handler
  const handleSaveRound = async (roundFormData) => {
    if (editingRound) {
      await roundApi.updateRound(editingRound.id, roundFormData)
    } else {
      await roundApi.createRound(id, roundFormData)
    }
    await loadExperienceDetails(true)
  }

  

  // Question Creation & Update handler
  const handleSaveQuestion = async (questionFormData) => {
    if (editingQuestion) {
      await questionApi.updateQuestion(editingQuestion.id, questionFormData)
    } else if (activeRoundForQuestion) {
      await questionApi.createQuestion(activeRoundForQuestion.id, questionFormData)
    }
    await loadExperienceDetails(true)
  }

  // Question Deletion Confirmation Handler
  const handleConfirmDeleteQuestion = async () => {
    if (!deletingQuestion) return
    setIsDeletingQuestion(true)
    setDeleteQuestionError(null)
    try {
      await questionApi.deleteQuestion(deletingQuestion.id)
      setShowDeleteQuestionModal(false)
      setDeletingQuestion(null)
      await loadExperienceDetails(true)
    } catch (err) {
      setDeleteQuestionError(err.message || 'Failed to delete question')
    } finally {
      setIsDeletingQuestion(false)
    }
  }

  // Round Deletion Confirmation Handler
  const handleConfirmDeleteRound = async () => {
    if (!deletingRound) return
    setIsDeletingRound(true)
    setDeleteRoundError(null)
    try {
      await roundApi.deleteRound(deletingRound.id)
      setShowDeleteRoundModal(false)
      setDeletingRound(null)
      await loadExperienceDetails(true)
    } catch (err) {
      setDeleteRoundError(err.message || 'Failed to delete round')
    } finally {
      setIsDeletingRound(false)
    }
  }

  // Experience Deletion Confirmation Handler
  const handleConfirmDeleteExperience = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await experienceApi.deleteExperience(id)
      setShowDeleteModal(false)
      navigate('/experiences')
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete interview experience')
    } finally {
      setIsDeleting(false)
    }
  }

  

  // Format creation date
  const formattedDate = experience?.createdAt
    ? new Date(experience.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently shared'

  // Difficulty badge CSS
  const diffClass = experience?.overallDifficulty
    ? `badge-${experience.overallDifficulty.toLowerCase()}`
    : 'badge-medium'

  // Result badge CSS
  const resultClass =
    experience?.result === 'SELECTED'
      ? 'badge-selected'
      : experience?.result === 'REJECTED'
      ? 'badge-rejected'
      : 'badge-waiting'

  // Render Loading State
  if (loading) {
    return (
      <div className="container section" style={{ maxWidth: '880px', padding: '3rem 1rem' }} id="experience-details-loading">
        <Loading message="Loading interview experience details and rounds..." />
      </div>
    )
  }

  // Render Not Found State (404)
  if (notFound) {
    return (
      <div className="container section" style={{ maxWidth: '720px', padding: '4rem 1rem' }} id="experience-not-found">
        <EmptyState
          icon="🔍"
          title="Interview Experience Not Found"
          description={`The experience with ID #${id} could not be located. It may have been removed or the link might be invalid.`}
          action={
            <Link to="/experiences" className="btn btn-primary" id="btn-back-to-listing">
              ← Browse All Experiences
            </Link>
          }
        />
      </div>
    )
  }

  // Render Error State
  if (error) {
    return (
      <div className="container section" style={{ maxWidth: '800px', padding: '3rem 1rem' }} id="experience-details-error">
        <ErrorMessage message={error} onRetry={() => loadExperienceDetails(false)} />
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="container section" style={{ maxWidth: '720px', padding: '4rem 1rem' }} id="experience-not-found">
        <EmptyState
          icon="??"
          title="Interview Experience Not Found"
          description={`The experience with ID #${id} could not be located or has no published data.`}
          action={
            <Link to="/experiences" className="btn btn-primary" id="btn-back-to-listing">
              ? Browse All Experiences
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container section" style={{ maxWidth: '920px' }} id="experience-details-page">
      {/* Back Navigation Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/experiences"
          id="link-back-to-experiences"
          style={{
            color: 'var(--brand-primary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          ← Back to Interview Experiences
        </Link>
      </div>

      {/* Main Experience Header Card */}
      <header
        className="card"
        id="experience-header-card"
        style={{
          padding: '2.5rem 2rem',
          marginBottom: '2.5rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Top Row: Company & Outcome Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.85rem',
          }}
        >
          {/* Company Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CompanyLogo company={experience.company} size={28} />
            <span
              id="experience-company-name"
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--brand-primary)',
                letterSpacing: '0.02em',
              }}
            >
              {experience.company?.name || 'Company'}
            </span>
          </div>

          {/* Difficulty & Result Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {experience.overallDifficulty && (
              <span
                className={`badge badge-difficulty ${diffClass}`}
                id="experience-difficulty-badge"
              >
                {experience.overallDifficulty}
              </span>
            )}
            {experience.result && (
              <span
                className={`badge ${resultClass}`}
                id="experience-result-badge"
              >
                {experience.result}
              </span>
            )}
          </div>
        </div>

        {/* Experience Title */}
        <h1
          id="experience-title"
          style={{
            fontSize: '2.1rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
          }}
        >
          {experience.experienceTitle}
        </h1>

        {/* Key Metadata Grid: Role, Experience Level, Author, Date */}
        <div
          id="experience-metadata-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            padding: '1rem',
            marginBottom: '1.75rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          {/* Job Role */}
          <div id="experience-job-role" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>💼</span>
            <span>
              Role: <strong style={{ color: 'var(--text-primary)' }}>{experience.jobRole}</strong>
            </span>
          </div>

          {/* Years of Experience */}
          <div id="experience-years-exp" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⏳</span>
            <span>
              Experience:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {experience.yearsOfExperience !== undefined
                  ? `${experience.yearsOfExperience} ${experience.yearsOfExperience === 1 ? 'year' : 'years'}`
                  : 'N/A'}
              </strong>
            </span>
          </div>

          {/* Author */}
          <div id="experience-author" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>👤</span>
            <span>
              Candidate:{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {experience.user?.name || 'Community Candidate'}
              </strong>
              {experience.user?.email && (
                <span style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', marginLeft: '0.35rem', fontWeight: 500 }}>
                  ({experience.user.email})
                </span>
              )}
            </span>
          </div>

          {/* Date */}
          <div id="experience-date" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>📅</span>
            <span>
              Shared: <strong style={{ color: 'var(--text-primary)' }}>{formattedDate}</strong>
            </span>
          </div>

          {/* Action buttons: Save to Prep List & Chat with Author */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={isBookmarking}
              className={`btn btn-sm ${isBookmarked ? 'btn-primary' : 'btn-outline'}`}
              id="btn-bookmark-details"
              title={isBookmarked ? 'Saved to your Prep List' : 'Save to My Prep List'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
              }}
            >
              <span>{isBookmarked ? '🔖' : '📑'}</span>
              <span>{isBookmarked ? 'Saved to Prep List' : 'Save to Prep List'}</span>
            </button>

            {experience.user?.id && !isOwner && (
              <Link
                to={`/chat?userId=${experience.user.id}&userName=${encodeURIComponent(experience.user.name || 'Author')}`}
                className="btn btn-sm btn-primary"
                id="btn-chat-with-author"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                }}
              >
                <span>💬</span>
                <span>Chat with Author</span>
              </Link>
            )}
          </div>
        </div>

        {/* OWNER & ADMIN CONTROLS FOR EXPERIENCE */}
        {canManage && (
          <div
            id="experience-owner-controls"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {isOwner && isAdmin
                ? '⭐ You are the author and an administrator of this experience.'
                : isOwner
                ? '✍️ You are the author of this interview experience.'
                : '🛡️ Administrator management controls enabled.'}
            </span>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Link
                to={`/experiences/${id}/edit`}
                className="btn btn-secondary btn-sm"
                id="btn-edit-experience"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>✏️</span>
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-sm btn-ghost"
                id="btn-delete-experience"
                style={{
                  color: 'var(--brand-danger, #ef4444)',
                  borderColor: 'var(--brand-danger, #ef4444)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontWeight: 600,
                }}
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Verified Offer & Compensation Breakdown Card */}
      {(experience.totalCompensation || experience.baseSalary) && (
        <section
          className="card"
          id="experience-salary-breakdown-card"
          style={{
            padding: '1.75rem 2rem',
            marginBottom: '2.5rem',
            backgroundColor: 'var(--bg-card)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.4rem' }}>💰</span>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Verified Offer & Compensation Breakdown
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Self-reported candidate compensation package at {experience.company?.name || 'Company'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {experience.offerAccepted !== null && experience.offerAccepted !== undefined && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: experience.offerAccepted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: experience.offerAccepted ? '#10b981' : 'var(--text-secondary)',
                    border: `1px solid ${experience.offerAccepted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-medium)'}`,
                  }}
                >
                  {experience.offerAccepted ? '✓ Offer Accepted' : 'Offer Declined / Other Choice'}
                </span>
              )}
              {experience.jobLevel && (
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    color: 'var(--brand-primary)',
                  }}
                >
                  Level: {experience.jobLevel}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Annual Compensation
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                {formatCompensation(experience.totalCompensation, experience.currency)}
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>/ yr</span>
              </div>
            </div>

            {experience.baseSalary && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Base Salary
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {formatCompensation(experience.baseSalary, experience.currency)}
                </div>
              </div>
            )}

            {experience.stockGrant && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Stock / Equity Grant
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>
                  {formatCompensation(experience.stockGrant, experience.currency)}
                </div>
              </div>
            )}

            {experience.signingBonus && (
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Signing / Relocation Bonus
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
                  {formatCompensation(experience.signingBonus, experience.currency)}
                </div>
              </div>
            )}
          </div>
        </section>
      )}


      {/* Complete Experience Description Section */}
      <section
        className="card"
        id="experience-description-section"
        style={{
          padding: '2rem',
          marginBottom: '2.5rem',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>📝 Candidate Experience Overview</span>
        </h2>

        <div
          id="experience-description-text"
          style={{
            color: 'var(--text-primary)',
            fontSize: '1.02rem',
            lineHeight: 1.7,
            whiteSpace: 'pre-line',
          }}
        >
          {(() => {
            const { cleanDescription, codeSolution } = extractCodeSolution(experience.description)
            return (
              <>
                <div style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                  {cleanDescription || 'No detailed written overview provided.'}
                </div>

                {/* Real Online Compiler Playground for this experience */}
                <div
                  id="experience-live-compiler-section"
                  style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>💻</span>
                      <h3
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          margin: 0,
                          color: 'var(--text-primary)',
                        }}
                      >
                        Technical Interview Code & Live Online Compiler
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        margin: '0.25rem 0 0 0',
                      }}
                    >
                      {codeSolution
                        ? 'Run and experiment with the code solution submitted for this interview round below:'
                        : 'Run and test code challenges from this interview loop directly in your browser:'}
                    </p>
                  </div>

                  <CodeCompilerPlayground
                    initialLanguage={codeSolution?.language || 'javascript'}
                    initialCode={codeSolution?.code || null}
                    readOnly={false}
                  />
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {/* Rounds Section */}
      <section id="interview-rounds-section" style={{ marginBottom: '3rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
              }}
              id="rounds-breakdown-heading"
            >
              Interview Rounds Breakdown
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                margin: '0.3rem 0 0 0',
              }}
            >
              Step-by-step breakdown of questions, problem domains, and technical focus areas.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
              id="total-rounds-count-badge"
            >
              {roundsWithQuestions.length} {roundsWithQuestions.length === 1 ? 'Round' : 'Rounds'}
            </span>

            {/* + Add Round Button for Owner/Admin */}
            {canAddRound && (
              <button
                type="button"
                onClick={() => {
                  setEditingRound(null)
                  setRoundModalOpen(true)
                }}
                className="btn btn-primary btn-sm"
                id="btn-add-round"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>➕</span>
                <span>Add Round</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty Rounds State */}
        {roundsWithQuestions.length === 0 ? (
          <div id="empty-rounds-container">
            <EmptyState
              icon="🎯"
              title="No Interview Rounds Documented Yet"
              description="The author has not yet added individual round breakdowns or question details for this interview experience."
              action={
                canAddRound ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRound(null)
                      setRoundModalOpen(true)
                    }}
                    className="btn btn-primary btn-sm"
                    id="btn-add-first-round"
                  >
                    ➕ Add First Round
                  </button>
                ) : null
              }
            />
          </div>
        ) : (
          <div id="rounds-list">
            {roundsWithQuestions.map((item, idx) => (
              <RoundCard
                key={item.round.id || idx}
                round={item.round}
                questions={item.questions}
                roundIndex={idx}
                canManage={canManage}
                onEditRound={(rnd) => {
                  setEditingRound(rnd)
                  setRoundModalOpen(true)
                }}
                onDeleteRound={(rnd) => {
                  setDeletingRound(rnd)
                  setDeleteRoundError(null)
                  setShowDeleteRoundModal(true)
                }}
                onAddQuestion={(rnd) => {
                  setActiveRoundForQuestion(rnd)
                  setEditingQuestion(null)
                  setQuestionModalOpen(true)
                }}
                onEditQuestion={(rnd, q) => {
                  setActiveRoundForQuestion(rnd)
                  setEditingQuestion(q)
                  setQuestionModalOpen(true)
                }}
                onDeleteQuestion={(rnd, q) => {
                  setDeletingQuestion(q)
                  setDeleteQuestionError(null)
                  setShowDeleteQuestionModal(true)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Round Form Modal (Add / Edit Round) */}
      <RoundFormModal
        isOpen={roundModalOpen}
        onClose={() => {
          setRoundModalOpen(false)
          setEditingRound(null)
        }}
        onSubmit={handleSaveRound}
        initialValues={editingRound}
        isEditing={Boolean(editingRound)}
        defaultNextRoundNumber={roundsWithQuestions.length + 1}
      />

      {/* Question Form Modal (Add / Edit Question) */}
      <QuestionFormModal
        isOpen={questionModalOpen}
        onClose={() => {
          setQuestionModalOpen(false)
          setActiveRoundForQuestion(null)
          setEditingQuestion(null)
        }}
        onSubmit={handleSaveQuestion}
        initialValues={editingQuestion}
        isEditing={Boolean(editingQuestion)}
        roundTitle={activeRoundForQuestion?.roundName || `Round ${activeRoundForQuestion?.roundNumber || ''}`}
      />

      {/* Standardized Delete Confirmation Modals */}
      {/* 1. Question Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteQuestionModal && Boolean(deletingQuestion)}
        title="Delete Interview Question?"
        message="Are you sure you want to delete this question from the round?"
        itemName={deletingQuestion?.questionText || 'Question'}
        isDeleting={isDeletingQuestion}
        error={deleteQuestionError}
        confirmButtonText="Yes"
        cancelButtonText="No"
        onConfirm={handleConfirmDeleteQuestion}
        onCancel={() => {
          setShowDeleteQuestionModal(false)
          setDeletingQuestion(null)
          setDeleteQuestionError(null)
        }}
        id="delete-question-modal"
      />

      {/* 2. Round Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteRoundModal && Boolean(deletingRound)}
        title="Delete Interview Round?"
        message="Are you sure you want to delete this round and all its associated questions?"
        itemName={deletingRound?.roundName || (deletingRound ? `Round ${deletingRound.roundNumber}` : 'Round')}
        isDeleting={isDeletingRound}
        error={deleteRoundError}
        confirmButtonText="Yes"
        cancelButtonText="No"
        onConfirm={handleConfirmDeleteRound}
        onCancel={() => {
          setShowDeleteRoundModal(false)
          setDeletingRound(null)
          setDeleteRoundError(null)
        }}
        id="delete-round-modal"
      />

      {/* 3. Experience Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Interview Experience?"
        message="Are you sure you want to permanently delete this entire interview journey, all its rounds, and all recorded questions?"
        itemName={experience?.experienceTitle || 'Experience'}
        isDeleting={isDeleting}
        error={deleteError}
        confirmButtonText="Yes"
        cancelButtonText="No"
        onConfirm={handleConfirmDeleteExperience}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeleteError(null)
        }}
        id="delete-experience-modal"
      />
    </div>
  )
}

export default ExperienceDetails
