import React, { useState, useEffect, useRef } from 'react'
import {
  executeCode,
  runTestCases,
  detectLanguage,
  SUPPORTED_LANGUAGES,
  CODE_TEMPLATES,
  DEFAULT_TEST_CASES,
} from '../../utils/codeExecutionEngine'

/**
 * Interactive Multi-Language Code Playground & Test Runner
 */
export function CodeCompilerPlayground({
  initialLanguage = 'javascript',
  initialCode = null,
  initialTitle = null,
  readOnly = false,
  onRunComplete = null,
  onFork = null,
}) {
  const [language, setLanguage] = useState(initialLanguage)
  const [editorTheme, setEditorTheme] = useState('dark')
  const [code, setCode] = useState(
    initialCode || CODE_TEMPLATES[initialLanguage]?.code || ''
  )
  const [isRunning, setIsRunning] = useState(false)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [output, setOutput] = useState(null)
  const [executionStats, setExecutionStats] = useState(null)
  const [copied, setCopied] = useState(false)
  const [forkedToast, setForkedToast] = useState(false)
  const [autoDetectedNotification, setAutoDetectedNotification] = useState(null)
  const [activeTab, setActiveTab] = useState('console')

  const [testCases, setTestCases] = useState(
    DEFAULT_TEST_CASES[initialLanguage] || []
  )
  const [testResults, setTestResults] = useState(null)
  const [showAddTestCase, setShowAddTestCase] = useState(false)
  const [newTcExpression, setNewTcExpression] = useState('')
  const [newTcExpected, setNewTcExpected] = useState('')

  const textareaRef = useRef(null)

  const handleLanguageChange = (newLang) => {
    if (newLang === language) return
    setLanguage(newLang)
    setCode(CODE_TEMPLATES[newLang]?.code || '')
    setTestCases(DEFAULT_TEST_CASES[newLang] || [])
    setOutput(null)
    setTestResults(null)
    setExecutionStats(null)
    setAutoDetectedNotification(null)
  }

  useEffect(() => {
    if (initialCode !== null && initialCode !== undefined) {
      setCode(initialCode)
      const detected = detectLanguage(initialCode)
      if (detected && detected !== language) {
        setLanguage(detected)
      }
    }
  }, [initialCode])

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newCode)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleRun()
    }
  }

  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('text')
    if (pastedText && pastedText.trim().length > 10) {
      const detected = detectLanguage(pastedText)
      if (detected && detected !== language) {
        setLanguage(detected)
        setTestCases(DEFAULT_TEST_CASES[detected] || [])
        const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === detected)
        setAutoDetectedNotification(
          `Auto-switched to ${langObj?.name || detected.toUpperCase()} from pasted code`
        )
        setTimeout(() => setAutoDetectedNotification(null), 4500)
      }
    }
  }

  const handleResetTemplate = () => {
    const template = CODE_TEMPLATES[language]?.code || ''
    setCode(template)
    setTestCases(DEFAULT_TEST_CASES[language] || [])
    setOutput(null)
    setTestResults(null)
    setExecutionStats(null)
    setAutoDetectedNotification(null)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const handleFork = () => {
    setForkedToast(true)
    setTimeout(() => setForkedToast(false), 2800)
    if (onFork) {
      onFork({ language, code, testCases })
    }
  }

  const handleRun = async () => {
    if (isRunning || !code.trim()) return

    let targetLang = language
    const detected = detectLanguage(code)
    if (detected && detected !== language) {
      targetLang = detected
      setLanguage(detected)
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === detected)
      setAutoDetectedNotification(
        `Detected ${langObj?.name || detected.toUpperCase()} code - running with appropriate compiler`
      )
      setTimeout(() => setAutoDetectedNotification(null), 4000)
    }

    setIsRunning(true)
    setActiveTab('console')
    try {
      const result = await executeCode(targetLang, code)
      setOutput(result.output)
      setExecutionStats({
        timeMs: result.executionTimeMs,
        success: result.success,
        memoryMb: result.memoryMb || '14.2 MB',
        exitCode: result.exitCode ?? (result.success ? 0 : 1),
        detectedLang: result.detectedLang || targetLang,
      })

      if (result.detectedLang && result.detectedLang !== language) {
        setLanguage(result.detectedLang)
      }

      if (onRunComplete) {
        onRunComplete({
          language: targetLang,
          code,
          output: result.output,
          success: result.success,
          executionTimeMs: result.executionTimeMs,
        })
      }
    } catch (err) {
      setOutput(`[Execution Exception]: ${err.message}`)
      setExecutionStats({ timeMs: 0, success: false, memoryMb: '0 MB', exitCode: 1, detectedLang: targetLang })
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunTests = async () => {
    if (isRunningTests || !code.trim()) return

    let targetLang = language
    const detected = detectLanguage(code)
    if (detected && detected !== language) {
      targetLang = detected
      setLanguage(detected)
    }

    setIsRunningTests(true)
    setActiveTab('tests')
    try {
      const result = await runTestCases(targetLang, code, testCases)
      setTestResults(result)
    } catch (err) {
      console.error('Test execution failed:', err)
    } finally {
      setIsRunningTests(false)
    }
  }

  const handleAddTestCase = (e) => {
    e.preventDefault()
    if (!newTcExpression.trim()) return

    let parsedExpected = newTcExpected.trim()
    try {
      parsedExpected = JSON.parse(parsedExpected)
    } catch {
      if (parsedExpected.toLowerCase() === 'true') parsedExpected = true
      else if (parsedExpected.toLowerCase() === 'false') parsedExpected = false
      else if (!isNaN(Number(parsedExpected)) && parsedExpected !== '') parsedExpected = Number(parsedExpected)
    }

    const newTc = {
      id: Date.now(),
      name: `Test Case ${testCases.length + 1}`,
      label: newTcExpression.trim(),
      expression: newTcExpression.trim(),
      expected: parsedExpected,
    }

    setTestCases((prev) => [...prev, newTc])
    setNewTcExpression('')
    setNewTcExpected('')
    setShowAddTestCase(false)
  }

  const getCliPrompt = (lang) => {
    switch (lang) {
      case 'javascript': return '$ node solution.js'
      case 'typescript': return '$ npx ts-node solution.ts'
      case 'python': return '$ python3 main.py'
      case 'java': return '$ javac Solution.java && java Solution'
      case 'cpp': return '$ g++ -std=c++17 -O2 solution.cpp -o solution && ./solution'
      case 'c': return '$ gcc -O2 solution.c -o solution && ./solution'
      case 'csharp': return '$ dotnet run Program.cs'
      case 'go': return '$ go run main.go'
      case 'rust': return '$ rustc solution.rs && ./solution'
      case 'php': return '$ php solution.php'
      case 'ruby': return '$ ruby solution.rb'
      case 'swift': return '$ swift solution.swift'
      case 'sql': return '$ sqlite3 database.db < query.sql'
      default: return '$ node solution.js'
    }
  }

  const cliPrompt = getCliPrompt(language)
  const isDark = editorTheme === 'dark'

  const themeColors = isDark
    ? {
        cardBg: '#090d16',
        headerBg: '#0d1527',
        border: '#1e293b',
        textPrimary: '#f8fafc',
        textMuted: '#94a3b8',
        editorBg: '#060a12',
        editorText: '#f8fafc',
        terminalBg: '#030712',
        terminalHeaderBg: '#090f1d',
        codeBorder: '#1e293b',
      }
    : {
        cardBg: '#ffffff',
        headerBg: '#f8fafc',
        border: '#e2e8f0',
        textPrimary: '#0f172a',
        textMuted: '#64748b',
        editorBg: '#f8fafc',
        editorText: '#0f172a',
        terminalBg: '#f1f5f9',
        terminalHeaderBg: '#e2e8f0',
        codeBorder: '#cbd5e1',
      }

  return (
    <div
      className="card compiler-card"
      id="compiler-playground-container"
      style={{
        margin: '1.5rem 0',
        backgroundColor: themeColors.cardBg,
        border: `1px solid ${themeColors.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 8px 24px -4px rgba(0, 0, 0, 0.45)'
          : '0 4px 16px -2px rgba(0, 0, 0, 0.08)',
        color: themeColors.textPrimary,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Playground Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: themeColors.headerBg,
          borderBottom: `1px solid ${themeColors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: themeColors.textPrimary,
                  letterSpacing: '-0.01em',
                }}
              >
                {initialTitle || 'Live Code Compiler & Playground'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                Live Sandbox
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Quick Buttons for JS & Python */}
          <div
            style={{
              display: 'flex',
              backgroundColor: isDark ? '#050914' : '#edf2f7',
              borderRadius: '8px',
              padding: '2px',
              border: `1px solid ${themeColors.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => handleLanguageChange('javascript')}
              className={`btn btn-sm ${language === 'javascript' ? 'btn-primary' : 'btn-ghost'}`}
              id="compiler-select-js"
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                color: language === 'javascript' ? '#ffffff' : themeColors.textMuted,
              }}
            >
              JavaScript
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('python')}
              className={`btn btn-sm ${language === 'python' ? 'btn-primary' : 'btn-ghost'}`}
              id="compiler-select-py"
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                color: language === 'python' ? '#ffffff' : themeColors.textMuted,
              }}
            >
              Python
            </button>
          </div>

          {/* Languages Dropdown with ALL 13 Popular Modern Languages */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <select
              id="compiler-language-dropdown"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              aria-label="Select Programming Language"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '6px',
                backgroundColor: isDark ? '#050914' : '#ffffff',
                color: themeColors.textPrimary,
                border: `1px solid ${themeColors.border}`,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dark / Light Mode Switch Toggle */}
          <button
            type="button"
            id="compiler-theme-toggle"
            onClick={() => setEditorTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="btn btn-sm"
            title="Switch Playground Dark/Light Mode"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '6px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
              color: themeColors.textPrimary,
              border: `1px solid ${themeColors.border}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <span>{isDark ? '☀️' : '🌙'}</span>
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {!readOnly && (
            <button
              type="button"
              onClick={handleResetTemplate}
              className="btn btn-sm btn-ghost"
              id="compiler-reset-btn"
              title="Reset code to standard interview test sample"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                color: themeColors.textMuted,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                border: `1px solid ${themeColors.border}`,
              }}
            >
              🔄 Reset Sample
            </button>
          )}

          <button
            type="button"
            onClick={handleFork}
            className="btn btn-sm btn-ghost"
            id="compiler-fork-btn"
            title="Fork and tweak this algorithm live in your own sandbox session"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              color: '#0284c7',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <span>🍴</span>
            <span>Fork & Experiment</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-sm btn-ghost"
            id="compiler-copy-btn"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              color: themeColors.textMuted,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
              border: `1px solid ${themeColors.border}`,
            }}
          >
            {copied ? '✓ Copied' : '📄 Copy'}
          </button>
        </div>
      </div>

      {/* Auto-detected Language Notification Toast */}
      {autoDetectedNotification && (
        <div
          style={{
            backgroundColor: '#6366f1',
            color: '#ffffff',
            padding: '0.45rem 1.25rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>✨ {autoDetectedNotification}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Auto-configured</span>
        </div>
      )}

      {forkedToast && (
        <div
          id="compiler-fork-toast"
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ Cloned to your interactive playground! Tweak any line and execute live.</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Sandbox Ready</span>
        </div>
      )}

      {/* Code Editor Window */}
      <div style={{ position: 'relative', backgroundColor: themeColors.editorBg }}>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          readOnly={readOnly}
          id="compiler-code-input"
          rows={12}
          spellCheck={false}
          style={{
            width: '100%',
            padding: '1rem 1.25rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: themeColors.editorText,
            backgroundColor: themeColors.editorBg,
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
            display: 'block',
            transition: 'background-color 0.2s ease, color 0.2s ease',
          }}
          placeholder={`Write or paste ${language === 'javascript' ? 'JavaScript' : language === 'python' ? 'Python' : language} code here...`}
        />
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          backgroundColor: themeColors.headerBg,
          borderTop: `1px solid ${themeColors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.8rem', color: themeColors.textMuted, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>⌨️</span>
            <span>Ctrl + Enter to run</span>
          </div>

          {executionStats && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                id="compiler-status-pill"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: isDark ? '#38bdf8' : '#0284c7',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                ⚡ {executionStats.timeMs}ms
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(148, 163, 184, 0.15)',
                  color: themeColors.textMuted,
                  border: `1px solid ${themeColors.border}`,
                }}
              >
                📦 {executionStats.memoryMb}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRunTests}
            disabled={isRunningTests || !code.trim()}
            className="btn btn-sm btn-secondary"
            id="compiler-run-tests-btn"
            title="Execute test inputs against expected outputs"
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {isRunningTests ? (
              <>
                <span className="spinner spinner-sm" style={{ width: '12px', height: '12px' }} />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <span>🧪</span>
                <span>Run Tests ({testCases.length})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="btn btn-sm btn-success"
            id="compiler-run-code-btn"
            title="Execute program in sandbox"
            style={{
              padding: '0.45rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: '#10b981',
              borderColor: '#10b981',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
            }}
          >
            {isRunning ? (
              <>
                <span className="spinner spinner-sm" style={{ width: '12px', height: '12px' }} />
                <span>Running...</span>
              </>
            ) : (
              <>
                <span>▶</span>
                <span>Run Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Bar: Output Console vs Test Cases */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: themeColors.terminalHeaderBg,
          borderTop: `1px solid ${themeColors.border}`,
          padding: '0 1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('console')}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'console' ? (isDark ? '#38bdf8' : '#0284c7') : themeColors.textMuted,
              borderBottom: activeTab === 'console' ? '2px solid #0284c7' : '2px solid transparent',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            id="compiler-tab-console"
          >
            <span>&gt;_ Output Console</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'tests' ? (isDark ? '#38bdf8' : '#0284c7') : themeColors.textMuted,
              borderBottom: activeTab === 'tests' ? '2px solid #0284c7' : '2px solid transparent',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            id="compiler-tab-tests"
          >
            <span>🧪 {testResults ? `Test Cases (${testResults.passedCount}/${testResults.totalCount} Passed)` : `Test Cases (${testCases.length})`}</span>
          </button>
        </div>

        {activeTab === 'console' && output && (
          <button
            type="button"
            onClick={() => { setOutput(null); setExecutionStats(null); }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.75rem',
              color: themeColors.textMuted,
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
            }}
            title="Clear Console Output"
          >
            Clear
          </button>
        )}
      </div>

      {/* Terminal Output Console */}
      {activeTab === 'console' && (
        <div
          id="compiler-output-terminal"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: themeColors.terminalBg,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontSize: '0.85rem',
            lineHeight: 1.55,
            minHeight: '120px',
            maxHeight: '340px',
            overflowY: 'auto',
            borderTop: `1px solid ${themeColors.border}`,
          }}
        >
          {/* CLI Prompt Banner */}
          <div
            style={{
              color: isDark ? '#34d399' : '#059669',
              fontWeight: 600,
              fontSize: '0.8rem',
              marginBottom: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>guest@interviewhub:~$</span>
            <span style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>{cliPrompt}</span>
          </div>

          {output ? (
            <pre
              id="compiler-output-text"
              style={{
                margin: 0,
                color: executionStats?.success === false ? '#ef4444' : themeColors.textPrimary,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
              }}
            >
              {output}
            </pre>
          ) : (
            <div style={{ color: themeColors.textMuted, fontStyle: 'italic', fontSize: '0.8rem' }}>
              Hit [▶ Run Code] or press [Ctrl + Enter] to execute in real-time sandbox.
            </div>
          )}

          {executionStats && (
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: `1px solid ${themeColors.border}`,
                fontSize: '0.75rem',
                color: themeColors.textMuted,
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <span>Process finished with exit code {executionStats.exitCode} ({executionStats.timeMs}ms)</span>
            </div>
          )}
        </div>
      )}

      {/* Test Cases Drawer */}
      {activeTab === 'tests' && (
        <div
          id="compiler-test-cases-panel"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: themeColors.terminalBg,
            minHeight: '120px',
            maxHeight: '340px',
            overflowY: 'auto',
            borderTop: `1px solid ${themeColors.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: themeColors.textPrimary }}>
              Test Suites & Expected Assertions
            </span>
            <button
              type="button"
              onClick={() => setShowAddTestCase(!showAddTestCase)}
              className="btn btn-xs btn-outline"
              id="compiler-add-testcase-btn"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
            >
              {showAddTestCase ? 'Cancel' : '+ Add Test Case'}
            </button>
          </div>

          {showAddTestCase && (
            <form
              onSubmit={handleAddTestCase}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: themeColors.headerBg,
                border: `1px solid ${themeColors.border}`,
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Invocation (e.g. twoSum([1,2,3], 5))"
                  value={newTcExpression}
                  onChange={(e) => setNewTcExpression(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                />
                <input
                  type="text"
                  placeholder="Expected Return (e.g. [1, 2])"
                  value={newTcExpected}
                  onChange={(e) => setNewTcExpected(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                />
              </div>
              <button type="submit" className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                Save Assertion
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {testCases.map((tc, idx) => {
              const res = testResults?.results?.find((r) => r.id === tc.id)
              const isPassed = res?.passed
              const isFailed = res && !res.passed

              return (
                <div
                  key={tc.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    backgroundColor: themeColors.headerBg,
                    border: `1px solid ${isPassed ? '#10b981' : isFailed ? '#ef4444' : themeColors.border}`,
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? '#10b981' : isFailed ? '#ef4444' : 'rgba(148, 163, 184, 0.2)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      {isPassed ? '✓' : isFailed ? '✕' : idx + 1}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600, color: themeColors.textPrimary }}>
                        {tc.name || `Case ${idx + 1}`}
                      </span>
                      <span style={{ color: themeColors.textMuted, marginLeft: '0.5rem', fontFamily: 'monospace' }}>
                        {tc.expression || tc.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: themeColors.textMuted }}>
                      Expected: <code style={{ color: themeColors.textPrimary }}>{typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : String(tc.expected)}</code>
                    </span>
                    {res && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: isPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isPassed ? '#10b981' : '#ef4444',
                        }}
                      >
                        {isPassed ? `Passed ✅` : 'Fail'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CodeCompilerPlayground
