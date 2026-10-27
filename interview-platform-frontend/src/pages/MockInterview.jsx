import React, { useState, useEffect } from 'react'
import { mockInterviewApi } from '../api'

const POPULAR_ROLES = [
  { role: 'Senior Backend Engineer', domain: 'Distributed Systems & Microservices' },
  { role: 'Full-Stack Software Engineer', domain: 'React & Spring Boot' },
  { role: 'Staff Systems Architect', domain: 'High-Throughput & Scalability' },
  { role: 'Frontend Engineer', domain: 'Web Performance & Modern JS' },
  { role: 'DevOps & Cloud Engineer', domain: 'Kubernetes & Cloud Infrastructure' },
  { role: 'AI / Machine Learning Engineer', domain: 'LLM Systems & Real-time Inference' },
  { role: 'Data Engineer', domain: 'Lakehouse, Spark & Kafka Pipelines' },
  { role: 'Mobile Engineer (Android & iOS)', domain: 'React Native & Mobile Architecture' },
]

export function MockInterview() {
  const [role, setRole] = useState('Senior Backend Engineer')
  const [domain, setDomain] = useState('Distributed Systems & Microservices')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [candidateNotes, setCandidateNotes] = useState('')
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('interviewhub_ai_api_key') || ''
    } catch {
      return ''
    }
  })
  const [showApiSettings, setShowApiSettings] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)

  // Answers keyed by question id
  const [answers, setAnswers] = useState({})
  // Evaluations keyed by question id
  const [evaluations, setEvaluations] = useState({})
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showHints, setShowHints] = useState({})
  const [errorMsg, setErrorMsg] = useState(null)
  const [successToast, setSuccessToast] = useState(null)

  // Countdown timer per question
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerActive, setTimerActive] = useState(false)

  const activeQuestion = questions[currentIdx] || null

  // Real-time draft answer persistence to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('interviewhub_mock_answers')
      if (saved) {
        setAnswers(JSON.parse(saved))
      }
    } catch (e) {
      console.warn('Could not read cached mock answers:', e)
    }
  }, [])

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem('interviewhub_mock_answers', JSON.stringify(answers))
      } catch (e) {
        console.warn('Could not cache mock answers:', e)
      }
    }
  }, [answers])

  // Countdown timer effect
  useEffect(() => {
    let interval = null
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeLeft])

  // Core API caller to generate questions
  const triggerGenerate = async (targetRole, targetDomain, targetDiff, targetNotes) => {
    const r = targetRole || role
    const d = targetDomain || domain
    const diff = targetDiff || difficulty
    const notes = targetNotes !== undefined ? targetNotes : candidateNotes

    setIsLoading(true)
    setErrorMsg(null)
    setEvaluations({})
    setAnswers({})
    setCurrentIdx(0)

    try {
      localStorage.removeItem('interviewhub_mock_answers')
    } catch (e) {
      console.warn('Could not clear cached answers:', e)
    }

    try {
      const res = await mockInterviewApi.generateQuestions({
        role: r,
        domain: d,
        difficulty: diff,
        candidateProfileSummary: notes,
        resumeSnippet: notes,
        apiKey: apiKey.trim() || undefined,
      })
      const qList = res.data?.data || res.data || []
      setQuestions([...qList])
      setCurrentIdx(0)
      if (qList.length > 0) {
        setTimeLeft(qList[0].timeLimitSeconds || 600)
        setTimerActive(true)
        setSuccessToast(`✓ Generated 4 new ${diff} interview questions tailored for ${r}!`)
        setTimeout(() => setSuccessToast(null), 4500)
      }
      setTimeout(() => {
        const el = document.getElementById('mock-active-question')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    } catch (err) {
      console.error('Failed to generate mock interview questions:', err)
      setErrorMsg(err.response?.data?.message || 'Could not connect to AI Mock Interviewer service. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-generate default questions on initial mount
  useEffect(() => {
    triggerGenerate('Senior Backend Engineer', 'Distributed Systems & Microservices', 'MEDIUM', '')
  }, [])

  const handleAddTime = (extraSeconds) => {
    setTimeLeft((prev) => (prev || 0) + extraSeconds)
    setTimerActive(true)
  }

  const handleResetTimer = () => {
    if (activeQuestion) {
      setTimeLeft(activeQuestion.timeLimitSeconds || 600)
      setTimerActive(true)
    }
  }

  const handleRetakeRound = () => {
    if (activeQuestion) {
      setTimeLeft(activeQuestion.timeLimitSeconds || 600)
      setTimerActive(true)
      setEvaluations((prev) => {
        const next = { ...prev }
        delete next[activeQuestion.id]
        return next
      })
    }
  }

  const handleGenerateQuestions = (e) => {
    if (e) e.preventDefault()
    triggerGenerate(role, domain, difficulty, candidateNotes)
  }

  const handleSelectRole = (r) => {
    setRole(r.role)
    setDomain(r.domain)
    triggerGenerate(r.role, r.domain, difficulty, candidateNotes)
  }

  const handleApiKeyChange = (val) => {
    setApiKey(val)
    try {
      localStorage.setItem('interviewhub_ai_api_key', val)
    } catch (e) {
      console.warn('Could not save API key:', e)
    }
  }

  const handleAnswerChange = (qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }))
  }

  const handleToggleHint = (qId) => {
    setShowHints((prev) => ({ ...prev, [qId]: !prev[qId] }))
  }

  const handleEvaluateCurrent = async () => {
    if (!activeQuestion) return
    const currentAnswer = answers[activeQuestion.id] || ''
    if (!currentAnswer.trim()) {
      alert('Please write an answer before requesting AI evaluation.')
      return
    }

    setIsEvaluating(true)
    setErrorMsg(null)
    try {
      const res = await mockInterviewApi.evaluateAnswer({
        questionId: activeQuestion.id,
        question: activeQuestion.question,
        category: activeQuestion.category,
        userAnswer: currentAnswer,
        role,
        apiKey: apiKey.trim() || undefined,
      })
      const evalData = res.data?.data || res.data
      setEvaluations((prev) => ({ ...prev, [activeQuestion.id]: evalData }))
    } catch (err) {
      console.error('Evaluation failed:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to generate instant AI evaluation. Please try again.')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      const nextQ = questions[nextIdx]
      if (nextQ && !evaluations[nextQ.id]) {
        setTimeLeft(nextQ.timeLimitSeconds || 600)
        setTimerActive(true)
      }
    }
  }

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
    }
  }

  const formatTimer = (seconds) => {
    if (seconds === null) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const activeEvaluation = activeQuestion ? evaluations[activeQuestion.id] : null
  const currentAnswer = activeQuestion ? answers[activeQuestion.id] || '' : ''
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0

  return (
    <div className="container section" id="mock-interview-page" style={{ maxWidth: '1100px' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 1rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            color: '#6366f1',
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '0.85rem',
          }}
        >
          <span>🤖</span>
          <span>AI Mock Interview</span>
        </div>

        <h1
          id="mock-interview-title"
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            lineHeight: 1.25,
          }}
        >
          Technical Mock Interview
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Practice high-yield technical and system design questions customized for your target engineering role. Get real-time feedback, rubric scoring, and Staff-level model answers.
        </p>
      </div>

      {/* Role & Configuration Card */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          border: '1px solid var(--border-medium)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        {/* Popular Roles Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Popular Roles (Click any role to load tailored questions immediately):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            {POPULAR_ROLES.map((r) => {
              const isSelected = role === r.role
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleSelectRole(r)}
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.95rem',
                    fontWeight: isSelected ? 800 : 500,
                    border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-medium)',
                    lineHeight: 1.35,
                    whiteSpace: 'normal',
                    textAlign: 'center',
                  }}
                >
                  {r.role}
                </button>
              )
            })}
          </div>
        </div>

        {/* Target Role & Domain Form */}
        <form onSubmit={handleGenerateQuestions}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>
                Target Role
              </label>
              <input
                type="text"
                className="form-control"
                id="mock-role-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Backend Engineer"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>
                Domain / Tech Stack
              </label>
              <input
                type="text"
                className="form-control"
                id="mock-domain-input"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Distributed Systems, Spring Boot, React"
                required
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>
                Difficulty
              </label>
              <select
                className="form-control"
                id="mock-difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="EASY">Junior (1-2 yrs)</option>
                <option value="MEDIUM">Mid / Senior (3-5+ yrs)</option>
                <option value="HARD">Staff / Lead (8+ yrs)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>
              Focus Areas (Optional)
            </label>
            <textarea
              className="form-control"
              id="mock-summary-input"
              rows={2}
              value={candidateNotes}
              onChange={(e) => setCandidateNotes(e.target.value)}
              placeholder="E.g., Kafka partitioning, database sharding, concurrency, WebSockets..."
              style={{ width: '100%', lineHeight: 1.5 }}
            />
          </div>

          {/* Collapsible API Provider Settings */}
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setShowApiSettings((prev) => !prev)}
              className="btn btn-sm btn-ghost"
              style={{
                fontSize: '0.85rem',
                color: 'var(--brand-primary)',
                padding: '0.25rem 0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>⚙️</span>
              <span>{showApiSettings ? 'Hide API Engine Key' : 'Configure Custom API Key (OpenAI, Gemini, Groq)'}</span>
            </button>

            {showApiSettings && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                }}
              >
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', display: 'block' }}>
                  External LLM API Key (Optional)
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="mock-api-key-input"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Paste your OpenAI (sk-...), Gemini (AIza...), or Groq (gsk_...) key"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {apiKey.trim() ? (
                    <span style={{ color: '#10b981', fontWeight: 700 }}>
                      ✓ Custom API key active. Questions will be generated in real-time using live LLM models.
                    </span>
                  ) : (
                    <span>
                      ℹ️ Built-in rotating question bank active. Rotating library guarantees diverse, non-repeating questions on every click.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={isLoading || !role.trim()}
              className="btn btn-primary"
              id="mock-generate-btn"
              style={{
                padding: '0.65rem 1.75rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isLoading ? (
                <>
                  <span className="spinner spinner-sm" />
                  <span>Generating Questions...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>{questions.length > 0 ? 'Generate New Questions' : 'Start Mock Interview'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {errorMsg && (
        <div
          className="alert alert-danger"
          style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successToast && (
        <div
          className="alert alert-success"
          id="mock-success-toast"
          style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
          }}
        >
          <span>🎯</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Interview Loop Questions & Answer Workspace */}
      {questions.length > 0 && activeQuestion && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Question Stepper Header */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#6366f1',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  Round {currentIdx + 1} of {questions.length}
                </span>
                <span
                  className={`badge badge-${activeQuestion.category.toLowerCase()}`}
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem', lineHeight: 1.35 }}
                >
                  {activeQuestion.category.replace('_', ' ')}
                </span>
                <span
                  className={`badge badge-${difficulty.toLowerCase()}`}
                  style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem', lineHeight: 1.35 }}
                >
                  {difficulty}
                </span>
              </div>

              {/* Countdown Timer & Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <div
                  id="mock-timer-display"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: timeLeft === 0 ? '#ef4444' : timeLeft !== null && timeLeft < 120 ? '#ef4444' : 'var(--text-primary)',
                    backgroundColor: timeLeft === 0 ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary)',
                    padding: '0.45rem 0.95rem',
                    borderRadius: 'var(--radius-md)',
                    border: timeLeft === 0 ? '1px solid #ef4444' : '1px solid var(--border-medium)',
                    letterSpacing: '0.04em',
                  }}
                  title={timeLeft === 0 ? "Time's Up!" : timerActive ? 'Timer running' : 'Timer paused'}
                >
                  <span>{formatTimer(timeLeft)}</span>
                  {timeLeft === 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time's Up</span>
                  )}
                  {!timerActive && timeLeft > 0 && (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Paused</span>
                  )}
                </div>

                {/* Pause / Resume Button */}
                <button
                  type="button"
                  id="mock-timer-toggle-btn"
                  onClick={() => setTimerActive((prev) => !prev)}
                  className="btn btn-sm btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.45rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    minWidth: '95px',
                    backgroundColor: !timerActive && timeLeft > 0 ? '#f59e0b' : undefined,
                    borderColor: !timerActive && timeLeft > 0 ? '#f59e0b' : undefined,
                    color: !timerActive && timeLeft > 0 ? '#ffffff' : undefined,
                  }}
                  title={timerActive ? 'Pause the interview countdown' : 'Resume interview timer'}
                >
                  {timerActive ? 'Pause' : 'Resume'}
                </button>

                {/* Reset Timer Button */}
                <button
                  type="button"
                  id="mock-timer-reset-btn"
                  onClick={handleResetTimer}
                  className="btn btn-sm btn-secondary"
                  style={{
                    padding: '0.45rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                  title="Reset timer to original question limit"
                >
                  Reset Timer
                </button>
              </div>
            </div>

            {/* Question Text */}
            <h2
              id="mock-active-question"
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                marginBottom: '1rem',
                wordBreak: 'break-word',
              }}
            >
              {activeQuestion.question}
            </h2>

            {/* Expected Key Points & Hints Drawer */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleToggleHint(activeQuestion.id)}
                className="btn btn-sm btn-ghost"
                id="mock-toggle-hints-btn"
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--brand-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>💡</span>
                <span>{showHints[activeQuestion.id] ? 'Hide Hints' : 'View Hints'}</span>
              </button>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Suggested: 100-250 words with trade-offs
              </div>
            </div>

            {showHints[activeQuestion.id] && activeQuestion.hints && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0284c7', marginBottom: '0.5rem' }}>
                  Interviewer focus:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {activeQuestion.hints.map((hint, hIdx) => (
                    <li key={hIdx}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Answer Writing Pad */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
            }}
          >
            {/* Time's Up Real-time Alert Banner with 1-click Action Options */}
            {timeLeft === 0 && (
              <div
                id="mock-times-up-banner"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontWeight: 800, fontSize: '0.95rem' }}>
                    <span>⏰</span>
                    <span>Time's Up for Round {currentIdx + 1}!</span>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Time limit reached. Submit for scoring, add 5 minutes, or retake the round.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleEvaluateCurrent}
                    disabled={isEvaluating || !currentAnswer.trim()}
                    className="btn btn-sm btn-primary"
                    id="times-up-submit-btn"
                  >
                    📊 Submit for Scoring
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTime(300)}
                    className="btn btn-sm btn-secondary"
                    id="times-up-extend-btn"
                  >
                    ⏳ +5 Mins
                  </button>
                  <button
                    type="button"
                    onClick={handleRetakeRound}
                    className="btn btn-sm btn-ghost"
                    id="times-up-retake-btn"
                  >
                    🔄 Retake Round
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Your Answer:
              </span>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: wordCount >= 50 ? '#10b981' : 'var(--text-secondary)',
                }}
              >
                {wordCount} words
              </span>
            </div>

            <textarea
              id="mock-answer-textarea"
              rows={9}
              className="form-control"
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(activeQuestion.id, e.target.value)}
              placeholder="Write your answer, design details, trade-offs, and edge cases here..."
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.6,
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentIdx === 0}
                  className="btn btn-sm btn-ghost"
                >
                  ← Previous Round
                </button>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={currentIdx === questions.length - 1}
                  className="btn btn-sm btn-ghost"
                >
                  Next Round →
                </button>
              </div>

              <button
                type="button"
                onClick={handleEvaluateCurrent}
                disabled={isEvaluating || !currentAnswer.trim()}
                className="btn btn-primary"
                id="mock-evaluate-btn"
                style={{
                  padding: '0.55rem 1.35rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                {isEvaluating ? (
                  <>
                    <span className="spinner spinner-sm" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>📊</span>
                    <span>Submit for Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Rubric Evaluation Card */}
          {activeEvaluation && (
            <div
              className="card"
              id="mock-evaluation-results"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)',
                border: '2px solid var(--brand-primary)',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {/* Header with Overall Score & Verdict */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingBottom: '1.25rem',
                  borderBottom: '1px solid var(--border-medium)',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Evaluation Result
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color:
                          activeEvaluation.verdict === 'STRONG_HIRE' || activeEvaluation.verdict === 'HIRE'
                            ? '#10b981'
                            : activeEvaluation.verdict === 'LEANING_HIRE'
                            ? '#38bdf8'
                            : '#ef4444',
                      }}
                    >
                      {activeEvaluation.verdict.replace('_', ' ')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      Rubric Score
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{activeEvaluation.overallScore}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.9 }}>/100</span>
                  </div>
                </div>
              </div>

              {/* Rubric Criteria Progress Bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span>Technical Accuracy</span>
                    <span style={{ color: 'var(--brand-primary)' }}>{activeEvaluation.technicalAccuracyScore}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${activeEvaluation.technicalAccuracyScore}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span>Clarity</span>
                    <span style={{ color: '#10b981' }}>{activeEvaluation.clarityScore}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${activeEvaluation.clarityScore}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span>System Design</span>
                    <span style={{ color: '#f59e0b' }}>{activeEvaluation.systemDesignScore}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${activeEvaluation.systemDesignScore}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span>Edge Cases</span>
                    <span style={{ color: '#8b5cf6' }}>{activeEvaluation.edgeCaseHandlingScore}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${activeEvaluation.edgeCaseHandlingScore}%`, height: '100%', backgroundColor: '#8b5cf6', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>

              {/* Summary note */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  marginBottom: '1.25rem',
                  wordBreak: 'break-word',
                }}
              >
                <strong>Summary:</strong> {activeEvaluation.summary}
              </div>

              {/* Strengths and Weaknesses */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#10b981', marginBottom: '0.5rem' }}>
                    Strengths:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {activeEvaluation.strengths?.map((s, sIdx) => (
                      <li key={sIdx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>
                    Areas to Improve:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {activeEvaluation.weaknesses?.map((w, wIdx) => (
                      <li key={wIdx}>{w}</li>
                    ))}
                    {activeEvaluation.missingConcepts?.map((m, mIdx) => (
                      <li key={`m-${mIdx}`}>Missing: {m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Senior Staff Model Answer */}
              {activeEvaluation.modelAnswer && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    border: '1px solid var(--border-medium)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>💡</span>
                    <span>Model Answer:</span>
                  </div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {activeEvaluation.modelAnswer}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MockInterview
