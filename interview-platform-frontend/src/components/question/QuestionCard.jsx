import React, { useState } from 'react'
import { getQuestionTypeLabel } from './QuestionFormModal'
import CodeCompilerPlayground from '../compiler/CodeCompilerPlayground'

/**
 * Generates initial starter code based on question topic and title
 */
function generateStarterCode(question) {
  if (!question) return ''
  const answer = question.answer || ''
  
  // If answer contains a code block, extract the code block
  const codeBlockMatch = answer.match(/```(?:javascript|js|python|py)?\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // If answer itself looks like raw code
  if (answer.includes('function ') || answer.includes('def ') || answer.includes('const ') || answer.includes('class ')) {
    return answer.trim()
  }

  // Otherwise, create a clean problem harness
  const cleanTitle = (question.questionText || question.title || 'Solution').replace(/["\n\r]/g, ' ')
  return `// Problem: ${cleanTitle}
// Topic: ${question.topic || 'Algorithms'}
// Type: ${question.questionType || 'DSA'}

function solveProblem(input) {
    // Tweak and implement your solution here
    console.log("Processing input:", input);
    return input;
}

// Test Sample
const sampleInput = [2, 7, 11, 15];
const result = solveProblem(sampleInput);
console.log("Result:", result);
`
}

export function QuestionCard({
  question,
  index = 0,
  canManage = false,
  onEditQuestion,
  onDeleteQuestion,
}) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showPlayground, setShowPlayground] = useState(false)
  const [forkedCode, setForkedCode] = useState(() => generateStarterCode(question))

  if (!question) return null

  // Normalize difficulty badge class
  const difficultyClass = question.difficulty
    ? `badge-${String(question.difficulty).toLowerCase()}`
    : 'badge-medium'

  const typeLabel = getQuestionTypeLabel(question.questionType)
  const isCodingOrDsa =
    question.questionType === 'DSA' ||
    question.questionType === 'CODING' ||
    question.questionType === 'ONLINE_ASSESSMENT' ||
    !question.questionType

  const handleToggleFork = () => {
    setShowPlayground(!showPlayground)
  }

  return (
    <article
      className="card question-card"
      id={`question-card-${question.id || index}`}
      style={{
        padding: '1.25rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Top Header: Topic, Question Type, Difficulty & Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        {/* Left: Topic & Type badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {question.topic && (
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--brand-primary)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-sm)',
              }}
              id={`question-topic-${question.id || index}`}
            >
              🏷️ {question.topic}
            </span>
          )}
          {question.questionType && (
            <span
              className="badge"
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
              id={`question-type-${question.id || index}`}
            >
              {typeLabel}
            </span>
          )}
        </div>

        {/* Right: Difficulty & Management Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {question.difficulty && (
            <span
              className={`badge badge-difficulty ${difficultyClass}`}
              id={`question-difficulty-${question.id || index}`}
            >
              {question.difficulty}
            </span>
          )}

          {canManage && (
            <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.35rem' }}>
              <button
                type="button"
                onClick={() => onEditQuestion && onEditQuestion(question)}
                className="btn btn-sm btn-ghost"
                id={`btn-edit-question-${question.id}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  color: 'var(--text-secondary)',
                }}
                title="Edit this question"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={() => onDeleteQuestion && onDeleteQuestion(question)}
                className="btn btn-sm btn-ghost"
                id={`btn-delete-question-${question.id}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  color: 'var(--brand-danger, #ef4444)',
                }}
                title="Delete this question"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Question Text */}
      <h4
        style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          lineHeight: 1.5,
          color: 'var(--text-primary)',
          margin: '0 0 0.75rem 0',
        }}
        id={`question-text-${question.id || index}`}
      >
        {question.questionText || question.title || 'Interview question prompt'}
      </h4>

      {/* Action Buttons: Reveal Answer & One-Click Fork & Run in Playground */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap',
          marginTop: '0.65rem',
        }}
      >
        {question.answer && (
          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="btn btn-sm btn-ghost"
            id={`btn-toggle-answer-${question.id || index}`}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--brand-primary)',
              fontWeight: 600,
            }}
          >
            <span>{showAnswer ? '▲ Hide Solution' : '▼ Reveal Solution & Answer'}</span>
          </button>
        )}

        {/* One-Click Fork & Run in Playground Button */}
        <button
          type="button"
          onClick={handleToggleFork}
          className="btn btn-sm"
          id={`btn-fork-question-${question.id || index}`}
          title="Fork this question and test your solution live in the sandbox without affecting author submission"
          style={{
            padding: '0.25rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: showPlayground ? '#0f172a' : 'rgba(56, 189, 248, 0.12)',
            color: showPlayground ? '#38bdf8' : '#0284c7',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          <span>⚡</span>
          <span>{showPlayground ? 'Close Sandbox' : 'Fork & Run in Playground'}</span>
        </button>
      </div>

      {/* Expandable Solution / Answer section */}
      {showAnswer && question.answer && (
        <div
          id={`question-answer-${question.id || index}`}
          style={{
            marginTop: '0.75rem',
            padding: '0.85rem 1.1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-secondary)',
            borderLeft: '3px solid var(--brand-primary)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem',
            }}
          >
            Candidate Approach & Solution
          </div>
          {question.answer}
        </div>
      )}

      {/* Embedded Live Replit Playground when Forked */}
      {showPlayground && (
        <div
          id={`question-playground-drawer-${question.id || index}`}
          style={{
            marginTop: '1.25rem',
            padding: '1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.04)',
            borderRadius: '10px',
            border: '1px solid var(--border-medium)',
          }}
        >
          {/* Fork Notice Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              padding: '0.5rem 0.85rem',
              backgroundColor: '#0284c7',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>⚡</span>
              <span>
                Isolated Playground Sandbox: Experiment and test your algorithm live without altering the author's submission.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPlayground(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              ✕
            </button>
          </div>

          <CodeCompilerPlayground
            initialLanguage="javascript"
            initialCode={forkedCode}
            initialTitle={`Playground: ${question.questionText?.substring(0, 40) || 'Coding Question'}...`}
          />
        </div>
      )}
    </article>
  )
}

export default QuestionCard