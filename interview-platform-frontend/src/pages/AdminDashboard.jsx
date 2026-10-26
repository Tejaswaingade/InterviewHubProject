import CompanyLogo from '../components/common/CompanyLogo'
import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import companyApi from '../api/companyApi'
import experienceApi from '../api/experienceApi'
import questionApi from '../api/questionApi'
import userApi from '../api/userApi'

import CompanyFormModal from '../components/company/CompanyFormModal'
import QuestionEditModal from '../components/question/QuestionEditModal'
import DeleteConfirmModal from '../components/common/DeleteConfirmModal'
import Loading from '../components/common/Loading'

export function AdminDashboard() {
  const { user } = useAuth()

  // Active navigation tab: 'companies' | 'experiences' | 'questions' | 'users'
  const [activeTab, setActiveTab] = useState('companies')

  // Global dataset states
  const [companies, setCompanies] = useState([])
  const [experiences, setExperiences] = useState([])
  const [questions, setQuestions] = useState([])
  const [users, setUsers] = useState([])

  // Loading & Error states
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [successBanner, setSuccessBanner] = useState(null)

  // Search & Filter query states per tab
  const [companySearch, setCompanySearch] = useState('')
  const [expSearch, setExpSearch] = useState('')
  const [expDifficultyFilter, setExpDifficultyFilter] = useState('ALL')
  const [questionSearch, setQuestionSearch] = useState('')
  const [questionTypeFilter, setQuestionTypeFilter] = useState('ALL')
  const [userSearch, setUserSearch] = useState('')

  // Modals state
  // 1. Company Modal
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)

  // 2. Question Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

  // 3. Generic Delete Confirmation Modal
  const [deleteModalConfig, setDeleteModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    isDeleting: false,
    error: null,
    onConfirm: null,
  })

  // Load all platform data
  const loadAllAdminData = async () => {
    setLoading(true)
    setApiError(null)

    try {
      const [compRes, expRes, qRes, uRes] = await Promise.allSettled([
        companyApi.getCompanies(),
        experienceApi.getAllExperiencesList ? experienceApi.getAllExperiencesList() : experienceApi.getExperiences({ size: 100 }),
        questionApi.getQuestions(),
        userApi.getAllUsers(),
      ])

      // 1. Companies
      if (compRes.status === 'fulfilled') {
        const cList = compRes.value.data?.data || compRes.value.data || compRes.value || []
        setCompanies(Array.isArray(cList) ? cList : [])
      } else {
        console.error('[Admin] Error loading companies:', compRes.reason)
      }

      // 2. Experiences
      if (expRes.status === 'fulfilled') {
        const expData = expRes.value.data?.data || expRes.value.data || expRes.value || []
        const eList = Array.isArray(expData) ? expData : expData.content || []
        setExperiences(eList)
      } else {
        console.error('[Admin] Error loading experiences:', expRes.reason)
      }

      // 3. Questions
      if (qRes.status === 'fulfilled') {
        const qList = qRes.value.data?.data || qRes.value.data || qRes.value || []
        setQuestions(Array.isArray(qList) ? qList : [])
      } else {
        console.error('[Admin] Error loading questions:', qRes.reason)
      }

      // 4. Users
      if (uRes.status === 'fulfilled') {
        const uList = uRes.value.data?.data || uRes.value.data || uRes.value || []
        setUsers(Array.isArray(uList) ? uList : [])
      } else {
        console.error('[Admin] Error loading users:', uRes.reason)
      }
    } catch (err) {
      console.error('[Admin] Critical load error:', err)
      setApiError(err.message || 'Failed to load platform data for admin review.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllAdminData()
  }, [])

  // Auto-dismiss success notification
  const flashSuccess = (msg) => {
    setSuccessBanner(msg)
    setTimeout(() => setSuccessBanner(null), 4000)
  }

  // --- COMPANY MANAGEMENT ACTIONS ---
  const handleOpenCreateCompany = () => {
    setEditingCompany(null)
    setShowCompanyModal(true)
  }

  const handleOpenEditCompany = (company) => {
    setEditingCompany(company)
    setShowCompanyModal(true)
  }

  const handleDeleteCompanyClick = (company) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Company Profile',
      message: 'Are you sure you want to delete this company? Associated interview experiences may be impacted.',
      itemName: company.name,
      isDeleting: false,
      error: null,
      onConfirm: async () => {
        setDeleteModalConfig((prev) => ({ ...prev, isDeleting: true, error: null }))
        try {
          await companyApi.deleteCompany(company.id)
          setCompanies((prev) => prev.filter((c) => c.id !== company.id))
          setDeleteModalConfig((prev) => ({ ...prev, isOpen: false, isDeleting: false }))
          flashSuccess(`Company "${company.name}" deleted successfully.`)
        } catch (err) {
          console.error('[Admin] Delete company error:', err)
          const msg =
            err.data?.message ||
            err.message ||
            (err.status === 403
              ? '403 Forbidden: Insufficient administrative privileges.'
              : 'Failed to delete company profile.')
          setDeleteModalConfig((prev) => ({ ...prev, isDeleting: false, error: msg }))
        }
      },
    })
  }

  // --- EXPERIENCE MODERATION ACTIONS ---
  const handleDeleteExperienceClick = (exp) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Moderate / Delete Interview Experience',
      message: 'As an ADMIN, you are about to remove this interview experience along with its interview rounds and questions.',
      itemName: exp.experienceTitle,
      isDeleting: false,
      error: null,
      onConfirm: async () => {
        setDeleteModalConfig((prev) => ({ ...prev, isDeleting: true, error: null }))
        try {
          await experienceApi.deleteExperience(exp.id)
          setExperiences((prev) => prev.filter((e) => e.id !== exp.id))
          setDeleteModalConfig((prev) => ({ ...prev, isOpen: false, isDeleting: false }))
          flashSuccess(`Experience "${exp.experienceTitle}" deleted successfully.`)
        } catch (err) {
          console.error('[Admin] Delete experience error:', err)
          const msg =
            err.data?.message ||
            err.message ||
            'Failed to moderate/delete interview experience.'
          setDeleteModalConfig((prev) => ({ ...prev, isDeleting: false, error: msg }))
        }
      },
    })
  }


  // --- USER MANAGEMENT ACTIONS ---
  const handleDeleteUserClick = (targetUser) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Remove Candidate User Account',
      message: `Are you sure you want to permanently delete candidate account "${targetUser.name}" (${targetUser.email})? This action cannot be undone.`,
      itemName: targetUser.name,
      isDeleting: false,
      error: null,
      onConfirm: async () => {
        setDeleteModalConfig((prev) => ({ ...prev, isDeleting: true, error: null }))
        try {
          await userApi.deleteUser(targetUser.id)
          setUsers((prev) => prev.filter((u) => u.id !== targetUser.id))
          setDeleteModalConfig((prev) => ({ ...prev, isOpen: false, isDeleting: false }))
          flashSuccess(`User account "${targetUser.name}" was removed successfully.`)
        } catch (err) {
          console.error('[Admin] Delete user error:', err)
          const msg =
            err.data?.message ||
            err.message ||
            'Failed to delete user account.'
          setDeleteModalConfig((prev) => ({ ...prev, isDeleting: false, error: msg }))
        }
      },
    })
  }

  // --- QUESTION MODERATION ACTIONS ---
  const handleOpenEditQuestion = (question) => {
    setEditingQuestion(question)
    setShowQuestionModal(true)
  }

  const handleDeleteQuestionClick = (question) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Interview Question',
      message: 'Are you sure you want to permanently delete this interview question from the platform repository?',
      itemName: question.questionText ? `"${question.questionText.substring(0, 60)}..."` : `Question #${question.id}`,
      isDeleting: false,
      error: null,
      onConfirm: async () => {
        setDeleteModalConfig((prev) => ({ ...prev, isDeleting: true, error: null }))
        try {
          await questionApi.deleteQuestion(question.id)
          setQuestions((prev) => prev.filter((q) => q.id !== question.id))
          setDeleteModalConfig((prev) => ({ ...prev, isOpen: false, isDeleting: false }))
          flashSuccess(`Interview question #${question.id} deleted successfully.`)
        } catch (err) {
          console.error('[Admin] Delete question error:', err)
          const msg =
            err.data?.message ||
            err.message ||
            'Failed to delete interview question.'
          setDeleteModalConfig((prev) => ({ ...prev, isDeleting: false, error: msg }))
        }
      },
    })
  }

  // --- FILTERED DATASETS ---
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (!companySearch.trim()) return true
      const q = companySearch.toLowerCase()
      return (
        c.name?.toLowerCase().includes(q) ||
        c.website?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      )
    })
  }, [companies, companySearch])

  const filteredExperiences = useMemo(() => {
    return experiences.filter((e) => {
      const matchesDiff = expDifficultyFilter === 'ALL' || e.overallDifficulty === expDifficultyFilter
      if (!matchesDiff) return false
      if (!expSearch.trim()) return true
      const q = expSearch.toLowerCase()
      return (
        e.experienceTitle?.toLowerCase().includes(q) ||
        e.jobRole?.toLowerCase().includes(q) ||
        e.company?.name?.toLowerCase().includes(q) ||
        e.user?.name?.toLowerCase().includes(q) ||
        e.user?.email?.toLowerCase().includes(q)
      )
    })
  }, [experiences, expSearch, expDifficultyFilter])

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesType = questionTypeFilter === 'ALL' || q.questionType === questionTypeFilter
      if (!matchesType) return false
      if (!questionSearch.trim()) return true
      const s = questionSearch.toLowerCase()
      return (
        q.questionText?.toLowerCase().includes(s) ||
        q.topic?.toLowerCase().includes(s) ||
        q.answer?.toLowerCase().includes(s)
      )
    })
  }, [questions, questionSearch, questionTypeFilter])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (!userSearch.trim()) return true
      const s = userSearch.toLowerCase()
      return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
    })
  }, [users, userSearch])

  if (loading) {
    return (
      <div className="container section" style={{ padding: '4rem 1rem' }} id="admin-loading-state">
        <Loading message="Loading Admin Console & system telemetry..." />
      </div>
    )
  }

  return (
    <div className="container section" id="admin-dashboard-page" style={{ maxWidth: '1240px' }}>
      {/* Top Header & Admin Welcome */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }} id="admin-page-title">
              Admin Console
            </h1>
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.15)',
                color: '#8b5cf6',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
              id="admin-role-badge"
            >
              🛡️ SUPER ADMIN
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Welcome, <strong>{user?.name || 'Administrator'}</strong>{user?.email ? ` (${user.email})` : ''}. Manage hiring organizations, candidate submissions, question banks, and audit telemetry.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAllAdminData}
          className="btn btn-secondary btn-sm"
          id="btn-admin-refresh"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <span>🔄</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Global Alerts */}
      {successBanner && (
        <div
          id="admin-success-banner"
          style={{
            marginBottom: '1.5rem',
            padding: '0.9rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--brand-success, #10b981)',
            color: 'var(--brand-success, #10b981)',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          ✓ {successBanner}
        </div>
      )}

      {apiError && (
        <div
          id="admin-error-banner"
          style={{
            marginBottom: '1.5rem',
            padding: '0.9rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--brand-danger, #ef4444)',
            color: 'var(--brand-danger, #ef4444)',
            fontSize: '0.95rem',
          }}
        >
          ⚠️ {apiError}
        </div>
      )}

      {/* Metric Cards Bar */}
      <div
        className="grid-cards"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        {/* Metric 1: Users */}
        <div
          className="card"
          id="metric-users"
          onClick={() => setActiveTab('users')}
          style={{
            padding: '1.5rem',
            cursor: 'pointer',
            borderColor: activeTab === 'users' ? 'var(--brand-primary)' : undefined,
            boxShadow: activeTab === 'users' ? '0 0 0 1px var(--brand-primary)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL USERS</span>
            <span style={{ fontSize: '1.5rem' }}>👥</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }} id="count-users">
            {users.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered candidates & staff</span>
        </div>

        {/* Metric 2: Companies */}
        <div
          className="card"
          id="metric-companies"
          onClick={() => setActiveTab('companies')}
          style={{
            padding: '1.5rem',
            cursor: 'pointer',
            borderColor: activeTab === 'companies' ? 'var(--brand-primary)' : undefined,
            boxShadow: activeTab === 'companies' ? '0 0 0 1px var(--brand-primary)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>COMPANIES</span>
            <span style={{ fontSize: '1.5rem' }}>🏢</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }} id="count-companies">
            {companies.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Verified tech organizations</span>
        </div>

        {/* Metric 3: Experiences */}
        <div
          className="card"
          id="metric-experiences"
          onClick={() => setActiveTab('experiences')}
          style={{
            padding: '1.5rem',
            cursor: 'pointer',
            borderColor: activeTab === 'experiences' ? 'var(--brand-primary)' : undefined,
            boxShadow: activeTab === 'experiences' ? '0 0 0 1px var(--brand-primary)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>EXPERIENCES</span>
            <span style={{ fontSize: '1.5rem' }}>📝</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }} id="count-experiences">
            {experiences.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Published candidate journeys</span>
        </div>

        {/* Metric 4: Questions */}
        <div
          className="card"
          id="metric-questions"
          onClick={() => setActiveTab('questions')}
          style={{
            padding: '1.5rem',
            cursor: 'pointer',
            borderColor: activeTab === 'questions' ? 'var(--brand-primary)' : undefined,
            boxShadow: activeTab === 'questions' ? '0 0 0 1px var(--brand-primary)' : undefined,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>QUESTIONS</span>
            <span style={{ fontSize: '1.5rem' }}>💡</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary)' }} id="count-questions">
            {questions.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Technical & behavioral prompts</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
        id="admin-tabs"
      >
        <button
          type="button"
          onClick={() => setActiveTab('companies')}
          id="tab-btn-companies"
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'companies' ? '3px solid var(--brand-primary)' : '3px solid transparent',
            borderRadius: '4px 4px 0 0',
            fontWeight: activeTab === 'companies' ? 700 : 500,
            color: activeTab === 'companies' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            padding: '0.75rem 1.25rem',
          }}
        >
          🏢 Companies Management ({companies.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('experiences')}
          id="tab-btn-experiences"
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'experiences' ? '3px solid var(--brand-primary)' : '3px solid transparent',
            borderRadius: '4px 4px 0 0',
            fontWeight: activeTab === 'experiences' ? 700 : 500,
            color: activeTab === 'experiences' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            padding: '0.75rem 1.25rem',
          }}
        >
          📝 Experience Moderation ({experiences.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          id="tab-btn-questions"
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'questions' ? '3px solid var(--brand-primary)' : '3px solid transparent',
            borderRadius: '4px 4px 0 0',
            fontWeight: activeTab === 'questions' ? 700 : 500,
            color: activeTab === 'questions' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            padding: '0.75rem 1.25rem',
          }}
        >
          💡 Questions Bank ({questions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          id="tab-btn-users"
          className="btn btn-ghost"
          style={{
            borderBottom: activeTab === 'users' ? '3px solid var(--brand-primary)' : '3px solid transparent',
            borderRadius: '4px 4px 0 0',
            fontWeight: activeTab === 'users' ? 700 : 500,
            color: activeTab === 'users' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            padding: '0.75rem 1.25rem',
          }}
        >
          👥 Candidate Accounts ({users.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: COMPANIES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'companies' && (
        <section id="section-companies">
          {/* Controls Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '420px' }}>
              <input
                id="search-admin-companies"
                type="text"
                placeholder="Search companies by name, website, keyword..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="form-control"
                style={{ width: '100%' }}
              />
              {companySearch && (
                <button
                  type="button"
                  onClick={() => setCompanySearch('')}
                  className="btn btn-sm btn-ghost"
                  id="btn-clear-comp-search"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenCreateCompany}
              className="btn btn-primary"
              id="btn-create-company"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>➕</span>
              <span>Create Company Profile</span>
            </button>
          </div>

          {/* Companies Table */}
          {filteredCompanies.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }} id="companies-empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏢</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Companies Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {companySearch ? 'No companies match your search query.' : 'There are no companies registered yet.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateCompany}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                Create First Company
              </button>
            </div>
          ) : (
            <div className="card table-responsive" style={{ padding: 0, overflowX: 'auto' }} id="admin-companies-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>ID</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Company</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Website</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Description</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((c) => (
                    <tr
                      key={c.id}
                      id={`admin-company-row-${c.id}`}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>#{c.id}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <CompanyLogo company={c} size={36} />
                          <div>
                            <Link
                              to={`/companies/${c.id}`}
                              style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                              id={`admin-comp-link-${c.id}`}
                            >
                              {c.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {c.website ? (
                          <a
                            href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}
                            id={`admin-comp-web-${c.id}`}
                          >
                            🔗 {c.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '300px' }}>
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {c.description || 'No description provided.'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link
                            to={`/companies/${c.id}`}
                            className="btn btn-sm btn-ghost"
                            id={`btn-view-company-${c.id}`}
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEditCompany(c)}
                            className="btn btn-sm btn-secondary"
                            id={`btn-edit-company-${c.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompanyClick(c)}
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--brand-danger, #ef4444)' }}
                            id={`btn-delete-company-${c.id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: EXPERIENCE MODERATION */}
      {/* ========================================================================= */}
      {activeTab === 'experiences' && (
        <section id="section-experiences">
          {/* Controls Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
              <input
                id="search-admin-experiences"
                type="text"
                placeholder="Search experiences by title, role, company, candidate..."
                value={expSearch}
                onChange={(e) => setExpSearch(e.target.value)}
                className="form-control"
                style={{ minWidth: '280px', flex: 1 }}
              />

              <select
                id="filter-admin-exp-diff"
                value={expDifficultyFilter}
                onChange={(e) => setExpDifficultyFilter(e.target.value)}
                className="form-control"
                style={{ width: '160px' }}
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Experiences Table */}
          {filteredExperiences.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }} id="exp-empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Experiences Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No interview experiences match the active moderation filters.
              </p>
            </div>
          ) : (
            <div className="card table-responsive" style={{ padding: 0, overflowX: 'auto' }} id="admin-experiences-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>ID</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Experience Title & Role</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Company</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Author</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Difficulty</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Result</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExperiences.map((e) => (
                    <tr
                      key={e.id}
                      id={`admin-exp-row-${e.id}`}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>#{e.id}</td>
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '320px' }}>
                        <Link
                          to={`/experiences/${e.id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            display: 'block',
                          }}
                          id={`admin-exp-title-${e.id}`}
                        >
                          {e.experienceTitle}
                        </Link>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          💼 {e.jobRole || 'Software Engineer'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CompanyLogo company={e.company} size={24} />
                          <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
                            {e.company?.name || 'Company'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, display: 'block' }}>{e.user?.name || 'Candidate'}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{e.user?.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          className={`badge ${
                            e.overallDifficulty === 'HARD'
                              ? 'badge-hard'
                              : e.overallDifficulty === 'EASY'
                              ? 'badge-easy'
                              : 'badge-medium'
                          }`}
                        >
                          {e.overallDifficulty}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          className={`badge ${
                            e.result === 'SELECTED'
                              ? 'badge-selected'
                              : e.result === 'REJECTED'
                              ? 'badge-rejected'
                              : 'badge-brand'
                          }`}
                        >
                          {e.result}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                          <Link
                            to={`/experiences/${e.id}`}
                            className="btn btn-sm btn-ghost"
                            id={`btn-mod-view-exp-${e.id}`}
                          >
                            View
                          </Link>
                          <Link
                            to={`/experiences/${e.id}/edit`}
                            className="btn btn-sm btn-secondary"
                            id={`btn-mod-edit-exp-${e.id}`}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperienceClick(e)}
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--brand-danger, #ef4444)' }}
                            id={`btn-mod-delete-exp-${e.id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: QUESTIONS BANK */}
      {/* ========================================================================= */}
      {activeTab === 'questions' && (
        <section id="section-questions">
          {/* Controls Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
              <input
                id="search-admin-questions"
                type="text"
                placeholder="Search questions by prompt text, topic, answer..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="form-control"
                style={{ minWidth: '280px', flex: 1 }}
              />

              <select
                id="filter-admin-q-type"
                value={questionTypeFilter}
                onChange={(e) => setQuestionTypeFilter(e.target.value)}
                className="form-control"
                style={{ width: '180px' }}
              >
                <option value="ALL">All Question Types</option>
                <option value="DSA">DSA</option>
                <option value="JAVA">Java</option>
                <option value="SPRING_BOOT">Spring Boot</option>
                <option value="DATABASE">Database</option>
                <option value="SYSTEM_DESIGN">System Design</option>
                <option value="HR">HR</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Questions Table */}
          {filteredQuestions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }} id="q-empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💡</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Questions Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No interview questions match your search and filter criteria.
              </p>
            </div>
          ) : (
            <div className="card table-responsive" style={{ padding: 0, overflowX: 'auto' }} id="admin-questions-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>ID</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Question Text</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Topic</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Type</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Difficulty</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => (
                    <tr
                      key={q.id}
                      id={`admin-q-row-${q.id}`}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>#{q.id}</td>
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '380px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {q.questionText}
                        </div>
                        {q.answer && (
                          <span
                            style={{
                              display: 'block',
                              color: 'var(--text-secondary)',
                              fontSize: '0.78rem',
                              marginTop: '0.3rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '360px',
                            }}
                          >
                            💡 {q.answer}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {q.topic || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge badge-brand" style={{ fontSize: '0.75rem' }}>
                          {q.questionType}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          className={`badge ${
                            q.difficulty === 'HARD'
                              ? 'badge-hard'
                              : q.difficulty === 'EASY'
                              ? 'badge-easy'
                              : 'badge-medium'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            className="btn btn-sm btn-secondary"
                            id={`btn-edit-q-${q.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestionClick(q)}
                            className="btn btn-sm btn-ghost"
                            style={{ color: 'var(--brand-danger, #ef4444)' }}
                            id={`btn-delete-q-${q.id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: USERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <section id="section-users">
          {/* Controls Bar */}
          <div style={{ marginBottom: '1.5rem', maxWidth: '420px' }}>
            <input
              id="search-admin-users"
              type="text"
              placeholder="Search candidate accounts by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            />
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }} id="users-empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Users Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No candidate accounts match your search query.
              </p>
            </div>
          ) : (
            <div className="card table-responsive" style={{ padding: 0, overflowX: 'auto' }} id="admin-users-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)' }}>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>ID</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Name</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Email</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Role</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>Member Since</th>
                    <th style={{ padding: '0.9rem 1.25rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      id={`admin-user-row-${u.id}`}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>#{u.id}</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.name}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              u.role === 'ADMIN' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: u.role === 'ADMIN' ? '#8b5cf6' : '#3b82f6',
                            border:
                              u.role === 'ADMIN'
                                ? '1px solid rgba(124, 58, 237, 0.3)'
                                : '1px solid rgba(59, 130, 246, 0.3)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {u.role || 'USER'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Platform Member'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {u.id !== user?.id && u.email !== user?.email ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUserClick(u)}
                            className="btn btn-sm"
                            id={`btn-delete-user-${u.id}`}
                            title={`Remove candidate account ${u.name}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              backgroundColor: 'var(--color-danger-bg, #fef2f2)',
                              color: 'var(--color-danger, #dc2626)',
                              border: '1px solid var(--color-danger-border, #fecaca)',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm, 6px)',
                              cursor: 'pointer',
                            }}
                          >
                            <span>🗑️</span>
                            <span>Remove User</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Current Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Company Create/Edit Modal */}
      <CompanyFormModal
        isOpen={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false)
          setEditingCompany(null)
        }}
        company={editingCompany}
        onSuccess={(savedComp) => {
          flashSuccess(
            editingCompany
              ? `Company "${savedComp.name || editingCompany.name}" updated successfully.`
              : `Company "${savedComp.name}" created successfully.`
          )
          loadAllAdminData()
        }}
      />

      {/* 2. Question Edit Modal */}
      <QuestionEditModal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false)
          setEditingQuestion(null)
        }}
        question={editingQuestion}
        onSuccess={(savedQ) => {
          flashSuccess(`Question #${savedQ.id || editingQuestion.id} updated successfully.`)
          loadAllAdminData()
        }}
      />

      {/* 3. Reusable Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        message={deleteModalConfig.message}
        itemName={deleteModalConfig.itemName}
        isDeleting={deleteModalConfig.isDeleting}
        error={deleteModalConfig.error}
        onConfirm={deleteModalConfig.onConfirm}
        onCancel={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false, error: null }))}
        confirmButtonText="Yes"
        cancelButtonText="No"
      />
    </div>
  )
}

export default AdminDashboard
