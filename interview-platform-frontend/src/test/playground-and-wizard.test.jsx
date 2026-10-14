import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CodeCompilerPlayground from '../components/compiler/CodeCompilerPlayground'
import QuestionCard from '../components/question/QuestionCard'
import ExperienceForm from '../components/experience/ExperienceForm'
import { runTestCases, executeCode, DEFAULT_TEST_CASES, CODE_TEMPLATES } from '../utils/codeExecutionEngine'
import companyApi from '../api/companyApi'
import experienceApi from '../api/experienceApi'

vi.mock('../api/companyApi', () => ({
  default: {
    getCompanies: vi.fn(),
  },
}))

vi.mock('../api/experienceApi', () => ({
  default: {
    createExperience: vi.fn(),
    updateExperience: vi.fn(),
  },
}))

describe('Replit-Style Code Playground & Test Runner', () => {
  it('runs test cases and calculates assertion results accurately', async () => {
    const jsCode = CODE_TEMPLATES.javascript.code
    const testCases = DEFAULT_TEST_CASES.javascript
    const result = await runTestCases('javascript', jsCode, testCases)

    expect(result.summary.total).toBe(3)
    expect(result.summary.passed).toBe(3)
    expect(result.summary.failed).toBe(0)
    expect(result.results[0].passed).toBe(true)
    expect(result.results[0].actual).toEqual([0, 1])
  })

  it('renders interactive terminal drawer with CLI prompt and performance badges', async () => {
    render(<CodeCompilerPlayground initialLanguage="javascript" />)

    // Run Code
    const runBtn = screen.getByRole('button', { name: /Run Code/i })
    fireEvent.click(runBtn)

    await waitFor(() => {
      expect(screen.getByText(/\$ node solution\.js/i)).toBeInTheDocument()
      expect(screen.getByText(/Process finished with exit code 0/i)).toBeInTheDocument()
      expect(document.getElementById('compiler-status-pill')).not.toBeNull()
    })
  })

  it('runs quick test cases in UI and displays pass badges', async () => {
    render(<CodeCompilerPlayground initialLanguage="javascript" />)

    const runTestsBtn = screen.getByRole('button', { name: /Run Tests/i })
    fireEvent.click(runTestsBtn)

    await waitFor(() => {
      expect(screen.getByText(/Test Cases \(3\/3 Passed\)/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Passed ✅/i).length).toBeGreaterThanOrEqual(3)
    })
  })

  it('supports 1-click Fork & Experiment with sandbox notification toast', () => {
    const onFork = vi.fn()
    render(<CodeCompilerPlayground initialLanguage="javascript" onFork={onFork} />)

    const forkBtn = screen.getByRole('button', { name: /Fork & Experiment/i })
    fireEvent.click(forkBtn)

    expect(onFork).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Cloned to your interactive playground/i)).toBeInTheDocument()
  })
})

describe('QuestionCard Fork & Run in Playground', () => {
  const mockQuestion = {
    id: 99,
    questionText: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    topic: 'Arrays & Hash Maps',
    questionType: 'DSA',
    difficulty: 'MEDIUM',
    answer: 'Use a hash map to store complements in O(n) time.',
  }

  it('renders Fork & Run in Playground button and opens isolated sandbox drawer on click', () => {
    render(<QuestionCard question={mockQuestion} />)

    const forkBtn = screen.getByRole('button', { name: /Fork & Run in Playground/i })
    expect(forkBtn).toBeInTheDocument()

    // Playground is initially not rendered
    expect(screen.queryByText(/Isolated Playground Sandbox/i)).not.toBeInTheDocument()

    // Click Fork button
    fireEvent.click(forkBtn)

    // Playground sandbox drawer is now open
    expect(screen.getByText(/Isolated Playground Sandbox/i)).toBeInTheDocument()
    expect(screen.getByText(/Close Sandbox/i)).toBeInTheDocument()
  })
})

describe('Experience Stepper Wizard & 1-Click Templates', () => {
  beforeEach(() => {
    companyApi.getCompanies.mockResolvedValue({
      data: [{ id: 1, name: 'Google' }, { id: 2, name: 'Amazon' }],
    })
  })

  it('renders 4-step wizard stepper navigation bar', async () => {
    render(
      <MemoryRouter>
        <ExperienceForm isEditing={false} />
      </MemoryRouter>
    )

    expect(document.getElementById('wizard-step-btn-1')).not.toBeNull()
    expect(document.getElementById('wizard-step-btn-2')).not.toBeNull()
    expect(document.getElementById('wizard-step-btn-3')).not.toBeNull()
    expect(document.getElementById('wizard-step-btn-4')).not.toBeNull()
  })

  it('populates Job Role when role suggestion pill is clicked', async () => {
    render(
      <MemoryRouter>
        <ExperienceForm isEditing={false} />
      </MemoryRouter>
    )

    const rolePill = screen.getByRole('button', { name: /^Backend Engineer$/i })
    fireEvent.click(rolePill)

    const roleInput = screen.getByLabelText(/Job Role/i)
    expect(roleInput.value).toBe('Backend Engineer')
  })

  it('auto-populates rounds when 1-click FAANG SDE Loop template is clicked', async () => {
    render(
      <MemoryRouter>
        <ExperienceForm isEditing={false} />
      </MemoryRouter>
    )

    // Navigate to Step 2
    const step2Btn = document.getElementById('wizard-step-btn-2')
    fireEvent.click(step2Btn)

    // Click 1-click FAANG template
    const faangTemplate = document.getElementById('loop-template-faang')
    fireEvent.click(faangTemplate)

    await waitFor(() => {
      expect(screen.getByText(/Configured Loop \(4 Rounds\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Online Assessment \(OA\)/i)).toBeInTheDocument()
      expect(screen.getByText(/Technical DSA & Problem Solving/i)).toBeInTheDocument()
      expect(screen.getByText(/System Design & Distributed Scalability/i)).toBeInTheDocument()
    })
  })

  it('adds individual round when + Coding OA or + System Design is clicked', async () => {
    render(
      <MemoryRouter>
        <ExperienceForm isEditing={false} />
      </MemoryRouter>
    )

    // Navigate to Step 2
    const step2Btn = document.getElementById('wizard-step-btn-2')
    fireEvent.click(step2Btn)

    // Click + Coding OA
    fireEvent.click(screen.getByRole('button', { name: /\+ Coding OA/i }))

    await waitFor(() => {
      expect(screen.getByText(/Configured Loop \(1 Rounds\)/i)).toBeInTheDocument()
    })

    // Click + System Design
    fireEvent.click(screen.getByRole('button', { name: /\+ System Design/i }))

    await waitFor(() => {
      expect(screen.getByText(/Configured Loop \(2 Rounds\)/i)).toBeInTheDocument()
    })
  })
})