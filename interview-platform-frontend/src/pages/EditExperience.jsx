import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import experienceApi from '../api/experienceApi'
import ExperienceForm from '../components/experience/ExperienceForm'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'
import DeleteConfirmModal from '../components/common/DeleteConfirmModal'

export function EditExperience() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const [experience, setExperience] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Load existing experience data
  const loadExperience = async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const res = await experienceApi.getExperienceById(id)
      const data = res.data || res
      if (!data || !data.id) {
        setNotFound(true)
        return
      }
      setExperience(data)
    } catch (err) {
      console.error('[EditExperience] Error loading experience:', err)
      if (err.status === 404 || (err.message && err.message.includes('404'))) {
        setNotFound(true)
      } else {
        setError(err.message || 'Failed to load interview experience details for editing.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadExperience()
    }
  }, [id])

  // Delete experience handler
  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await experienceApi.deleteExperience(id)
      setShowDeleteModal(false)
      navigate('/experiences', { replace: true })
    } catch (err) {
      console.error('[EditExperience] Delete failed:', err)
      setDeleteError(err.data?.message || err.message || 'Failed to delete experience. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="container section" style={{ maxWidth: '800px', padding: '3rem 1rem' }} id="edit-experience-loading">
        <Loading message="Loading interview experience details..." />
      </div>
    )
  }

  // 2. Not Found (404) State
  if (notFound) {
    return (
      <div className="container section" style={{ maxWidth: '720px', padding: '4rem 1rem' }} id="edit-experience-not-found">
        <EmptyState
          icon="🔍"
          title="Interview Experience Not Found"
          description={`Experience #${id} could not be located. It may have been removed.`}
          action={
            <Link to="/experiences" className="btn btn-primary" id="btn-back-to-listing">
              ← Browse All Experiences
            </Link>
          }
        />
      </div>
    )
  }

  // 3. Error State
  if (error) {
    return (
      <div className="container section" style={{ maxWidth: '800px', padding: '3rem 1rem' }} id="edit-experience-error">
        <ErrorMessage message={error} onRetry={loadExperience} />
      </div>
    )
  }

  if (!experience) return null

  // 4. AUTHORIZATION CHECK: Owner or ADMIN only
  const isOwner = Boolean(
    isAuthenticated &&
      user &&
      experience?.user &&
      (String(user.id) === String(experience.user.id) ||
        (user.email && experience.user.email && user.email.toLowerCase() === experience.user.email.toLowerCase()))
  )

  const isAdmin = Boolean(isAuthenticated && user && user.role === 'ADMIN')
  const canManage = isOwner || isAdmin

  // 403 Forbidden State for unauthorized logged-in user
  if (!canManage) {
    return (
      <div className="container section" style={{ maxWidth: '720px', padding: '4rem 1rem' }} id="edit-experience-forbidden">
        <EmptyState
          icon="🛡️"
          title="403 Forbidden: Access Denied"
          description="You don't have permission to perform this action."
          action={
            <Link to={`/experiences/${id}`} className="btn btn-primary" id="btn-forbidden-back-details">
              ← View Experience Details
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="container section" style={{ maxWidth: '820px' }} id="edit-experience-page">
      {/* Top Breadcrumb & Action Row */}
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
        <Link
          to={`/experiences/${id}`}
          style={{
            color: 'var(--brand-primary)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 600,
          }}
          id="link-back-to-details"
        >
          ← Back to Experience Details
        </Link>

        {/* Delete Experience button on edit page */}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="btn btn-sm btn-ghost"
          id="btn-edit-page-delete"
          style={{
            color: 'var(--brand-danger, #ef4444)',
            borderColor: 'var(--brand-danger, #ef4444)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <span>🗑️</span>
          <span>Delete Experience</span>
        </button>
      </div>

      {/* Page Heading */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }} id="edit-experience-title">
          Edit Interview Experience
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.4rem' }}>
          Update hiring company, job role, title, overview narrative, and difficulty ratings.
        </p>
      </div>

      {/* Pre-filled Experience Form in Edit Mode */}
      <ExperienceForm initialValues={experience} isEditing={true} />

      {/* Standardized Viewport-Centered Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Interview Experience?"
        message="Are you sure you want to permanently delete this interview experience? This will remove all rounds and recorded questions."
        itemName={experience?.experienceTitle || 'Experience'}
        isDeleting={isDeleting}
        error={deleteError}
        confirmButtonText="Yes"
        cancelButtonText="No"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false)
          setDeleteError(null)
        }}
        id="delete-experience-modal"
      />
    </div>
  )
}

export default EditExperience
