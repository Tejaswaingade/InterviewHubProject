import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import companyApi from '../api/companyApi'
import CompanyCard from '../components/company/CompanyCard'
import CompanyFormModal from '../components/company/CompanyFormModal'
import DeleteConfirmModal from '../components/common/DeleteConfirmModal'
import Loading from '../components/common/Loading'
import ErrorMessage from '../components/common/ErrorMessage'
import EmptyState from '../components/common/EmptyState'

export function Companies() {
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [flashBanner, setFlashBanner] = useState(null)

  // Pagination state
  const ITEMS_PER_PAGE = 6
  const [currentPage, setCurrentPage] = useState(1)

  // Delete Company Modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    company: null,
    isDeleting: false,
    error: null,
  })

  const { isAuthenticated, isAdmin } = useAuth()

  // Fetch registered companies from GET /api/companies
  const loadCompanies = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await companyApi.getCompanies()
      const data = res.data || res || []
      setCompanies(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[Companies] Error fetching companies:', err)
      setError(err.message || 'Failed to load companies directory. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  // Reset to page 1 on search change
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  // Filter companies client-side by name, description, or website
  const filteredCompanies = companies.filter((c) => {
    if (!search.trim()) return true
    const term = search.toLowerCase().trim()
    const nameMatch = c.name && c.name.toLowerCase().includes(term)
    const descMatch = c.description && c.description.toLowerCase().includes(term)
    const webMatch = c.website && c.website.toLowerCase().includes(term)
    return nameMatch || descMatch || webMatch
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      const container = document.getElementById('companies-page')
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  // Handle Admin Company Deletion
  const handleDeleteCompanyClick = (company) => {
    setDeleteModal({
      isOpen: true,
      company,
      isDeleting: false,
      error: null,
    })
  }

  const handleConfirmDeleteCompany = async () => {
    if (!deleteModal.company) return

    setDeleteModal((prev) => ({ ...prev, isDeleting: true, error: null }))
    try {
      await companyApi.deleteCompany(deleteModal.company.id)
      setCompanies((prev) => prev.filter((c) => c.id !== deleteModal.company.id))
      setFlashBanner(`Company "${deleteModal.company.name}" was permanently removed.`)
      setDeleteModal({ isOpen: false, company: null, isDeleting: false, error: null })
      setTimeout(() => setFlashBanner(null), 4000)
    } catch (err) {
      console.error('[Companies] Error deleting company:', err)
      setDeleteModal((prev) => ({
        ...prev,
        isDeleting: false,
        error: err.message || 'Failed to delete company. Please try again.',
      }))
    }
  }

  return (
    <div className="container page-wrapper" id="companies-page">
      {/* Flash Success Banner */}
      {flashBanner && (
        <div
          id="companies-flash-success"
          style={{
            marginBottom: '1.5rem',
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--color-success-bg, #ecfdf5)',
            border: '1px solid var(--color-success-border, #a7f3d0)',
            borderRadius: 'var(--radius-md, 10px)',
            color: 'var(--color-success, #059669)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>✓</span>
          <span>{flashBanner}</span>
        </div>
      )}

      {/* Header Section */}
      <div
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
              fontSize: '2.15rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 0.4rem 0',
              letterSpacing: '-0.03em',
            }}
            id="companies-title"
          >
            Companies Directory
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              margin: 0,
            }}
          >
            Explore candidate interview experiences, round structures, and questions across top tech employers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
              id="btn-add-company-directory"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>➕</span>
              <span>Add Company</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn-secondary btn-sm"
              id="btn-login-to-add-company"
            >
              Sign In to Add Company
            </Link>
          )}

          {!loading && !error && (
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
              id="total-companies-badge"
            >
              {companies.length} {companies.length === 1 ? 'Company' : 'Companies'}
            </span>
          )}
        </div>
      </div>

      {/* Search Filter Box */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ maxWidth: '480px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search companies by name, domain, or technology..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
            }}
            id="company-search-input"
          />
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '3rem 1rem' }} id="companies-loading">
          <Loading message="Loading companies directory from database..." />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{ padding: '2rem 1rem' }} id="companies-error">
          <ErrorMessage message={error} onRetry={loadCompanies} />
        </div>
      )}

      {/* Empty State: No companies registered in DB */}
      {!loading && !error && companies.length === 0 && (
        <div id="companies-empty">
          <EmptyState
            icon="🏢"
            title="No Companies Found"
            description="There are currently no companies registered in the platform directory."
          />
        </div>
      )}

      {/* Empty State: Filter produced 0 results */}
      {!loading && !error && companies.length > 0 && filteredCompanies.length === 0 && (
        <div id="companies-no-match">
          <EmptyState
            icon="🔍"
            title={`No companies matching "${search}"`}
            description="Try searching with a different name, keyword, or clear your query."
            action={
              <button
                type="button"
                onClick={() => setSearch('')}
                className="btn btn-secondary btn-sm"
                id="btn-clear-company-search"
              >
                Clear Search
              </button>
            }
          />
        </div>
      )}

      {/* Populated Grid of Responsive Company Cards */}
      {!loading && !error && paginatedCompanies.length > 0 && (
        <>
          <div
            id="companies-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.75rem',
              marginBottom: '2.5rem',
            }}
          >
            {paginatedCompanies.map((comp) => (
              <CompanyCard
                key={comp.id}
                company={comp}
                onDelete={isAdmin ? handleDeleteCompanyClick : undefined}
              />
            ))}
          </div>

          {/* Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div
              id="companies-pagination"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing{' '}
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {startIndex + 1}
                </span>{' '}
                to{' '}
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredCompanies.length)}
                </span>{' '}
                of{' '}
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {filteredCompanies.length}
                </span>{' '}
                companies
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-sm btn-secondary"
                  id="btn-companies-prev-page"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  « Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`btn btn-sm ${
                      currentPage === pageNum ? 'btn-primary' : 'btn-secondary'
                    }`}
                    id={`btn-companies-page-${pageNum}`}
                    style={{
                      minWidth: '36px',
                      padding: '0.45rem 0.65rem',
                      fontWeight: currentPage === pageNum ? 700 : 500,
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-sm btn-secondary"
                  id="btn-companies-next-page"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next »
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <CompanyFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newComp) => {
            if (newComp && newComp.id) {
              setCompanies((prev) => [
                newComp,
                ...prev.filter((c) => String(c.id) !== String(newComp.id)),
              ])
              setShowAddModal(false)
              setFlashBanner(`Company "${newComp.name}" was successfully added!`)
              setTimeout(() => setFlashBanner(null), 4000)
            }
          }}
        />
      )}

      {/* Admin Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Company Profile"
        message="Are you sure you want to permanently delete this company profile from the platform directory? Associated interview experiences may also be removed."
        itemName={deleteModal.company?.name || 'Company'}
        isDeleting={deleteModal.isDeleting}
        error={deleteModal.error}
        onConfirm={handleConfirmDeleteCompany}
        onCancel={() =>
          setDeleteModal({ isOpen: false, company: null, isDeleting: false, error: null })
        }
        confirmButtonText="Yes"
        cancelButtonText="No"
      />
    </div>
  )
}

export default Companies
