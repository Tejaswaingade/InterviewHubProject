import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { mockInterviewApi } from '../api'

const POPULAR_ROLES = [
  { role: 'Senior Backend Engineer', domain: 'Distributed Systems & Microservices' },
  { role: 'Full-Stack Software Engineer', domain: 'React & Spring Boot' },
  { role: 'Staff Systems Architect', domain: 'High-Throughput & Scalability' },
  { role: 'Frontend Engineer', domain: 'Web Performance & Modern JS' },
  { role: 'DevOps & Cloud Engineer', domain: 'Kubernetes & Cloud Infrastructure' },
]

export function MockInterview() {
  const [role, setRole] = useState('Senior Backend Engineer')
  const [domain, setDomain] = useState('Distributed Systems & Microservices')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [candidateNotes, setCandidateNotes] = useState('')

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

  // Countdown timer per question
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerActive, setTimerActive] = useState(false)

  const activeQuestion = questions[currentIdx] || null

  useEffect(() => {
    let interval = null
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, timeLeft])

  const handleGenerateQuestions = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setEvaluations({})
    setAnswers({})
    setCurrentIdx(0)

    try {
      const res = await mockInterviewApi.generateQuestions({
        role,
        domain,
        difficulty,
        candidateProfileSummary: candidateNotes,
      })
      const qList = res.data?.data || res.data || []
      setQuestions(qList)
      if (qList.length > 0) {
        setTimeLeft(qList[0].timeLimitSeconds || 600)
        setTimerActive(true)
      }
    } catch (err) {
      console.error('Failed to generate mock interview questions:', err)
      setErrorMsg(err.response?.data?.message || 'Could not connect to AI Mock Interviewer service. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectRole = (r) => {
    setRole(r.role)
    setDomain(r.domain)
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
      alert('Please write an answer before requesting AI feedback.')
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
            fontSize: '0.85rem',
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
            lineHeight: 1.2,
          }}
        >
          Technical Mock Interview
        </h1>

        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            maxWidth: '640px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Practice interview questions tailored to your role. Get instant scores, detailed feedback, and model answers.
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
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
            Popular Roles:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.85rem',
                  }}
                >
                  {r.role}
                </button>
              )
            })}
          </div>
        </div>

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
                placeholder="e.g. Senior Backend Engineer"
                required
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
                placeholder="e.g. Distributed Systems, Spring Boot, React"
                required
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
              placeholder="e.g. Distributed caching, system design, concurrency, indexing..."
            />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                  style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                >
                  {activeQuestion.category.replace('_', ' ')}
                </span>
                <span
                  className={`badge badge-${difficulty.toLowerCase()}`}
                  style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                >
                  {difficulty}
                </span>
              </div>

              {/* Countdown Timer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: "'JetBrains Mono', Consolas, monospace",
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: timeLeft !== null && timeLeft < 120 ? '#ef4444' : 'var(--text-primary)',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                }}
              >
                <span>⏱️</span>
                <span>{formatTimer(timeLeft)}</span>
                <button
                  type="button"
                  onClick={() => setTimerActive((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    marginLeft: '0.25rem',
                  }}
                >
                  {timerActive ? '⏸️' : '▶️'}
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
                  fontSize: '0.8rem',
                  color: 'var(--brand-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>💡</span>
                <span>{showHints[activeQuestion.id] ? 'Hide Hints' : 'View Hints'}</span>
              </button>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Your Answer:
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
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
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.95rem',
                lineHeight: 1.6,
                padding: '1rem',
                marginBottom: '1rem',
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
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  marginBottom: '1.25rem',
                }}
              >
                <strong>Summary:</strong> {activeEvaluation.summary}
              </div>

              {/* Strengths and Weaknesses */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981', marginBottom: '0.5rem' }}>
                    Strengths:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {activeEvaluation.strengths?.map((s, sIdx) => (
                      <li key={sIdx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.5rem' }}>
                    Areas to Improve:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
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
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      margin: 0,
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
