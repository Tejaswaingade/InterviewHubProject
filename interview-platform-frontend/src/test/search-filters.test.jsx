import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ExperienceFilters } from '../components/experience/ExperienceFilters'

describe('Search & Filters Functionality (ExperienceFilters)', () => {
  const mockCompanies = [
    { id: '1', name: 'Google' },
    { id: '2', name: 'Microsoft' },
    { id: '3', name: 'Amazon' },
  ]

  let defaultProps

  beforeEach(() => {
    vi.useFakeTimers()
    defaultProps = {
      keyword: '',
      onKeywordChange: vi.fn(),
      companyId: '',
      onCompanyChange: vi.fn(),
      companies: mockCompanies,
      difficulty: '',
      onDifficultyChange: vi.fn(),
      jobRole: '',
      onJobRoleChange: vi.fn(),
      sort: 'createdAt,desc',
      onSortChange: vi.fn(),
      onClearFilters: vi.fn(),
      totalElements: 10,
      loading: false,
    }
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('renders search input and filter dropdowns properly', () => {
    render(<ExperienceFilters {...defaultProps} />)

    expect(screen.getByPlaceholderText(/search interview experiences/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/job role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    expect(document.getElementById('result-count-container')).toHaveTextContent('Found 10 experiences')
  })

  it('calls onKeywordChange after debounce when typing in search input', () => {
    render(<ExperienceFilters {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search interview experiences/i)
    fireEvent.change(searchInput, { target: { value: 'Frontend Developer' } })

    expect(searchInput.value).toBe('Frontend Developer')
    expect(defaultProps.onKeywordChange).not.toHaveBeenCalled()

    // Fast-forward debounce timer (350ms)
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(defaultProps.onKeywordChange).toHaveBeenCalledWith('Frontend Developer')
  })

  it('submits search immediately when submitting form', () => {
    render(<ExperienceFilters {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(/search interview experiences/i)
    fireEvent.change(searchInput, { target: { value: 'System Design' } })

    const searchBtn = screen.getByRole('button', { name: /^search$/i })
    fireEvent.click(searchBtn)

    expect(defaultProps.onKeywordChange).toHaveBeenCalledWith('System Design')
  })

  it('clears search input when clicking clear button', () => {
    render(<ExperienceFilters {...defaultProps} keyword="React" />)

    const clearBtn = screen.getByTitle(/clear search query/i)
    fireEvent.click(clearBtn)

    expect(defaultProps.onKeywordChange).toHaveBeenCalledWith('')
  })

  it('calls onCompanyChange when a company is selected', () => {
    render(<ExperienceFilters {...defaultProps} />)

    const companySelect = screen.getByLabelText(/company/i)
    fireEvent.change(companySelect, { target: { value: '2' } })

    expect(defaultProps.onCompanyChange).toHaveBeenCalledWith('2')
  })

  it('calls onDifficultyChange when difficulty is changed', () => {
    render(<ExperienceFilters {...defaultProps} />)

    const diffSelect = screen.getByLabelText(/difficulty/i)
    fireEvent.change(diffSelect, { target: { value: 'HARD' } })

    expect(defaultProps.onDifficultyChange).toHaveBeenCalledWith('HARD')
  })

  it('calls onJobRoleChange after debounce when typing job role', () => {
    render(<ExperienceFilters {...defaultProps} />)

    const roleInput = screen.getByLabelText(/job role/i)
    fireEvent.change(roleInput, { target: { value: 'DevOps' } })

    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(defaultProps.onJobRoleChange).toHaveBeenCalledWith('DevOps')
  })

  it('calls onSortChange when changed', () => {
    render(<ExperienceFilters {...defaultProps} />)

    const sortSelect = screen.getByLabelText(/sort by/i)
    fireEvent.change(sortSelect, { target: { value: 'createdAt,asc' } })
    expect(defaultProps.onSortChange).toHaveBeenCalledWith('createdAt,asc')
  })

  it('displays active filter badges and allows individual removal', () => {
    render(
      <ExperienceFilters
        {...defaultProps}
        keyword="Google Interview"
        companyId="1"
        difficulty="MEDIUM"
        jobRole="SDE-2"
      />
    )

    expect(document.getElementById('active-filter-keyword')).toHaveTextContent('Google Interview')
    expect(document.getElementById('active-filter-company')).toHaveTextContent('Google')
    expect(document.getElementById('active-filter-difficulty')).toHaveTextContent('MEDIUM')
    expect(document.getElementById('active-filter-role')).toHaveTextContent('SDE-2')

    // Click remove company badge
    const removeCompanyBtn = screen.getByTitle(/remove company filter/i)
    fireEvent.click(removeCompanyBtn)
    expect(defaultProps.onCompanyChange).toHaveBeenCalledWith('')

    // Click remove difficulty badge
    const removeDiffBtn = screen.getByTitle(/remove difficulty filter/i)
    fireEvent.click(removeDiffBtn)
    expect(defaultProps.onDifficultyChange).toHaveBeenCalledWith('')

    // Click remove role badge
    const removeRoleBtn = screen.getByTitle(/remove job role filter/i)
    fireEvent.click(removeRoleBtn)
    expect(defaultProps.onJobRoleChange).toHaveBeenCalledWith('')
  })

  it('displays Clear Filters button when filters are active and calls onClearFilters', () => {
    const { rerender } = render(<ExperienceFilters {...defaultProps} />)
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument()

    rerender(<ExperienceFilters {...defaultProps} keyword="test" />)
    const clearAllBtn = screen.getByRole('button', { name: /clear filters/i })
    expect(clearAllBtn).toBeInTheDocument()

    fireEvent.click(clearAllBtn)
    expect(defaultProps.onClearFilters).toHaveBeenCalled()
  })

  it('shows loading indicator when loading prop is true', () => {
    render(<ExperienceFilters {...defaultProps} loading={true} />)
    expect(screen.getByText(/searching\.\.\./i)).toBeInTheDocument()
  })

  it('formats singular vs plural total count properly', () => {
    const { rerender } = render(<ExperienceFilters {...defaultProps} totalElements={1} />)
    expect(document.getElementById('result-count-container')).toHaveTextContent('Found 1 experience')

    rerender(<ExperienceFilters {...defaultProps} totalElements={0} />)
    expect(document.getElementById('result-count-container')).toHaveTextContent('Found 0 experiences')
  })
})
