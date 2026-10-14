import React, { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import experienceApi from '../api/experienceApi'
import companyApi from '../api/companyApi'
import ExperienceCard from '../components/experience/ExperienceCard'
import ExperienceFilters from '../components/experience/ExperienceFilters'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'

export function Experiences() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Read URL query parameters
  const keyword = searchParams.get('keyword') || searchParams.get('search') || ''
  const companyId = searchParams.get('companyId') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const jobRole = searchParams.get('jobRole') || ''
  const page = parseInt(searchParams.get('page') || '0', 10)
  const size = parseInt(searchParams.get('size') || '6', 10)
  const sort = searchParams.get('sort') || 'createdAt,desc'

  // Data & UI states
  const [experiences, setExperiences] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [first, setFirst] = useState(true)
  const [last, setLast] = useState(true)

  // Fetch companies list on mount for filter dropdown
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await companyApi.getCompanies()
        const compList = res.data || res || []
        setCompanies(Array.isArray(compList) ? compList : [])
      } catch (err) {
        console.error('[Experiences] Failed to load companies:', err.message)
      }
    }
    loadCompanies()
  }, [])

  // Helper to update query parameters and reset page to 0 (unless specified)
  const updateQueryParams = useCallback(
    (updates, shouldResetPage = true) => {
      const nextParams = new URLSearchParams(searchParams)

      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '') {
          nextParams.delete(key)
          if (key === 'keyword') nextParams.delete('search')
        } else {
          nextParams.set(key, String(val))
        }
      })

      if (shouldResetPage) {
        nextParams.set('page', '0')
      }

      // Maintain size and sort
      if (!nextParams.has('size')) nextParams.set('size', String(size))
      if (!nextParams.has('sort')) nextParams.set('sort', sort)

      setSearchParams(nextParams)
    },
    [searchParams, setSearchParams, size, sort]
  )

  // Fetch experiences from Spring Boot whenever URL query params change
  useEffect(() => {
    let isMounted = true

    const fetchExperiences = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = {
          page,
          size,
          sort,
        }
        if (keyword && keyword.trim()) params.keyword = keyword.trim()
        if (companyId) params.companyId = companyId
        if (difficulty) params.difficulty = difficulty
        if (jobRole && jobRole.trim()) params.jobRole = jobRole.trim()

        const response = await experienceApi.getExperiences(params)
        if (!isMounted) return

        const pagedData = response.data || response || {}
        const items = pagedData.content || (Array.isArray(pagedData) ? pagedData : [])

        setExperiences(items)
        setTotalPages(pagedData.totalPages || 0)
        setTotalElements(pagedData.totalElements || 0)
        setFirst(pagedData.first !== undefined ? pagedData.first : page === 0)
        setLast(
          pagedData.last !== undefined
            ? pagedData.last
            : page >= (pagedData.totalPages || 1) - 1
        )
      } catch (err) {
        if (!isMounted) return
        console.error('[Experiences Page] Error loading experiences:', err.message)
        setError(err.message || 'Failed to load interview experiences.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchExperiences()

    return () => {
      isMounted = false
    }
  }, [keyword, companyId, difficulty, jobRole, page, size, sort])

  // Filter change handlers
  const handleKeywordChange = (newKeyword) => {
    updateQueryParams({ keyword: newKeyword }, true)
  }

  const handleCompanyChange = (newCompanyId) => {
    updateQueryParams({ companyId: newCompanyId }, true)
  }

  const handleDifficultyChange = (newDifficulty) => {
    updateQueryParams({ difficulty: newDifficulty }, true)
  }

  const handleJobRoleChange = (newJobRole) => {
    updateQueryParams({ jobRole: newJobRole }, true)
  }

  const handleSortChange = (newSort) => {
    updateQueryParams({ sort: newSort }, true)
  }

  const handleSizeChange = (newSize) => {
    updateQueryParams({ size: newSize }, true)
  }

  // Clear all filters returns to default listing
  const handleClearFilters = () => {
    const nextParams = new URLSearchParams()
    nextParams.set('page', '0')
    nextParams.set('size', String(size))
    nextParams.set('sort', sort)
    setSearchParams(nextParams)
  }

  // Pagination navigation (preserves all filters)
  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(newPage))
    setSearchParams(nextParams)
    const headerEl = document.getElementById('experiences-page')
    if (headerEl) {
      headerEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const pageNumbers = []
  for (let i = 0; i < totalPages; i++) {
    pageNumbers.push(i)
  }

  const hasActiveFilters = Boolean(keyword || companyId || difficulty || jobRole)

  return (
    <div className="container section" id="experiences-page">
      {/* Header */}
      <div
        className="experiences-header-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              marginBottom: '0.4rem',
              color: 'var(--text-primary)',
            }}
            id="experiences-title"
          >
            Interview Experiences
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              margin: 0,
            }}
            id="experiences-subtitle"
          >
            Learn from candidates who have already been through the interview.
          </p>
        </div>

        <Link
          to="/create-experience"
          className="btn btn-primary"
          id="btn-create-experience"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap',
          }}
        >
          <span>✍️</span>
          <span>Share Your Experience</span>
        </Link>
      </div>

      {/* Filter and Sort Toolbar */}
      <ExperienceFilters
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        companyId={companyId}
        onCompanyChange={handleCompanyChange}
        companies={companies}
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        jobRole={jobRole}
        onJobRoleChange={handleJobRoleChange}
        sort={sort}
        onSortChange={handleSortChange}
        size={size}
        onSizeChange={handleSizeChange}
        onClearFilters={handleClearFilters}
        totalElements={totalElements}
        loading={loading}
      />

      {/* STATES */}

      {/* 1. Initial Loading State */}
      {loading && experiences.length === 0 && (
        <div id="experiences-loading-container" style={{ padding: '3rem 0' }}>
          <Loading message="Loading interview experiences from backend..." />
        </div>
      )}

      {/* 2. Error State */}
      {!loading && error && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            const next = new URLSearchParams(searchParams)
            setSearchParams(next)
          }}
        />
      )}

      {/* 3. Empty State */}
      {!loading && !error && experiences.length === 0 && (
        <EmptyState
          icon="📝"
          title="No interview experiences found"
          description={
            hasActiveFilters
              ? 'No candidate accounts match your active search filters. Try adjusting or clearing your filters.'
              : 'Be the first candidate to share your technical interview process and help fellow developers prepare!'
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-secondary"
                id="btn-empty-clear-filters"
              >
                Clear Filters
              </button>
            ) : (
              <Link to="/create-experience" className="btn btn-primary" id="btn-empty-create">
                Share Your Experience
              </Link>
            )
          }
        />
      )}

      {/* 4. Experiences Responsive Grid */}
      {!error && experiences.length > 0 && (
        <>
          <div
            id="experiences-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            {experiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>

          {/* PAGINATION SECTION */}
          {totalPages > 1 && (
            <nav
              className="pagination-container"
              id="experiences-pagination"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
              aria-label="Interview experiences pagination"
            >
              {/* Pagination Summary */}
              <div
                style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                id="pagination-summary"
              >
                Showing page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>{' '}
                ({totalElements} total experiences)
              </div>

              {/* Controls: Previous, Page Numbers, Next */}
              <div
                className="pagination-buttons"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={first || page === 0 || loading}
                  className="btn btn-sm btn-secondary"
                  id="pagination-btn-prev"
                  style={{ opacity: first || page === 0 ? 0.5 : 1 }}
                >
                  ← Previous
                </button>

                {/* Page Number Buttons */}
                {pageNumbers.map((pIndex) => {
                  const isActive = pIndex === page
                  return (
                    <button
                      key={pIndex}
                      type="button"
                      onClick={() => handlePageChange(pIndex)}
                      className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                      id={`pagination-page-btn-${pIndex + 1}`}
                      style={{
                        minWidth: '36px',
                        padding: '0.35rem 0.65rem',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? 'var(--brand-primary)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-primary)',
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pIndex + 1}
                    </button>
                  )
                })}

                {/* Next Button */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={last || page >= totalPages - 1 || loading}
                  className="btn btn-sm btn-secondary"
                  id="pagination-btn-next"
                  style={{ opacity: last || page >= totalPages - 1 ? 0.5 : 1 }}
                >
                  Next →
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* Embedded Responsive Styles for Mobile Layout */}
      <style>{`
        @media (max-width: 640px) {
          #experiences-page {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          .experiences-header-row {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
          .experiences-header-row .btn {
            width: 100%;
            justify-content: center;
          }
          #search-experiences-form {
            flex-direction: column;
            align-items: stretch;
          }
          #filter-controls-row {
            grid-template-columns: 1fr !important;
          }
          #experiences-grid {
            grid-template-columns: 1fr !important;
          }
          .pagination-container {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .pagination-buttons {
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default Experiences
