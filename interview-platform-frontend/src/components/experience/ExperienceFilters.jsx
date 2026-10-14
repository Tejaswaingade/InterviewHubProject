import React, { useState, useEffect, useRef } from 'react'

export function ExperienceFilters({
  keyword = '',
  onKeywordChange,
  companyId = '',
  onCompanyChange,
  companies = [],
  difficulty = '',
  onDifficultyChange,
  jobRole = '',
  onJobRoleChange,
  sort = 'createdAt,desc',
  onSortChange,
  onClearFilters,
  totalElements = 0,
  loading = false,
}) {
  // Local state for debounced keyword input
  const [localKeyword, setLocalKeyword] = useState(keyword)
  // Local state for debounced role input
  const [localJobRole, setLocalJobRole] = useState(jobRole)

  const keywordTimerRef = useRef(null)
  const roleTimerRef = useRef(null)

  // Sync external keyword prop if it changes externally (e.g. URL change or reset)
  useEffect(() => {
    setLocalKeyword(keyword)
  }, [keyword])

  // Sync external jobRole prop if it changes externally
  useEffect(() => {
    setLocalJobRole(jobRole)
  }, [jobRole])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current)
      if (roleTimerRef.current) clearTimeout(roleTimerRef.current)
    }
  }, [])

  // Handle keyword typing with 350ms debounce
  const handleKeywordInput = (e) => {
    const val = e.target.value
    setLocalKeyword(val)

    if (keywordTimerRef.current) {
      clearTimeout(keywordTimerRef.current)
    }

    keywordTimerRef.current = setTimeout(() => {
      onKeywordChange(val.trim())
    }, 350)
  }

  // Handle role typing with 350ms debounce
  const handleRoleInput = (e) => {
    const val = e.target.value
    setLocalJobRole(val)

    if (roleTimerRef.current) {
      clearTimeout(roleTimerRef.current)
    }

    roleTimerRef.current = setTimeout(() => {
      onJobRoleChange(val.trim())
    }, 350)
  }

  // Immediate search submit on form enter
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current)
    onKeywordChange(localKeyword.trim())
  }

  // Clear single filter helpers
  const handleClearKeyword = () => {
    if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current)
    setLocalKeyword('')
    onKeywordChange('')
  }

  const handleClearRole = () => {
    if (roleTimerRef.current) clearTimeout(roleTimerRef.current)
    setLocalJobRole('')
    onJobRoleChange('')
  }

  // Find selected company name for active filter badge
  const selectedCompany = companies.find((c) => String(c.id) === String(companyId))

  const hasActiveFilters = Boolean(keyword || companyId || difficulty || jobRole)

  return (
    <div
      className="card experience-filters-wrapper"
      id="experience-filters-bar"
      style={{ marginBottom: '2rem', padding: '1.25rem' }}
    >
      {/* Search Input Bar */}
      <form
        onSubmit={handleSearchSubmit}
        id="search-experiences-form"
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search interview experiences..."
            value={localKeyword}
            onChange={handleKeywordInput}
            className="form-control"
            id="search-input"
            style={{
              paddingLeft: '2.5rem',
              paddingRight: localKeyword ? '2.5rem' : '1rem',
              width: '100%',
            }}
          />
          {localKeyword && (
            <button
              type="button"
              onClick={handleClearKeyword}
              id="btn-clear-search-input"
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '1rem',
                lineHeight: 1,
                padding: '0.2rem',
              }}
              title="Clear search query"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-secondary"
          id="btn-search-submit"
          style={{ whiteSpace: 'nowrap' }}
        >
          Search
        </button>
      </form>

      {/* Filter Row: Company, Difficulty, Job Role, Sort By */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
          alignItems: 'center',
        }}
        id="filter-controls-row"
      >
        {/* Company Dropdown */}
        <div>
          <label
            htmlFor="filter-company-select"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Company
          </label>
          <select
            id="filter-company-select"
            value={companyId}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="form-control"
            style={{ width: '100%', fontSize: '0.875rem', padding: '0.45rem 0.75rem' }}
          >
            <option value="">All Companies</option>
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Dropdown */}
        <div>
          <label
            htmlFor="filter-difficulty-select"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Difficulty
          </label>
          <select
            id="filter-difficulty-select"
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="form-control"
            style={{ width: '100%', fontSize: '0.875rem', padding: '0.45rem 0.75rem' }}
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Job Role Filter */}
        <div>
          <label
            htmlFor="filter-role-input"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Job Role
          </label>
          <input
            id="filter-role-input"
            type="text"
            placeholder="e.g. Backend, Software..."
            value={localJobRole}
            onChange={handleRoleInput}
            className="form-control"
            style={{ width: '100%', fontSize: '0.875rem', padding: '0.45rem 0.75rem' }}
          />
        </div>

        {/* Sort Dropdown */}
        <div>
          <label
            htmlFor="filter-sort-select"
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Sort By
          </label>
          <select
            id="filter-sort-select"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="form-control"
            style={{ width: '100%', fontSize: '0.875rem', padding: '0.45rem 0.75rem' }}
          >
            <option value="createdAt,desc">Newest First</option>
            <option value="createdAt,asc">Oldest First</option>
            <option value="overallDifficulty,desc">Highest Difficulty</option>
          </select>
        </div>
      </div>

      {/* Active Filters Bar and Results Count */}
      <div
        id="active-filters-summary-bar"
        style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Results Counter & Search Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }} id="result-count-container">
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Found <strong style={{ color: 'var(--text-primary)' }}>{totalElements}</strong>{' '}
            {totalElements === 1 ? 'experience' : 'experiences'}
          </span>
          {loading && (
            <span
              id="filter-loading-indicator"
              style={{
                fontSize: '0.8rem',
                color: 'var(--brand-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
              }}
            >
              <span>⏳</span> Searching...
            </span>
          )}
        </div>

        {/* Active Filter Badges */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          {keyword && (
            <span
              className="badge"
              id="active-filter-keyword"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
              }}
            >
              Search: <strong>"{keyword}"</strong>
              <button
                type="button"
                onClick={handleClearKeyword}
                id="btn-remove-keyword-filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0,
                  marginLeft: '0.2rem',
                }}
                title="Remove search query"
              >
                ✕
              </button>
            </span>
          )}

          {companyId && selectedCompany && (
            <span
              className="badge"
              id="active-filter-company"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
              }}
            >
              Company: <strong>{selectedCompany.name}</strong>
              <button
                type="button"
                onClick={() => onCompanyChange('')}
                id="btn-remove-company-filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0,
                  marginLeft: '0.2rem',
                }}
                title="Remove company filter"
              >
                ✕
              </button>
            </span>
          )}

          {difficulty && (
            <span
              className="badge"
              id="active-filter-difficulty"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
              }}
            >
              Difficulty: <strong>{difficulty}</strong>
              <button
                type="button"
                onClick={() => onDifficultyChange('')}
                id="btn-remove-difficulty-filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0,
                  marginLeft: '0.2rem',
                }}
                title="Remove difficulty filter"
              >
                ✕
              </button>
            </span>
          )}

          {jobRole && (
            <span
              className="badge"
              id="active-filter-role"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
              }}
            >
              Role: <strong>{jobRole}</strong>
              <button
                type="button"
                onClick={handleClearRole}
                id="btn-remove-role-filter"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: 0,
                  marginLeft: '0.2rem',
                }}
                title="Remove job role filter"
              >
                ✕
              </button>
            </span>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="btn btn-sm btn-ghost"
              id="btn-clear-all-filters"
              style={{
                color: 'var(--brand-danger, #ef4444)',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
              }}
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExperienceFilters
