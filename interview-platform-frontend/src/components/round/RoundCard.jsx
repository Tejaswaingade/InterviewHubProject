import React from 'react'
import QuestionCard from '../question/QuestionCard'
import { getRoundTypeLabel } from './RoundFormModal'

export function RoundCard({
  round,
  questions = [],
  roundIndex = 0,
  canManage = false,
  onEditRound,
  onDeleteRound,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) {
  if (!round) return null

  // Round metadata
  const roundNumber = round.roundNumber || roundIndex + 1
  const roundTitle = round.roundName || round.title || `Round ${roundNumber}`

  // Derive type, difficulty, description gracefully
  const primaryQuestion = questions.length > 0 ? questions[0] : null
  const roundTypeRaw =
    round.roundType || round.type || primaryQuestion?.questionType || 'TECHNICAL'
  const roundTypeDisplay = getRoundTypeLabel(roundTypeRaw)
  const roundDifficulty =
    round.difficulty || primaryQuestion?.difficulty || 'MEDIUM'
  const roundDescription =
    round.description ||
    round.roundDescription ||
    (questions.length > 0
      ? `Technical round focusing on ${
          questions
            .map((q) => q.topic)
            .filter(Boolean)
            .slice(0, 3)
            .join(', ') || 'core engineering principles'
        }.`
      : 'In-depth interview round assessing technical problem solving and engineering fundamentals.')

  const diffClass = `badge-${String(roundDifficulty).toLowerCase()}`

  return (
    <div
      className="card round-card"
      id={`round-card-${round.id || roundNumber}`}
      style={{
        padding: '1.75rem',
        marginBottom: '2rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Round Header: Round Number, Type, Title, Difficulty & Management Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '0.35rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
              id={`round-badge-${round.id || roundNumber}`}
            >
              Round {roundNumber}
            </span>
            <span
              className="badge"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
              id={`round-type-${round.id || roundNumber}`}
            >
              {roundTypeDisplay}
            </span>
          </div>

          <h3
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
            }}
            id={`round-title-${round.id || roundNumber}`}
          >
            {roundTitle}
          </h3>
        </div>

        {/* Right side: Difficulty & Owner/Admin Round Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span
            className={`badge badge-difficulty ${diffClass}`}
            id={`round-difficulty-${round.id || roundNumber}`}
          >
            {roundDifficulty}
          </span>

          {canManage && (
            <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.5rem' }}>
              <button
                type="button"
                onClick={() => onEditRound && onEditRound(round)}
                className="btn btn-sm btn-ghost"
                id={`btn-edit-round-${round.id}`}
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
                title="Edit this round"
              >
                ✏️ Edit Round
              </button>
              <button
                type="button"
                onClick={() => onDeleteRound && onDeleteRound(round)}
                className="btn btn-sm btn-ghost"
                id={`btn-delete-round-${round.id}`}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.6rem',
                  color: 'var(--brand-danger, #ef4444)',
                }}
                title="Delete this round"
              >
                🗑️ Delete Round
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Round Description */}
      {roundDescription && (
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}
          id={`round-description-${round.id || roundNumber}`}
        >
          {roundDescription}
        </p>
      )}

      {/* Questions Section */}
      <div style={{ marginTop: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <h4
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>❓ Questions Asked</span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.1rem 0.5rem',
                borderRadius: 'var(--radius-full)',
              }}
              id={`round-${round.id || roundNumber}-question-count`}
            >
              {questions.length}
            </span>
          </h4>

          {/* + Add Question Button for Owner/Admin */}
          {canManage && (
            <button
              type="button"
              onClick={() => onAddQuestion && onAddQuestion(round)}
              className="btn btn-sm btn-secondary"
              id={`btn-add-question-${round.id}`}
              style={{
                fontSize: '0.8rem',
                padding: '0.25rem 0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>➕</span>
              <span>Add Question</span>
            </button>
          )}
        </div>

        {/* Empty Questions State */}
        {questions.length === 0 ? (
          <div
            id={`round-${round.id || roundNumber}-empty-questions`}
            style={{
              padding: '1.75rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}
          >
            <p style={{ margin: '0 0 0.75rem 0' }}>No questions recorded for this round yet.</p>
            {canManage && (
              <button
                type="button"
                onClick={() => onAddQuestion && onAddQuestion(round)}
                className="btn btn-sm btn-primary"
                id={`btn-add-first-question-${round.id}`}
              >
                ➕ Add First Question
              </button>
            )}
          </div>
        ) : (
          <div className="round-questions-list" id={`round-${round.id || roundNumber}-questions-list`}>
            {questions.map((q, qIdx) => (
              <QuestionCard
                key={q.id || qIdx}
                question={q}
                index={qIdx}
                canManage={canManage}
                onEditQuestion={(question) =>
                  onEditQuestion && onEditQuestion(round, question)
                }
                onDeleteQuestion={(question) =>
                  onDeleteQuestion && onDeleteQuestion(round, question)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoundCard
