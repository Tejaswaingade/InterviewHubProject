import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { executeCode, CODE_TEMPLATES } from '../utils/codeExecutionEngine'
import CodeCompilerPlayground from '../components/compiler/CodeCompilerPlayground'
import { Navbar } from '../components/layout/Navbar'
import { DeleteConfirmModal } from '../components/common/DeleteConfirmModal'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

describe('In-Browser Code Execution Engine', () => {
  it('executes JavaScript code and captures console.log output accurately', async () => {
    const code = `
      const x = 10;
      const y = 25;
      console.log("Sum result:", x + y);
    `
    const result = await executeCode('javascript', code)
    expect(result.success).toBe(true)
    expect(result.output).toContain('Sum result: 35')
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('captures return values from JavaScript return statements', async () => {
    const code = `
      function multiply(a, b) { return a * b; }
      return multiply(6, 7);
    `
    const result = await executeCode('javascript', code)
    expect(result.success).toBe(true)
    expect(result.output).toContain('[Return Value]: 42')
  })

  it('handles JavaScript runtime exceptions gracefully without crashing', async () => {
    const code = `
      const obj = null;
      obj.nonExistentMethod();
    `
    const result = await executeCode('javascript', code)
    expect(result.success).toBe(false)
    expect(result.output).toContain('Error')
  })

  it('provides working pre-configured templates for JavaScript and Python', () => {
    expect(CODE_TEMPLATES.javascript.code).toContain('twoSum')
    expect(CODE_TEMPLATES.python.code).toContain('is_palindrome')
  })
})

describe('CodeCompilerPlayground Component', () => {
  it('renders the compiler with language selector and Run Code button', () => {
    render(<CodeCompilerPlayground initialLanguage="javascript" />)

    expect(screen.getByText(/Live Code Compiler & Playground/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /JavaScript/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Python/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Run Code/i })).toBeDefined()
  })

  it('runs JavaScript code on button click and shows output console', async () => {
    render(<CodeCompilerPlayground initialLanguage="javascript" />)

    const runBtn = screen.getByRole('button', { name: /Run Code/i })
    fireEvent.click(runBtn)

    await waitFor(() => {
      expect(screen.getByText(/Output Console/i)).toBeDefined()
      const outputEl = document.getElementById('compiler-output-text')
      expect(outputEl).not.toBeNull()
      expect(outputEl.textContent).toContain('Test Case 1')
    })
  })

  it('switches between languages and updates code template', () => {
    render(<CodeCompilerPlayground initialLanguage="javascript" />)

    const pyBtn = screen.getByRole('button', { name: /Python/i })
    fireEvent.click(pyBtn)

    const editor = screen.getByPlaceholderText(/Write or paste Python code here.../i)
    expect(editor.value).toContain('is_palindrome')
  })
})

describe('Navbar Role Filtering & Header Layout', () => {
  const mockThemeContext = {
    theme: 'light',
    toggleTheme: vi.fn(),
  }

  it('renders Dashboard and Share Experience for non-admin candidate user', () => {
    const mockCandidateAuth = {
      isAuthenticated: true,
      isAdmin: false,
      user: { id: 1, name: 'John Candidate', role: 'ROLE_USER', email: 'john@example.com' },
      logout: vi.fn(),
    }

    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockThemeContext}>
          <AuthContext.Provider value={mockCandidateAuth}>
            <Navbar />
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </BrowserRouter>
    )

    // Candidate links MUST be visible
    expect(screen.getByText('Dashboard')).toBeDefined()
    expect(screen.getByText('Share Experience')).toBeDefined()
    // Admin dashboard MUST be hidden
    expect(screen.queryByText('Admin Dashboard')).toBeNull()
  })

  it('HIDES Dashboard and Share Experience for admin user and shows Admin Dashboard', () => {
    const mockAdminAuth = {
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 2, name: 'Admin User', role: 'ROLE_ADMIN', email: 'admin@example.com' },
      logout: vi.fn(),
    }

    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockThemeContext}>
          <AuthContext.Provider value={mockAdminAuth}>
            <Navbar />
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </BrowserRouter>
    )

    // Candidate links MUST be hidden for Admin
    expect(screen.queryByText('Dashboard')).toBeNull()
    expect(screen.queryByText('Share Experience')).toBeNull()

    // Admin dashboard MUST be visible
    expect(screen.getByText('Admin Dashboard')).toBeDefined()
    expect(screen.getByText('Admin User')).toBeDefined()
  })

  it('renders single official brand logo in navbar', () => {
    const mockAuth = {
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      logout: vi.fn(),
    }

    render(
      <BrowserRouter>
        <ThemeContext.Provider value={mockThemeContext}>
          <AuthContext.Provider value={mockAuth}>
            <Navbar />
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </BrowserRouter>
    )

    const logoImg = document.getElementById('app-nav-logo')
    expect(logoImg).toBeDefined()
    expect(logoImg.getAttribute('alt')).toContain('InterviewHub')
    expect(document.getElementById('nav-brand')).toBeDefined()
  })
})

describe('Universal Delete Confirmation Dialogue Box', () => {
  it('strictly renders Yes (confirm), No (cancel), and the "This cannot be undone." warning', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <DeleteConfirmModal
        isOpen={true}
        title="Delete Item"
        itemName="Target Record"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Verify warning badge
    const warningEl = document.getElementById('delete-confirm-modal-undo-warning')
    expect(warningEl).not.toBeNull()
    expect(warningEl.textContent).toContain('This cannot be undone.')

    // Verify action buttons are strictly No and Yes
    const noBtn = screen.getByRole('button', { name: /^No$/i })
    const yesBtn = screen.getByRole('button', { name: /^Yes$/i })
    expect(noBtn).toBeDefined()
    expect(yesBtn).toBeDefined()

    // Verify callbacks
    fireEvent.click(yesBtn)
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(noBtn)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
