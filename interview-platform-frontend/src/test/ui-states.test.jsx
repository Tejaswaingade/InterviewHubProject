import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Loading } from '../components/common/Loading'
import { ErrorMessage } from '../components/common/ErrorMessage'
import { EmptyState } from '../components/common/EmptyState'
import { NotFound } from '../pages/NotFound'
import { getFriendlyErrorMessage } from '../utils/errorHandler'

describe('UI State Components and Error Handler', () => {
  describe('Loading Component', () => {
    it('renders with default loading message', () => {
      render(<Loading />)
      expect(screen.getByText('Loading contents...')).toBeInTheDocument()
      expect(document.getElementById('loading-spinner')).toBeInTheDocument()
    })

    it('renders with custom message and size', () => {
      render(<Loading message="Fetching data from server..." size="lg" id="custom-loader" />)
      expect(screen.getByText('Fetching data from server...')).toBeInTheDocument()
      expect(document.getElementById('custom-loader')).toBeInTheDocument()
    })

    it('renders in fullPage mode', () => {
      render(<Loading fullPage={true} id="fp-loader" />)
      const loader = document.getElementById('fp-loader')
      expect(loader).toHaveStyle({ position: 'fixed', inset: '0' })
    })
  })

  describe('ErrorMessage Component', () => {
    it('returns null when no message or error is provided', () => {
      const { container } = render(<ErrorMessage />)
      expect(container.firstChild).toBeNull()
    })

    it('renders user-friendly error message string', () => {
      render(<ErrorMessage message="Unable to connect to database" />)
      expect(screen.getByText('Unable to connect to database')).toBeInTheDocument()
    })

    it('sanitizes 403 Forbidden responses to the exact standardized message', () => {
      const error403 = {
        response: {
          status: 403,
          data: { message: 'Forbidden: AccessDeniedException' },
        },
      }
      render(<ErrorMessage error={error403} />)
      expect(screen.getByText("You don't have permission to perform this action.")).toBeInTheDocument()
    })

    it('sanitizes 401 Unauthorized responses', () => {
      const error401 = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      }
      render(<ErrorMessage error={error401} />)
      expect(
        screen.getByText('Your session has expired or you are not authorized. Please log in again.')
      ).toBeInTheDocument()
    })

    it('sanitizes 404 Not Found responses', () => {
      const error404 = {
        response: {
          status: 404,
        },
      }
      render(<ErrorMessage error={error404} />)
      expect(screen.getByText('The requested resource could not be found.')).toBeInTheDocument()
    })

    it('renders and triggers retry button when onRetry is provided', () => {
      const onRetry = vi.fn()
      render(<ErrorMessage message="Network timeout" onRetry={onRetry} />)

      const retryBtn = screen.getByRole('button', { name: /try again/i })
      expect(retryBtn).toBeInTheDocument()

      fireEvent.click(retryBtn)
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('getFriendlyErrorMessage Sanitizer', () => {
    it('strips backend Spring / Java stack trace details', () => {
      const javaException = {
        message: 'org.springframework.dao.DataIntegrityViolationException: HibernateException at line 42',
      }
      const msg = getFriendlyErrorMessage(javaException)
      expect(msg).toBe('The operation could not be completed. Please check your inputs and try again.')
      expect(msg).not.toContain('org.springframework')
      expect(msg).not.toContain('HibernateException')
    })

    it('returns default fallback message when error is empty or undefined', () => {
      expect(getFriendlyErrorMessage(null)).toBe('An unexpected error occurred. Please try again.')
    })
  })

  describe('EmptyState Component', () => {
    it('renders default icon, title and description', () => {
      render(<EmptyState />)
      expect(screen.getByText('📭')).toBeInTheDocument()
      expect(screen.getByText('No records found')).toBeInTheDocument()
      expect(screen.getByText('There is no data matching your current selection.')).toBeInTheDocument()
    })

    it('renders custom title, description, and action button', () => {
      render(
        <EmptyState
          icon="💼"
          title="No experiences yet"
          description="Be the first to share your interview journey!"
          action={<button id="share-btn">Share Experience</button>}
        />
      )

      expect(screen.getByText('💼')).toBeInTheDocument()
      expect(screen.getByText('No experiences yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to share your interview journey!')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /share experience/i })).toBeInTheDocument()
    })
  })

  describe('NotFound Component', () => {
    it('renders 404 code, heading, description and navigation links', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      )

      expect(screen.getByText('404')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
      expect(screen.getByText(/the page or resource you are looking for does not exist/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /return to homepage/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /browse experiences/i })).toBeInTheDocument()
    })

    it('renders custom code, title and custom action link', () => {
      render(
        <MemoryRouter>
          <NotFound
            code="403"
            title="Access Restricted"
            description="You do not have administrative clearance."
            actionText="Go to Dashboard"
            actionLink="/dashboard"
          />
        </MemoryRouter>
      )

      expect(screen.getByText('403')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /access restricted/i })).toBeInTheDocument()
      expect(screen.getByText(/you do not have administrative clearance/i)).toBeInTheDocument()
      const link = screen.getByRole('link', { name: /go to dashboard/i })
      expect(link).toHaveAttribute('href', '/dashboard')
    })
  })
})
