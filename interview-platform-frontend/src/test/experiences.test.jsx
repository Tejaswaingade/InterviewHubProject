import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ExperienceCard from '../components/experience/ExperienceCard'
import ExperienceList from '../components/experience/ExperienceList'
import ExperienceForm from '../components/experience/ExperienceForm'
import RoundCard from '../components/round/RoundCard'
import QuestionCard from '../components/question/QuestionCard'
import DeleteConfirmModal from '../components/common/DeleteConfirmModal'
import experienceApi from '../api/experienceApi'

// Mock APIs
vi.mock('../api/experienceApi', () => ({
  default: {
    createExperience: vi.fn(),
    updateExperience: vi.fn(),
    deleteExperience: vi.fn(),
  },
}))

vi.mock('../api/companyApi', () => ({
  default: {
    getCompanies: vi.fn().mockResolvedValue({
      data: [
        { id: 1, name: 'Google' },
        { id: 2, name: 'Amazon' },
      ],
    }),
  },
}))

describe('EXPERIENCES: Listing, Details, Create, Edit & Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Experience Cards & Listing
  describe('ExperienceCard & List', () => {
    const mockExp = {
      id: 101,
      experienceTitle: 'Google Senior SWE Loop 2026',
      jobRole: 'Senior Software Engineer',
      overallDifficulty: 'HARD',
      result: 'SELECTED',
      yearsOfExperience: 5,
      company: { id: 1, name: 'Google' },
      description: 'Challenging distributed systems design round and concurrency coding questions.',
      createdAt: '2026-09-01T10:00:00Z',
    }

    it('renders experience details correctly on ExperienceCard', () => {
      render(
        <MemoryRouter>
          <ExperienceCard experience={mockExp} />
        </MemoryRouter>
      )

      expect(screen.getByText('Google')).toBeInTheDocument()
      expect(screen.getByText('Google Senior SWE Loop 2026')).toBeInTheDocument()
      expect(screen.getByText(/Senior Software Engineer/i)).toBeInTheDocument()
      expect(screen.getByText('HARD')).toBeInTheDocument()
      expect(screen.getByText('SELECTED')).toBeInTheDocument()
    })

    it('renders multiple cards in ExperienceList', () => {
      const exps = [mockExp, { ...mockExp, id: 102, experienceTitle: 'Amazon SDE II Journey' }]
      render(
        <MemoryRouter>
          <ExperienceList experiences={exps} />
        </MemoryRouter>
      )

      expect(screen.getByText('Google Senior SWE Loop 2026')).toBeInTheDocument()
      expect(screen.getByText('Amazon SDE II Journey')).toBeInTheDocument()
    })
  })

  // 2. Round & Question Cards inside Details
  describe('RoundCard & QuestionCard', () => {
    const mockQuestion = {
      id: 201,
      questionText: 'Design a distributed rate limiter using Redis and sliding window.',
      questionType: 'SYSTEM_DESIGN',
      difficulty: 'HARD',
      topic: 'Distributed Systems',
      answer: 'Use Redis sorted set (ZSET) keyed by user ID with timestamps as scores.',
    }

    const mockRound = {
      id: 301,
      roundNumber: 2,
      roundName: 'System Architecture & Scaling',
      roundType: 'SYSTEM_DESIGN',
      difficulty: 'HARD',
      description: 'Designing high throughput caching systems and fault tolerance.',
    }

    it('renders RoundCard with round details and nested questions', () => {
      render(
        <RoundCard
          round={mockRound}
          questions={[mockQuestion]}
          canManage={true}
          onEditRound={vi.fn()}
          onDeleteRound={vi.fn()}
        />
      )

      expect(screen.getByText(/Round 2/i)).toBeInTheDocument()
      expect(screen.getByText(/System Architecture & Scaling/i)).toBeInTheDocument()
      expect(screen.getByText(/Design a distributed rate limiter/i)).toBeInTheDocument()
      expect(screen.getAllByText('HARD').length).toBeGreaterThanOrEqual(1)
    })

    it('toggles answer visibility on QuestionCard', () => {
      render(<QuestionCard question={mockQuestion} />)

      // Answer is initially hidden
      expect(screen.queryByText(/Use Redis sorted set/i)).not.toBeInTheDocument()

      // Click Reveal Solution & Answer button
      fireEvent.click(screen.getByRole('button', { name: /Reveal Solution & Answer/i }))

      // Answer is now visible
      expect(screen.getByText(/Use Redis sorted set/i)).toBeInTheDocument()
    })
  })

  // 3. Create Experience Form Validation & Submit
  describe('Create Experience Form', () => {
    it('validates required fields on submission', async () => {
      render(
        <MemoryRouter>
          <ExperienceForm isEditing={false} />
        </MemoryRouter>
      )

      fireEvent.click(screen.getByRole('button', { name: /Publish Experience/i }))

      await waitFor(() => {
        expect(screen.getByText(/Please select the hiring company/i)).toBeInTheDocument()
        expect(screen.getByText(/Job role is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Experience title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Experience description is required/i)).toBeInTheDocument()
      })
    })

    it('submits valid experience creation payload to API', async () => {
      experienceApi.createExperience.mockResolvedValueOnce({
        data: { id: 999, experienceTitle: 'New Staff Journey' },
      })

      render(
        <MemoryRouter>
          <ExperienceForm isEditing={false} />
        </MemoryRouter>
      )

      // Wait for companies dropdown
      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/Hiring Company/i), { target: { value: '1' } })
      fireEvent.change(screen.getByLabelText(/Job Role/i), { target: { value: 'Staff Engineer' } })
      fireEvent.change(screen.getByLabelText(/Experience Headline/i), {
        target: { value: 'Staff SRE Distributed Interview Experience' },
      })
      fireEvent.change(screen.getByLabelText(/Detailed Description/i), {
        target: { value: 'Thorough interview loop covering Kubernetes, kernel tuning, and cross-team leadership.' },
      })
      fireEvent.change(screen.getByLabelText(/Difficulty/i), { target: { value: 'HARD' } })
      fireEvent.change(screen.getByLabelText(/Result Status/i), { target: { value: 'SELECTED' } })

      fireEvent.click(screen.getByRole('button', { name: /Publish Experience/i }))

      await waitFor(() => {
        expect(experienceApi.createExperience).toHaveBeenCalledWith(
          expect.objectContaining({
            companyId: 1,
            jobRole: 'Staff Engineer',
            experienceTitle: 'Staff SRE Distributed Interview Experience',
            overallDifficulty: 'HARD',
            result: 'SELECTED',
          })
        )
      })
    })
  })

  // 4. Edit Experience Form
  describe('Edit Experience Form', () => {
    const existingExp = {
      id: 50,
      companyId: 1,
      jobRole: 'Senior Backend Engineer',
      experienceTitle: 'Original Backend Journey',
      description: 'Original description detailing take-home assessment and live coding.',
      overallDifficulty: 'MEDIUM',
      result: 'WAITING',
      yearsOfExperience: 3,
    }

    it('pre-populates inputs with existing data and calls updateExperience on submit', async () => {
      experienceApi.updateExperience.mockResolvedValueOnce({ data: { ...existingExp, id: 50 } })

      render(
        <MemoryRouter>
          <ExperienceForm initialValues={existingExp} isEditing={true} />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Backend Journey')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Senior Backend Engineer')).toBeInTheDocument()
      })

      // Edit title
      fireEvent.change(screen.getByLabelText(/Experience Headline/i), {
        target: { value: 'Updated Staff Backend Journey' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Update Experience/i }))

      await waitFor(() => {
        expect(experienceApi.updateExperience).toHaveBeenCalledWith(
          50,
          expect.objectContaining({
            experienceTitle: 'Updated Staff Backend Journey',
          })
        )
      })
    })
  })

  // 5. Delete Confirmation Modal
  describe('Delete Experience Modal', () => {
    it('displays warning dialog and invokes callback on delete confirmation', async () => {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()

      render(
        <DeleteConfirmModal
          isOpen={true}
          title="Delete Interview Experience"
          itemName="Google SWE Experience"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      )

      expect(screen.getByText('Delete Interview Experience')).toBeInTheDocument()
      expect(screen.getByText(/"Google SWE Experience"/i)).toBeInTheDocument()

      expect(screen.getByText(/This cannot be undone/i)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /^Yes$/i }))
      expect(onConfirm).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByRole('button', { name: /^No$/i }))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })
})
