import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import companyApi from '../../api/companyApi'
import experienceApi from '../../api/experienceApi'
import roundApi from '../../api/roundApi'
import questionApi from '../../api/questionApi'
import CompanyLogo from '../common/CompanyLogo'
import CompanyFormModal from '../company/CompanyFormModal'
import CodeCompilerPlayground from '../compiler/CodeCompilerPlayground'
import { getUser } from '../../utils/storage'

export const ROLE_SUGGESTIONS = [
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Developer',
  'SDE II',
  'DevOps Engineer',
  'Mobile Engineer (iOS/Android)',
  'Data Engineer',
]

export const LOOP_TEMPLATES = [
  {
    id: 'faang',
    name: 'FAANG SDE Loop',
    description: '4-round standard loop used by Google, Amazon, and Meta.',
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Online Assessment (OA)',
        roundType: 'ONLINE_ASSESSMENT',
        difficulty: 'HARD',
        description: '90-min algorithmic assessment with 2 LeetCode Medium/Hard problems on arrays & graphs.',
      },
      {
        roundNumber: 2,
        roundName: 'Technical DSA & Problem Solving',
        roundType: 'DSA',
        difficulty: 'HARD',
        description: 'Deep dive into Binary Trees, Graph Traversal, and Dynamic Programming with complexity analysis.',
      },
      {
        roundNumber: 3,
        roundName: 'System Design & Distributed Scalability',
        roundType: 'SYSTEM_DESIGN',
        difficulty: 'HARD',
        description: 'High-level architecture, caching strategies, rate limiting, and database sharding.',
      },
      {
        roundNumber: 4,
        roundName: 'Behavioral & Leadership Principles (HM)',
        roundType: 'MANAGERIAL',
        difficulty: 'MEDIUM',
        description: 'Past projects, conflict resolution, ownership, and cultural alignment.',
      },
    ],
  },
  {
    id: 'fintech',
    name: 'Fintech Backend Loop',
    description: 'High concurrency, ACID guarantees, and distributed systems focus.',
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Machine Coding / Take-Home OA',
        roundType: 'ONLINE_ASSESSMENT',
        difficulty: 'MEDIUM',
        description: 'Low-level design of an in-memory transactional ledger with thread safety.',
      },
      {
        roundNumber: 2,
        roundName: 'Core Engineering & Concurrency',
        roundType: 'TECHNICAL',
        difficulty: 'HARD',
        description: 'Multi-threading, JVM internals, database locks, and isolation levels.',
      },
      {
        roundNumber: 3,
        roundName: 'Distributed Systems & Architecture',
        roundType: 'SYSTEM_DESIGN',
        difficulty: 'HARD',
        description: 'Event-driven streaming with Kafka, idempotent APIs, and fault tolerance.',
      },
      {
        roundNumber: 4,
        roundName: 'Culture & Engineering Leadership',
        roundType: 'HR',
        difficulty: 'EASY',
        description: 'Risk management mindset, engineering ethics, and team collaboration.',
      },
    ],
  },
  {
    id: 'service',
    name: 'Service Company Loop',
    description: 'Foundational 3-round campus & lateral hiring loop.',
    rounds: [
      {
        roundNumber: 1,
        roundName: 'Aptitude & Foundation Coding OA',
        roundType: 'ONLINE_ASSESSMENT',
        difficulty: 'MEDIUM',
        description: 'Quantitative aptitude, logical reasoning, and 2 basic coding problems on strings & arrays.',
      },
      {
        roundNumber: 2,
        roundName: 'Technical Interview (OOP & SQL)',
        roundType: 'TECHNICAL',
        difficulty: 'MEDIUM',
        description: 'Object-oriented programming, SQL joins, database normalization, and web basics.',
      },
      {
        roundNumber: 3,
        roundName: 'Managerial & HR Discussion',
        roundType: 'MANAGERIAL',
        difficulty: 'EASY',
        description: 'Discussion on project experiences, adaptability, shifts, and career aspirations.',
      },
    ],
  },
]

