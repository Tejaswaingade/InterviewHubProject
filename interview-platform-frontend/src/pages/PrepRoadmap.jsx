import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { bookmarkApi } from '../api'
import CompanyLogo from '../components/common/CompanyLogo'
import { isAuthenticated } from '../utils/storage'

const STATUS_TABS = [
  { key: 'ALL', label: 'All Saved', icon: '📋' },
  { key: 'PLANNING', label: 'To Prepare', icon: '🎯' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: '⚡' },
  { key: 'REVIEWED', label: 'Reviewed', icon: '📝' },
  { key: 'MASTERED', label: 'Mastered', icon: '🏆' },
]

export function PrepRoadmap() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL')
  const [errorMsg, setErrorMsg] = useState(null)
  const [editingNotesId, setEditingNotesId] = useState(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const isAuth = isAuthenticated()

  const loadBookmarks = async () => {
    if (!isAuth) {
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await bookmarkApi.getBookmarks({
        page: 0,
        size: 50,
        status: activeTab === 'ALL' ? undefined : activeTab,
      })
      const content = res.data?.data || res.data?.content || res.data || []
      setBookmarks(Array.isArray(content) ? content : [])
    } catch (err) {
      console.error('Failed to load prep bookmarks:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to load prep list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookmarks()
  }, [activeTab, isAuth])

  const handleUpdateStatus = async (item, newStatus) => {
    try {
      const targetId = item.experienceId || item.experience?.id || item.id
      await bookmarkApi.updateBookmarkStatus(targetId, newStatus)
      setBookmarks((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: newStatus } : b))
      )
    } catch (err) {
      console.error('Failed to update status:', err)
      alert(err.response?.data?.message || 'Could not update status. Please try again.')
    }
  }

  const handleRemoveBookmark = async (item) => {
    if (!window.confirm('Delete this experience from your prep list?')) return
    try {
      const targetId = item.experienceId || item.experience?.id || item.id
      await bookmarkApi.removeBookmark(targetId)
      setBookmarks((prev) => prev.filter((b) => b.id !== item.id))
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
      alert(err.response?.data?.message || 'Could not delete item.')
    }
  }

  const handleOpenNotes = (bookmark) => {
    setEditingNotesId(bookmark.id)
    setNotesDraft(bookmark.notes || '')
  }

  const handleSaveNotes = async (item) => {
    setSavingNotes(true)
    try {
      const targetId = item.experienceId || item.experience?.id || item.id
      await bookmarkApi.updateBookmark(targetId, { notes: notesDraft })
      setBookmarks((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, notes: notesDraft } : b))
      )
      setEditingNotesId(null)
    } catch (err) {
      console.error('Failed to save notes:', err)
      alert(err.response?.data?.message || 'Failed to save notes.')
    } finally {
      setSavingNotes(false)
    }
  }

  // Calculate readiness stats
  const totalCount = bookmarks.length
  const masteredCount = bookmarks.filter((b) => b.status === 'MASTERED').length
  const inProgressCount = bookmarks.filter((b) => b.status === 'IN_PROGRESS').length
  const readinessPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0

  if (!isAuth) {
    return (
      <div className="container section" style={{ maxWidth: '720px', textAlign: 'center', paddingTop: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔖</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          Interview Prep List
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Sign in to save interview experiences, track preparation progress, and keep study notes.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
            Sign In
          </Link>
          <Link to="/experiences" className="btn btn-outline" style={{ padding: '0.65rem 1.5rem' }}>
            Explore Experiences
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container section" id="prep-roadmap-page" style={{ maxWidth: '1060px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.3rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--brand-primary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '0.65rem',
            }}
          >
            <span>🎯</span>
            <span>Prep Tracker</span>
          </div>
          <h1
            id="roadmap-title"
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Interview Prep List
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px' }}>
            Track saved interview experiences, preparation progress, and study notes.
          </p>
        </div>

        <Link
          to="/experiences"
          className="btn btn-outline"
          id="roadmap-explore-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.15rem' }}
        >
          <span>🔍</span>
          <span>Browse Experiences</span>
        </Link>
      </div>

      {/* Readiness Metric Progress Banner */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Prep Progress
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: readinessPercent >= 70 ? '#10b981' : 'var(--brand-primary)' }}>
              {readinessPercent}% completed ({masteredCount} of {totalCount} mastered)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saved</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>{inProgressCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>In Progress</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0.5rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{masteredCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Mastered</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${readinessPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #2563eb, #10b981)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-medium)',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {errorMsg && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Bookmarks List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner spinner-lg" />
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your saved experiences...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-card)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔖</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No saved experiences in this category
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Save interview experiences to organize your preparation and track practice questions.
          </p>
          <Link to="/experiences" className="btn btn-primary" style={{ padding: '0.6rem 1.4rem' }}>
            Explore Experiences
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          {bookmarks.map((bm) => {
            const exp = bm.experience
            if (!exp) return null
            const isEditingThisNotes = editingNotesId === bm.id

            return (
              <div
                key={bm.id}
                className="card"
                id={`roadmap-item-${bm.id}`}
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CompanyLogo company={exp.company} size={32} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
                          {exp.company?.name || 'Tech Company'}
                        </span>
                        <span className={`badge badge-${exp.overallDifficulty?.toLowerCase() || 'medium'}`} style={{ fontSize: '0.7rem' }}>
                          {exp.overallDifficulty}
                        </span>
                        <span className={`badge badge-${exp.result === 'SELECTED' ? 'selected' : 'brand'}`} style={{ fontSize: '0.7rem' }}>
                          {exp.result}
                        </span>
                        {exp.totalCompensation && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.12)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                            }}
                          >
                            💰 {exp.currency || '$'}{Number(exp.totalCompensation).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.35rem', marginBottom: '0.25rem' }}>
                        <Link to={`/experiences/${exp.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {exp.experienceTitle}
                        </Link>
                      </h3>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Role: <strong style={{ color: 'var(--text-primary)' }}>{exp.jobRole}</strong> • {exp.yearsOfExperience || 0} yrs exp
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                      value={bm.status}
                      onChange={(e) => handleUpdateStatus(bm, e.target.value)}
                      className="form-control"
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        width: 'auto',
                      }}
                    >
                      <option value="PLANNING">🎯 To Prepare</option>
                      <option value="IN_PROGRESS">⚡ In Progress</option>
                      <option value="REVIEWED">📝 Reviewed</option>
                      <option value="MASTERED">🏆 Mastered</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(bm)}
                      className="btn btn-sm btn-outline"
                      title="Delete from prep list"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#ef4444',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Candidate Prep Notes Section */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    marginTop: '0.75rem',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>📝</span>
                      <span>My Notes:</span>
                    </span>
                    {!isEditingThisNotes && (
                      <button
                        type="button"
                        onClick={() => handleOpenNotes(bm)}
                        className="btn btn-sm btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', color: 'var(--brand-primary)' }}
                      >
                        {bm.notes ? 'Edit Notes' : '+ Add Notes'}
                      </button>
                    )}
                  </div>

                  {isEditingThisNotes ? (
                    <div>
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={3}
                        className="form-control"
                        placeholder="Write notes, reminders, or questions to practice..."
                        style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setEditingNotesId(null)}
                          className="btn btn-sm btn-ghost"
                          style={{ fontSize: '0.8rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(bm)}
                          disabled={savingNotes}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.8rem' }}
                        >
                          {savingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: bm.notes ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: bm.notes ? 'normal' : 'italic' }}>
                      {bm.notes || 'No notes yet. Click "+ Add Notes" to write reminders.'}
                    </div>
                  )}
                </div>

                {/* Footer Quick Action Links */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <Link
                    to="/playground"
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>⚡</span>
                    <span>Playground</span>
                  </Link>
                  <Link
                    to="/mock-interview"
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#6366f1' }}
                  >
                    <span>🤖</span>
                    <span>AI Mock</span>
                  </Link>
                  <Link
                    to={`/experiences/${exp.id}`}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.8rem' }}
                  >
                    View Experience →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PrepRoadmap
