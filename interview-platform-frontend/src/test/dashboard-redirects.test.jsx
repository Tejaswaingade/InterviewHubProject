import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { Dashboard } from '../pages/Dashboard'
import experienceApi from '../api/experienceApi'
import roundApi from '../api/roundApi'
import questionApi from '../api/questionApi'

// Mock APIs
vi.mock('../api/experienceApi', () => ({
  default: {
    getMyExperiences: vi.fn(),
    deleteExperience: vi.fn(),
  },
}))

vi.mock('../api/roundApi', () => ({
  default: {
    getRounds: vi.fn(),
  },
}))

vi.mock('../api/questionApi', () => ({
  default: {
    getQuestions: vi.fn(),
  },
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 5, name: 'Tejas', email: 'waingadetejas@gmail.com', role: 'USER' },
    isAdmin: false,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}))

describe('DASHBOARD: Stat Cards, Interactive Redirects & View Switching', () => {
  const mockExperiences = [
    {
      id: 37,
      experienceTitle: 'Uber Software Engineer - Core Dispatch',
      jobRole: 'Software Engineer - Core Dispatch',
      overallDifficulty: 'HARD',
      result: 'SELECTED',
      company: { id: 10, name: 'Uber Technologies' },
    },
  ]

  const mockRounds = [
    {
      id: 101,
      roundNumber: 1,
      roundName: 'Low-Level Design: Dispatch Engine',
      difficulty: 'HARD',
      description: 'Concurrency-safe dispatcher design',
    },
  ]

  const mockQuestions = [
    {
      id: 201,
      topic: 'DSA',
      difficulty: 'HARD',
      questionText: 'Design a Spatial In-Memory Dispatch Index using QuadTree',
      answer: 'Used H3 hierarchical hexagonal spatial index with RW-locks.',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()

    experienceApi.getMyExperiences.mockResolvedValue({
      data: {
        content: mockExperiences,
        totalElements: 1,
      },
    })

    roundApi.getRounds.mockResolvedValue({
      data: mockRounds,
    })

    questionApi.getQuestions.mockResolvedValue({
      data: mockQuestions,
    })
  })

  it('renders all 3 stat cards with counts and titles', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Uber Software Engineer - Core Dispatch')).toBeInTheDocument()
    })

    const expStat = document.getElementById('stat-my-experiences')
    const roundsStat = document.getElementById('stat-total-rounds')
    const questionsStat = document.getElementById('stat-total-questions')

    expect(expStat).toBeInTheDocument()
    expect(roundsStat).toBeInTheDocument()
    expect(questionsStat).toBeInTheDocument()

    expect(document.getElementById('stat-experiences-count').textContent).toBe('1')
    expect(document.getElementById('stat-rounds-count').textContent).toBe('1')
    expect(document.getElementById('stat-questions-count').textContent).toBe('1')
    expect(screen.getAllByText('My Experiences').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Total Rounds').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Total Questions').length).toBeGreaterThan(0)
  })

  it('redirects/switches view to Total Rounds when Total Rounds stat card is clicked', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Uber Software Engineer - Core Dispatch')).toBeInTheDocument()
    })

    const roundsStat = document.getElementById('stat-total-rounds')
    fireEvent.click(roundsStat)

    // Should call scrollIntoView
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()

    // Active stat card class
    expect(roundsStat.className).toContain('active-stat-card')

    // Rounds grid should now be visible
    await waitFor(() => {
      expect(document.getElementById('my-rounds-grid')).toBeInTheDocument()
      expect(screen.getByText('Low-Level Design: Dispatch Engine')).toBeInTheDocument()
    })
  })

  it('redirects/switches view to Total Questions when Total Questions stat card is clicked', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Uber Software Engineer - Core Dispatch')).toBeInTheDocument()
    })

    const questionsStat = document.getElementById('stat-total-questions')
    fireEvent.click(questionsStat)

    expect(questionsStat.className).toContain('active-stat-card')

    // Questions grid should now be visible
    await waitFor(() => {
      expect(document.getElementById('my-questions-grid')).toBeInTheDocument()
      expect(screen.getByText('Design a Spatial In-Memory Dispatch Index using QuadTree')).toBeInTheDocument()
      expect(screen.getByText(/Solution \/ Approach:/i)).toBeInTheDocument()
    })
  })

  it('switches back to My Experiences when My Experiences stat card or tab is clicked', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Uber Software Engineer - Core Dispatch')).toBeInTheDocument()
    })

    // Switch to rounds first
    fireEvent.click(document.getElementById('stat-total-rounds'))
    expect(document.getElementById('my-rounds-grid')).toBeInTheDocument()

    // Click My Experiences tab pill
    fireEvent.click(document.getElementById('dashboard-tab-experiences'))
    expect(document.getElementById('my-experiences-grid')).toBeInTheDocument()
    expect(screen.getByText('Uber Software Engineer - Core Dispatch')).toBeInTheDocument()
  })

  it('supports keyboard Enter and Space navigation on stat cards', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Uber Software Engineer - Core Dispatch')).toBeInTheDocument()
    })

    const roundsStat = document.getElementById('stat-total-rounds')
    fireEvent.keyDown(roundsStat, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(document.getElementById('my-rounds-grid')).toBeInTheDocument()
    })
  })
})