export const INDIVIDUAL_ROUND_TEMPLATES = [
  {
    name: '+ Coding OA',
    roundName: 'Online Assessment (OA)',
    roundType: 'ONLINE_ASSESSMENT',
    difficulty: 'MEDIUM',
    description: 'Timed online coding assessment focusing on data structures and algorithmic speed.',
  },
  {
    name: '+ Technical DSA',
    roundName: 'Technical Problem Solving (DSA)',
    roundType: 'DSA',
    difficulty: 'HARD',
    description: 'Live coding session evaluating problem solving, edge cases, and time/space complexity.',
  },
  {
    name: '+ System Design',
    roundName: 'System Design & Architecture',
    roundType: 'SYSTEM_DESIGN',
    difficulty: 'HARD',
    description: 'Architecture design evaluating scalability, availability, microservices, and storage layers.',
  },
  {
    name: '+ Behavioral / HM',
    roundName: 'Behavioral & Leadership (HM)',
    roundType: 'MANAGERIAL',
    difficulty: 'MEDIUM',
    description: 'Scenario-based behavioral assessment and leadership fit with the engineering manager.',
  },
]
export function ExperienceForm({ initialValues = {}, isEditing = false, onSuccess }) {
  const navigate = useNavigate()
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const descriptionRef = useRef(null)
  const questionAnswerRef = useRef(null)

  const [formData, setFormData] = useState({
    companyId: initialValues.companyId || (initialValues.company?.id ? String(initialValues.company.id) : ''),
    jobRole: initialValues.jobRole || '',
    experienceTitle: initialValues.experienceTitle || '',
    description: initialValues.description || '',
    overallDifficulty: initialValues.overallDifficulty || '',
    result: initialValues.result || '',
    yearsOfExperience:
      initialValues.yearsOfExperience !== undefined && initialValues.yearsOfExperience !== null
        ? String(initialValues.yearsOfExperience)
        : '',
    jobLevel: initialValues.jobLevel || '',
    currency: initialValues.currency || 'USD',
    baseSalary: initialValues.baseSalary ? String(initialValues.baseSalary) : '',
    stockGrant: initialValues.stockGrant ? String(initialValues.stockGrant) : '',
    signingBonus: initialValues.signingBonus ? String(initialValues.signingBonus) : '',
    totalCompensation: initialValues.totalCompensation ? String(initialValues.totalCompensation) : '',
    offerAccepted: initialValues.offerAccepted ?? false,
    preparationTips: '',
  })

  const [wizardRounds, setWizardRounds] = useState([])
  const [wizardQuestions, setWizardQuestions] = useState([])
  const [activeQuestionRoundIdx, setActiveQuestionRoundIdx] = useState(0)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState('DSA')
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState('MEDIUM')
  const [newQuestionTopic, setNewQuestionTopic] = useState('')
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('')

  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [companyLoadError, setCompanyLoadError] = useState(null)

  const [fieldErrors, setFieldErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingStatusText, setSubmittingStatusText] = useState('')
  const [successMessage, setSuccessMessage] = useState(null)

  const handleCompanyCreated = (newCompany) => {
    if (newCompany && newCompany.id) {
      setCompanies((prev) => [newCompany, ...prev.filter((c) => String(c.id) !== String(newCompany.id))])
      setFormData((prev) => ({ ...prev, companyId: String(newCompany.id) }))
      setShowAddCompanyModal(false)
    }
  }

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        companyId: initialValues.companyId || (initialValues.company?.id ? String(initialValues.company.id) : ''),
        jobRole: initialValues.jobRole || '',
        experienceTitle: initialValues.experienceTitle || '',
        description: initialValues.description || '',
        overallDifficulty: initialValues.overallDifficulty || '',
        result: initialValues.result || '',
        yearsOfExperience:
          initialValues.yearsOfExperience !== undefined && initialValues.yearsOfExperience !== null
            ? String(initialValues.yearsOfExperience)
            : '',
        jobLevel: initialValues.jobLevel || '',
        currency: initialValues.currency || 'USD',
        baseSalary: initialValues.baseSalary ? String(initialValues.baseSalary) : '',
        stockGrant: initialValues.stockGrant ? String(initialValues.stockGrant) : '',
        signingBonus: initialValues.signingBonus ? String(initialValues.signingBonus) : '',
        totalCompensation: initialValues.totalCompensation ? String(initialValues.totalCompensation) : '',
        offerAccepted: initialValues.offerAccepted ?? false,
        preparationTips: '',
      })
    }
  }, [initialValues])

  useEffect(() => {
    let isMounted = true
    const fetchCompanies = async () => {
      setLoadingCompanies(true)
      setCompanyLoadError(null)
      try {
        const res = await companyApi.getCompanies()
        const compList = res.data || res || []
        if (isMounted) {
          setCompanies(Array.isArray(compList) ? compList : [])
        }
      } catch (err) {
        console.error('[ExperienceForm] Failed to load companies:', err)
        if (isMounted) {
          setCompanyLoadError('Failed to load registered companies. Please try again.')
        }
      } finally {
        if (isMounted) setLoadingCompanies(false)
      }
    }

    fetchCompanies()
    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
    if (apiError) setApiError(null)
  }

  const handleApplyLoopTemplate = (tmpl) => {
    setWizardRounds(tmpl.rounds.map((r, i) => ({ ...r, roundNumber: i + 1 })))
  }

  const handleAddIndividualRound = (roundTemplate) => {
    setWizardRounds((prev) => [
      ...prev,
      {
        roundNumber: prev.length + 1,
        roundName: roundTemplate.roundName,
        roundType: roundTemplate.roundType,
        difficulty: roundTemplate.difficulty,
        description: roundTemplate.description,
      },
    ])
  }

  const handleRemoveRound = (idx) => {
    setWizardRounds((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, roundNumber: i + 1 }))
    )
  }

  const insertMarkdown = (ref, fieldName, before, after = '', placeholder = '') => {
    const textarea = ref.current
    if (!textarea) return

    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const currentValue = textarea.value || ''
    const selectedText = currentValue.substring(start, end) || placeholder
    const replacement = `${before}${selectedText}${after}`

    const newValue = currentValue.substring(0, start) + replacement + currentValue.substring(end)
    handleChange(fieldName, newValue)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 50)
  }

  const insertMarkdownForQuestion = (ref, before, after = '', placeholder = '') => {
    const textarea = ref.current
    if (!textarea) return
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const currentValue = textarea.value || ''
    const selectedText = currentValue.substring(start, end) || placeholder
    const replacement = `${before}${selectedText}${after}`
    const newValue = currentValue.substring(0, start) + replacement + currentValue.substring(end)
    setNewQuestionAnswer(newValue)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 50)
  }

  const handleAddQuestionToRound = () => {
    if (!newQuestionText.trim()) return
    setWizardQuestions((prev) => [
      ...prev,
      {
        roundIndex: activeQuestionRoundIdx,
        roundNumber: activeQuestionRoundIdx + 1,
        questionText: newQuestionText.trim(),
        questionType: newQuestionType,
        difficulty: newQuestionDifficulty,
        topic: newQuestionTopic.trim() || 'General',
        answer: newQuestionAnswer.trim(),
      },
    ])
    setNewQuestionText('')
    setNewQuestionTopic('')
    setNewQuestionAnswer('')
  }

  const handleRemoveQuestion = (idx) => {
    setWizardQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.companyId) {
      errors.companyId = 'Please select the hiring company'
    }

    if (!formData.jobRole || !formData.jobRole.trim()) {
      errors.jobRole = 'Job role is required'
    }

    if (!formData.experienceTitle || !formData.experienceTitle.trim()) {
      errors.experienceTitle = 'Experience title is required'
    }

    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Experience description is required'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setApiError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmittingStatusText(isEditing ? 'Updating experience...' : 'Publishing interview experience...')

    try {
      const base = formData.baseSalary ? Number(formData.baseSalary) : null
      const stock = formData.stockGrant ? Number(formData.stockGrant) : null
      const bonus = formData.signingBonus ? Number(formData.signingBonus) : null
      let total = formData.totalCompensation ? Number(formData.totalCompensation) : null
      if (!total && (base || stock || bonus)) {
        total = (base || 0) + (stock || 0) + (bonus || 0)
      }

      const payload = {
        companyId: Number(formData.companyId),
        jobRole: formData.jobRole.trim(),
        experienceTitle: formData.experienceTitle.trim(),
        description: formData.description.trim(),
        overallDifficulty: formData.overallDifficulty || 'MEDIUM',
        result: formData.result || 'WAITING',
        yearsOfExperience: formData.yearsOfExperience ? Number(formData.yearsOfExperience) : 0,
        jobLevel: formData.jobLevel ? formData.jobLevel.trim() : null,
        currency: formData.currency || 'USD',
        baseSalary: base,
        stockGrant: stock,
        signingBonus: bonus,
        totalCompensation: total,
        offerAccepted: Boolean(formData.offerAccepted),
      }

      let res
      if (isEditing) {
        res = await experienceApi.updateExperience(initialValues.id, payload)
      } else {
        res = await experienceApi.createExperience(payload)
      }

      const createdExp = res.data || res

      if (!isEditing && createdExp && createdExp.id && wizardRounds.length > 0) {
        setSubmittingStatusText('Saving interview rounds & questions...')
        for (let i = 0; i < wizardRounds.length; i++) {
          const r = wizardRounds[i]
          try {
            const roundRes = await roundApi.createRound(createdExp.id, {
              roundNumber: r.roundNumber || i + 1,
              roundName: r.roundName,
              roundType: r.roundType || 'TECHNICAL',
              difficulty: r.difficulty || 'MEDIUM',
              description: r.description || '',
            })
            const createdRound = roundRes?.data || roundRes

            const questionsForThisRound = wizardQuestions.filter((q) => q.roundIndex === i)
            if (createdRound?.id && questionsForThisRound.length > 0) {
              for (const q of questionsForThisRound) {
                try {
                  await questionApi.createQuestion(createdRound.id, {
                    questionText: q.questionText,
                    questionType: q.questionType === 'DSA' ? 'DSA' : q.questionType === 'SYSTEM_DESIGN' ? 'SYSTEM_DESIGN' : q.questionType === 'BEHAVIORAL' ? 'BEHAVIORAL' : 'OTHER',
                    difficulty: q.difficulty || 'MEDIUM',
                    topic: q.topic || 'General',
                    answer: q.answer || '',
                  })
                } catch (qErr) {
                  console.warn('Failed to save question:', qErr)
                }
              }
            }
          } catch (rErr) {
            console.warn('Failed to save round:', rErr)
          }
        }
      }

      if (!isEditing && createdExp && createdExp.id) {
        try {
          const companyObj = companies.find((c) => String(c.id) === String(formData.companyId));
          const eventData = {
            id: createdExp.id,
            authorName: (typeof getUser === 'function' ? getUser()?.name : null) || 'A candidate',
            companyName: companyObj?.name || 'Tech Company',
            jobRole: formData.jobRole,
          };
          window.dispatchEvent(new CustomEvent('interviewhub_experience_published', { detail: eventData }));
          localStorage.setItem('interviewhub_experience_published_event', JSON.stringify({
            ...eventData,
            _ts: Date.now(),
          }));
        } catch (e) {
          console.warn('Failed to dispatch experience broadcast', e);
        }
      }

      setSuccessMessage(isEditing ? 'Experience updated successfully!' : 'Experience published successfully!')
      if (onSuccess) {
        onSuccess(createdExp)
      } else {
        setTimeout(() => {
          navigate(createdExp?.id ? `/experiences/${createdExp.id}` : '/experiences')
        }, 1200)
      }
    } catch (err) {
      console.error('[ExperienceForm] Submission error:', err)
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to save experience. Please check your network or try again.'
      setApiError(message)
    } finally {
      setIsSubmitting(false)
      setSubmittingStatusText('')
    }
  }

  const selectedCompany = companies.find((c) => String(c.id) === String(formData.companyId))

  const isStepCompleted = (stepNum) => {
    switch (stepNum) {
      case 1:
        // Only show green tickmark if company is selected and role is filled
        return Boolean(formData.companyId && formData.jobRole && formData.jobRole.trim())
      case 2:
        return wizardRounds.length > 0
      case 3:
        return Boolean(formData.description && formData.description.trim())
      case 4:
        return Boolean(formData.result && formData.overallDifficulty)
      default:
        return false
    }
  }

  const stepsMeta = [
    { num: 1, title: 'Company & Role', subtitle: 'Target employer & position' },
    { num: 2, title: 'The Interview Loop', subtitle: '1-click round templates' },
    { num: 3, title: 'Questions & Solutions', subtitle: 'DSA problems & code playground' },
    { num: 4, title: 'Outcome & Tips', subtitle: 'Offer status & preparation advice' },
  ]
  return (
    <div className="wizard-container">
      {showAddCompanyModal && (
        <CompanyFormModal
          isOpen={showAddCompanyModal}
          onClose={() => setShowAddCompanyModal(false)}
          onSuccess={handleCompanyCreated}
        />
      )}

      {/* Stepper Navigation Bar */}
      <div className="wizard-stepper" id="experience-wizard-stepper">
        <div className="wizard-stepper-grid">
          {stepsMeta.map((s) => {
            const isActive = currentStep === s.num
            const isCompleted = isStepCompleted(s.num)
            return (
              <button
                key={s.num}
                type="button"
                id={`wizard-step-btn-${s.num}`}
                onClick={() => setCurrentStep(s.num)}
                className={`wizard-step-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className={`wizard-step-badge ${isCompleted ? 'completed' : ''}`}>
                  {isCompleted ? '✓' : s.num}
                </div>
                <div className="wizard-step-text">
                  <div className="wizard-step-title">{s.title}</div>
                  <div className="wizard-step-subtitle">{s.subtitle}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Form Container Card */}
      <form onSubmit={handleSubmit} className="wizard-card" id="experience-form">
        {apiError && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)', fontSize: '0.875rem' }}>
            <span>⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success)', fontSize: '0.875rem' }}>
            <span>✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Company & Role */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <div className="wizard-section-header">
            <h2 className="wizard-section-title">
              <span>🏢</span> Step 1: Target Company & Role
            </h2>
            <p className="wizard-section-desc">
              Select the hiring organization and position you interviewed for.
            </p>
          </div>

          {/* Hiring Company */}
          <div className="wizard-field-group">
            <div className="wizard-field-header">
              <label htmlFor="input-company-id" className="wizard-label">
                Hiring Company <span className="req">*</span>
              </label>
              <button
                type="button"
                id="btn-add-new-company-form"
                onClick={() => setShowAddCompanyModal(true)}
                className="btn-add-company-pill"
              >
                <span className="btn-add-company-pill-plus">+</span> Can't find company? Add Company
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {selectedCompany && (
                <div style={{ flexShrink: 0 }}>
                  <CompanyLogo company={selectedCompany} size="md" />
                </div>
              )}
              <select
                id="input-company-id"
                value={formData.companyId}
                onChange={(e) => handleChange('companyId', e.target.value)}
                disabled={loadingCompanies}
                className="wizard-select"
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {companyLoadError && <div className="wizard-error-msg">{companyLoadError}</div>}
            {fieldErrors.companyId && <div className="wizard-error-msg">{fieldErrors.companyId}</div>}
          </div>

          {/* Job Role */}
          <div className="wizard-field-group">
            <label htmlFor="input-job-role" className="wizard-label">
              Job Role <span className="req">*</span>
            </label>
            <input
              id="input-job-role"
              type="text"
              placeholder="Senior Software Engineer"
              value={formData.jobRole}
              onChange={(e) => handleChange('jobRole', e.target.value)}
              className="wizard-input"
            />
            {fieldErrors.jobRole && <div className="wizard-error-msg">{fieldErrors.jobRole}</div>}

            {/* Role Suggestion Pills */}
            <div className="wizard-pills-row">
              <span className="wizard-pill-label">Role Suggestions:</span>
              {ROLE_SUGGESTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleChange('jobRole', role)}
                  className={`wizard-pill ${formData.jobRole === role ? 'active' : ''}`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Headline */}
          <div className="wizard-field-group">
            <div className="wizard-field-header">
              <label htmlFor="input-title" className="wizard-label">
                Experience Headline <span className="req">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const comp = companies.find((c) => String(c.id) === String(formData.companyId))
                  const compName = comp ? comp.name : 'Tech'
                  const role = formData.jobRole || 'Software Engineer'
                  handleChange('experienceTitle', `${compName} ${role} Interview Loop (2026)`)
                }}
                className="wizard-helper-btn"
              >
                ✨ Auto-suggest Title
              </button>
            </div>
            <input
              id="input-title"
              type="text"
              placeholder="Title of interview loop"
              value={formData.experienceTitle}
              onChange={(e) => handleChange('experienceTitle', e.target.value)}
              className="wizard-input"
            />
            {fieldErrors.experienceTitle && <div className="wizard-error-msg">{fieldErrors.experienceTitle}</div>}
          </div>

          {/* Years of Experience */}
          <div className="wizard-field-group">
            <label htmlFor="input-yoe" className="wizard-label">
              Years of Experience (YOE)
            </label>
            <input
              id="input-yoe"
              type="number"
              min="0"
              max="40"
              placeholder="4"
              value={formData.yearsOfExperience}
              onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
              className="wizard-input"
              style={{ maxWidth: '220px' }}
            />
            <div className="wizard-pills-row">
              {['0 (Fresher)', '1-2 yrs', '3-5 yrs', '6-8 yrs', '8+ yrs'].map((chip, idx) => {
                const vals = ['0', '2', '4', '7', '10']
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChange('yearsOfExperience', vals[idx])}
                    className={`wizard-pill ${formData.yearsOfExperience === vals[idx] ? 'active' : ''}`}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* STEP 2: The Interview Loop */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <div className="wizard-section-header">
            <h2 className="wizard-section-title">
              <span>🔄</span> Step 2: The Interview Loop
            </h2>
            <p className="wizard-section-desc">
              Pre-fill standard round structures with 1-click templates or assemble rounds individually.
            </p>
          </div>

          {/* 1-Click Loop Templates */}
          <div className="wizard-field-group">
            <label className="wizard-label">1-Click Loop Templates (Instant Pre-fill):</label>
            <div className="wizard-template-grid">
              {LOOP_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  id={`loop-template-${tmpl.id}`}
                  onClick={() => handleApplyLoopTemplate(tmpl)}
                  className="wizard-template-card"
                >
                  <div className="wizard-template-card-header">
                    <span className="wizard-template-name">{tmpl.name}</span>
                    <span className="wizard-template-rounds-badge">{tmpl.rounds.length} Rounds</span>
                  </div>
                  <p className="wizard-template-desc">{tmpl.description}</p>
                  <div className="wizard-template-action">⚡ Click to pre-fill</div>
                </button>
              ))}
            </div>
          </div>

          {/* Individual Round Adder */}
          <div className="wizard-individual-rounds-bar">
            <span className="wizard-pill-label">Add Individual Round:</span>
            {INDIVIDUAL_ROUND_TEMPLATES.map((irt) => (
              <button
                key={irt.name}
                type="button"
                onClick={() => handleAddIndividualRound(irt)}
                className="btn btn-secondary btn-sm"
              >
                {irt.name}
              </button>
            ))}
          </div>

          {/* Configured Loop Display */}
          {wizardRounds.length > 0 && (
            <div className="wizard-rounds-list">
              <div className="wizard-rounds-list-header">
                <span>Configured Loop ({wizardRounds.length} Rounds)</span>
                <button
                  type="button"
                  onClick={() => setWizardRounds([])}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear all rounds
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {wizardRounds.map((rnd, idx) => (
                  <div key={idx} className="wizard-round-item">
                    <div className="wizard-round-info">
                      <div className="wizard-round-header">
                        <span className="wizard-round-num">Round {rnd.roundNumber || idx + 1}:</span>
                        <span className="wizard-round-name">{rnd.roundName}</span>
                        <span className="wizard-round-type">{rnd.roundType}</span>
                      </div>
                      <p className="wizard-round-desc">{rnd.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRound(idx)}
                      className="btn btn-sm btn-ghost text-danger"
                      title="Delete round"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    >
                      <span>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Description */}
          <div className="wizard-field-group">
            <div className="wizard-field-header">
              <label htmlFor="input-description" className="wizard-label">
                Detailed Description <span className="req">*</span>
              </label>
              <div className="markdown-toolbar">
                <button
                  type="button"
                  onClick={() => insertMarkdown(descriptionRef, 'description', '\n```javascript\n// Code solution\n```\n')}
                  className="markdown-tool-btn"
                  title="Add Code Block"
                >
                  💻 Code
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown(descriptionRef, 'description', '\n- ', '', 'Bullet item')}
                  className="markdown-tool-btn"
                  title="Add Bullet List"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown(descriptionRef, 'description', '**', '**', 'Bold text')}
                  className="markdown-tool-btn"
                  title="Bold"
                >
                  𝐁 Bold
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown(descriptionRef, 'description', '\n### Problem Statement\n', '', 'Describe the exact challenge asked...')}
                  className="markdown-tool-btn"
                  title="Problem Statement"
                >
                  📝 Problem
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown(descriptionRef, 'description', '\n**Test Case:**\n- Input: \n- Output: \n') }
                  className="markdown-tool-btn"
                  title="Test Case"
                >
                  🧪 Test Case
                </button>
              </div>
            </div>
            <textarea
              id="input-description"
              ref={descriptionRef}
              rows={7}
              placeholder="Share an end-to-end breakdown of the interview experience, communication with the recruiter, questions asked in each round, bar raiser expectations, and overall impressions..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="wizard-textarea"
              style={{ fontFamily: 'var(--font-mono)', minHeight: '180px' }}
            />
            {fieldErrors.description && <div className="wizard-error-msg">{fieldErrors.description}</div>}
          </div>
        </div>
        {/* STEP 3: Questions & Solutions */}
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <div className="wizard-section-header">
            <h2 className="wizard-section-title">
              <span>💻</span> Step 3: Specific Questions & Code Playground
            </h2>
            <p className="wizard-section-desc">
              Attach coding problems, system design challenges, or test solutions in the interactive code playground.
            </p>
          </div>

          {/* Question Adder */}
          <div className="wizard-question-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Add Specific Round Question:
              </span>
              {wizardRounds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Attach to:</span>
                  <select
                    value={activeQuestionRoundIdx}
                    onChange={(e) => setActiveQuestionRoundIdx(Number(e.target.value))}
                    className="wizard-select"
                    style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    {wizardRounds.map((r, i) => (
                      <option key={i} value={i}>
                        Round {r.roundNumber || i + 1} ({r.roundType})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Problem statement or question"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              className="wizard-input"
            />

            <div className="wizard-question-grid">
              <div>
                <label className="wizard-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Type</label>
                <select
                  value={newQuestionType}
                  onChange={(e) => setNewQuestionType(e.target.value)}
                  className="wizard-select"
                >
                  <option value="DSA">DSA & Algorithms</option>
                  <option value="SYSTEM_DESIGN">System Design</option>
                  <option value="TECHNICAL">Technical / Core CS</option>
                  <option value="BEHAVIORAL">Behavioral / HR</option>
                </select>
              </div>

              <div>
                <label className="wizard-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Difficulty</label>
                <select
                  value={newQuestionDifficulty}
                  onChange={(e) => setNewQuestionDifficulty(e.target.value)}
                  className="wizard-select"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label className="wizard-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Topic</label>
                <input
                  type="text"
                  placeholder="Dynamic Programming"
                  value={newQuestionTopic}
                  onChange={(e) => setNewQuestionTopic(e.target.value)}
                  className="wizard-input"
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="wizard-label" style={{ fontSize: '0.75rem' }}>Solution Approach or Code Notes:</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => insertMarkdownForQuestion(questionAnswerRef, '\n```javascript\n// Solution\n```\n')}
                    className="markdown-tool-btn"
                  >
                    💻 Code
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownForQuestion(questionAnswerRef, '**', '**', 'Optimal O(n)')}
                    className="markdown-tool-btn"
                  >
                    𝐁 Complexity
                  </button>
                </div>
              </div>
              <textarea
                ref={questionAnswerRef}
                rows={3}
                placeholder="Explain the time/space complexity or write pseudo-code..."
                value={newQuestionAnswer}
                onChange={(e) => setNewQuestionAnswer(e.target.value)}
                className="wizard-textarea"
                style={{ fontFamily: 'var(--font-mono)', minHeight: '90px' }}
              />
            </div>

            <button
              type="button"
              onClick={handleAddQuestionToRound}
              disabled={!newQuestionText.trim()}
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start' }}
            >
              + Add Question to Experience
            </button>
          </div>

          {/* List of Added Questions */}
          {wizardQuestions.length > 0 && (
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Added Questions ({wizardQuestions.length}):
              </div>
              {wizardQuestions.map((q, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{q.questionText}</span>
                      <span className="badge badge-brand">{q.difficulty}</span>
                      <span className="badge badge-brand">{q.topic}</span>
                    </div>
                    {q.answer && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{q.answer}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="btn btn-sm btn-ghost text-danger"
                    title="Delete question"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Embedded Replit-Style Code Playground */}
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', backgroundColor: 'var(--bg-subtle)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span>⚡</span> Live Code Playground Sandbox
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Test your code solutions live or refine algorithms before embedding into your experience.
              </p>
            </div>
            <CodeCompilerPlayground initialLanguage="javascript" />
          </div>
        </div>

        {/* STEP 4: Outcome & Tips */}
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          <div className="wizard-section-header">
            <h2 className="wizard-section-title">
              <span>🎯</span> Step 4: Outcome & Preparation Advice
            </h2>
            <p className="wizard-section-desc">
              Finalize overall difficulty, offer status, and review your submission before publishing.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Result Status */}
            <div className="wizard-field-group">
              <label htmlFor="input-result" className="wizard-label">
                Result Status <span className="req">*</span>
              </label>
              <select
                id="input-result"
                value={formData.result}
                onChange={(e) => handleChange('result', e.target.value)}
                className="wizard-select"
              >
                <option value="">Select Result Status</option>
                <option value="SELECTED">SELECTED (Offer Received)</option>
                <option value="REJECTED">REJECTED</option>
                <option value="WAITING">WAITING (Under Review / In Progress)</option>
                <option value="WITHDRAWN">WITHDRAWN</option>
              </select>

              {/* Quick Outcome Badges */}
              <div className="wizard-outcome-grid">
                {[
                  { val: 'SELECTED', label: 'Selected' },
                  { val: 'REJECTED', label: 'Rejected' },
                  { val: 'WAITING', label: 'Waiting' },
                  { val: 'WITHDRAWN', label: 'Withdrawn' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handleChange('result', item.val)}
                    className={`wizard-outcome-btn ${formData.result === item.val ? 'active' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Difficulty */}
            <div className="wizard-field-group">
              <label htmlFor="input-difficulty" className="wizard-label">
                Difficulty <span className="req">*</span>
              </label>
              <select
                id="input-difficulty"
                value={formData.overallDifficulty}
                onChange={(e) => handleChange('overallDifficulty', e.target.value)}
                className="wizard-select"
              >
                <option value="">Select Difficulty</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>

              {/* Quick Difficulty Pills */}
              <div className="wizard-difficulty-grid">
                {[
                  { val: 'EASY', label: 'Easy' },
                  { val: 'MEDIUM', label: 'Medium' },
                  { val: 'HARD', label: 'Hard' },
                ].map((diff) => (
                  <button
                    key={diff.val}
                    type="button"
                    onClick={() => handleChange('overallDifficulty', diff.val)}
                    className={`wizard-difficulty-btn ${formData.overallDifficulty === diff.val ? 'active' : ''}`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Verified Offer & Salary Breakdown (Optional & Anonymous) */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-medium)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.2rem' }}>💰</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Verified Offer & Compensation Breakdown (Optional)
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Share your compensation package to help other engineers benchmark company pay bands. All data is anonymous.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="wizard-label" htmlFor="input-salary-currency">
                  Currency
                </label>
                <select
                  id="input-salary-currency"
                  className="wizard-select"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="SGD">SGD ($) - Singapore Dollar</option>
                </select>
              </div>

              <div>
                <label className="wizard-label" htmlFor="input-salary-level">
                  Job Level / Grade
                </label>
                <input
                  type="text"
                  id="input-salary-level"
                  className="wizard-input"
                  placeholder="L4 / SDE II / Senior"
                  value={formData.jobLevel}
                  onChange={(e) => handleChange('jobLevel', e.target.value)}
                />
              </div>

              <div>
                <label className="wizard-label" htmlFor="input-base-salary">
                  Base Salary (Annual)
                </label>
                <input
                  type="number"
                  id="input-base-salary"
                  className="wizard-input"
                  placeholder="150000"
                  value={formData.baseSalary}
                  onChange={(e) => handleChange('baseSalary', e.target.value)}
                />
              </div>

              <div>
                <label className="wizard-label" htmlFor="input-stock-grant">
                  Stock / Equity Grant (Annual/4-Yr)
                </label>
                <input
                  type="number"
                  id="input-stock-grant"
                  className="wizard-input"
                  placeholder="40000"
                  value={formData.stockGrant}
                  onChange={(e) => handleChange('stockGrant', e.target.value)}
                />
              </div>

              <div>
                <label className="wizard-label" htmlFor="input-signing-bonus">
                  Signing / Performance Bonus
                </label>
                <input
                  type="number"
                  id="input-signing-bonus"
                  className="wizard-input"
                  placeholder="20000"
                  value={formData.signingBonus}
                  onChange={(e) => handleChange('signingBonus', e.target.value)}
                />
              </div>

              <div>
                <label className="wizard-label" htmlFor="input-total-comp">
                  Total Compensation (CTC / yr)
                </label>
                <input
                  type="number"
                  id="input-total-comp"
                  className="wizard-input"
                  placeholder="Auto-calculated if blank"
                  value={formData.totalCompensation}
                  onChange={(e) => handleChange('totalCompensation', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <input
                type="checkbox"
                id="input-offer-accepted"
                checked={formData.offerAccepted}
                onChange={(e) => handleChange('offerAccepted', e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="input-offer-accepted" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
                I accepted this offer and joined the company
              </label>
            </div>
          </div>

          {/* Preparation Tips & Resources */}
          <div className="wizard-field-group">
            <label htmlFor="input-tips" className="wizard-label">
              Preparation Tips & Recommended Resources
            </label>
            <textarea
              id="input-tips"
              rows={4}
              placeholder="Key preparation topics and focus areas for candidates"
              value={formData.preparationTips}
              onChange={(e) => handleChange('preparationTips', e.target.value)}
              className="wizard-textarea"
              style={{ minHeight: '110px' }}
            />
          </div>

          {/* Review Summary Card */}
          <div className="wizard-summary-card">
            <div className="wizard-summary-title">📋 Experience Summary Check</div>
            <div className="wizard-summary-grid">
              <div className="wizard-summary-item">
                <span className="wizard-summary-label">Company</span>
                <span className="wizard-summary-val">{selectedCompany?.name || 'Not selected'}</span>
              </div>
              <div className="wizard-summary-item">
                <span className="wizard-summary-label">Role</span>
                <span className="wizard-summary-val">{formData.jobRole || 'Not specified'}</span>
              </div>
              <div className="wizard-summary-item">
                <span className="wizard-summary-label">Interview Rounds</span>
                <span className="wizard-summary-val" style={{ color: 'var(--brand-primary)' }}>{wizardRounds.length} Rounds</span>
              </div>
              <div className="wizard-summary-item">
                <span className="wizard-summary-label">Questions Logged</span>
                <span className="wizard-summary-val" style={{ color: 'var(--color-success)' }}>{wizardQuestions.length} Questions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Bottom Action Bar */}
        <div className="wizard-actions-bar">
          <button
            type="button"
            id="btn-cancel-experience"
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
          >
            Cancel
          </button>

          <div className="wizard-actions-right">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="btn btn-secondary"
              >
                ← Back
              </button>
            )}

            {currentStep < 4 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                className="btn btn-secondary"
              >
                Continue to Next Step →
              </button>
            )}

            <button
              type="submit"
              id="btn-submit-experience"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '0.8rem 1.6rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              {isSubmitting
                ? submittingStatusText || 'Saving...'
                : isEditing
                ? 'Update Experience 💾'
                : 'Publish Experience 🚀'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ExperienceForm
