import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CompanyFormModal } from '../components/company/CompanyFormModal'
import { resolveCompanyLogoOnline } from '../utils/companyBrands'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import ExperienceForm from '../components/experience/ExperienceForm'
import { BrowserRouter } from 'react-router-dom'
import companyApi from '../api/companyApi'

// Mock companyApi
vi.mock('../api/companyApi', () => ({
  default: {
    getCompanies: vi.fn().mockResolvedValue({
      data: [
        { id: 1, name: 'Google', logo: 'https://logo.clearbit.com/google.com' },
        { id: 2, name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com' },
      ],
    }),
    createCompany: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        data: { id: 99, ...data },
      })
    ),
    updateCompany: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        data: { id, ...data },
      })
    ),
  },
}))

describe('CompanyFormModal - Auto Logo Fetching & Removal of Logo URL Input', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT render any logo URL input text bar', () => {
    render(<CompanyFormModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />)

    // Logo URL input should not exist
    expect(screen.queryByLabelText(/Logo URL/i)).toBeNull()
    expect(document.getElementById('input-modal-company-logo')).toBeNull()

    // Required fields must exist
    expect(screen.getByLabelText(/Company Name/i)).toBeDefined()
    expect(screen.getByLabelText(/Careers \/ Official Website/i)).toBeDefined()
    expect(screen.getByLabelText(/Description/i)).toBeDefined()
  })

  it('hides the auto-detected logo preview and displays the resolution logic explanation card', () => {
    render(<CompanyFormModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />)

    // Autodetected logo preview box should be hidden
    expect(screen.queryByText(/Auto-Detected Logo/i)).toBeNull()

    // Explanation logic card must be displayed
    expect(screen.getByText(/How Company Logos Are Automatically Fetched/i)).toBeDefined()
    expect(screen.getByText(/By Real Company Name:/i)).toBeDefined()
    expect(screen.getByText(/Smart Monogram Fallback:/i)).toBeDefined()
  })

  it('automatically resolves and attaches logo online when creating a company', async () => {
    const handleSuccess = vi.fn()
    const handleClose = vi.fn()

    render(
      <CompanyFormModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    )

    // Type company name
    const nameInput = screen.getByLabelText(/Company Name/i)
    fireEvent.change(nameInput, { target: { value: 'Spotify' } })

    // Modal explains resolution logic clearly
    expect(screen.getByText(/How Company Logos Are Automatically Fetched/i)).toBeDefined()

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Create Company/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(companyApi.createCompany).toHaveBeenCalledTimes(1)
      const payload = companyApi.createCompany.mock.calls[0][0]
      expect(payload.name).toBe('Spotify')
      // Logo must be automatically detected and attached!
      expect(payload.logo).toBeTruthy()
      expect(payload.logo).toContain('svg') // Spotify vector SVG is in registry
      expect(handleSuccess).toHaveBeenCalled()
      expect(handleClose).toHaveBeenCalled()
    })
  })

  it('automatically resolves custom startup logo from website domain', async () => {
    render(
      <CompanyFormModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    )

    const nameInput = screen.getByLabelText(/Company Name/i)
    fireEvent.change(nameInput, { target: { value: 'Acme AI' } })

    const websiteInput = screen.getByLabelText(/Careers \/ Official Website/i)
    fireEvent.change(websiteInput, { target: { value: 'https://acme.ai' } })

    const submitBtn = screen.getByRole('button', { name: /Create Company/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(companyApi.createCompany).toHaveBeenCalledTimes(1)
      const payload = companyApi.createCompany.mock.calls[0][0]
      expect(payload.name).toBe('Acme AI')
      expect(payload.website).toBe('https://acme.ai')
      expect(payload.logo).toContain('unavatar.io/acme.ai')
    })
  })
})

describe('resolveCompanyLogoOnline Utility', () => {
  it('resolves official vector SVG for known top tech brands', () => {
    const googleLogo = resolveCompanyLogoOnline('Google')
    expect(googleLogo).toContain('data:image/svg+xml')
    expect(googleLogo).toContain('4285F4') // Google blue

    const stripeLogo = resolveCompanyLogoOnline('Stripe')
    expect(stripeLogo).toContain('data:image/svg+xml')
    expect(stripeLogo).toContain('635BFF') // Stripe purple
  })

  it('resolves unavatar domain link for arbitrary companies with websites', () => {
    const customLogo = resolveCompanyLogoOnline('Vercel', 'https://vercel.com')
    expect(customLogo).toBe('https://unavatar.io/vercel.com?fallback=https://www.google.com/s2/favicons?domain=vercel.com&sz=128')
  })

  it('generates crisp SVG initials badge when no domain or match is found', () => {
    const customLogo = resolveCompanyLogoOnline('XYZ Private Limited')
    expect(customLogo).toBeTruthy()
  })
})

describe('ExperienceForm - Prominent Add Company Button', () => {
  it('renders the prominent Add Company pill button clearly visible', async () => {
    render(
      <BrowserRouter>
        <ExperienceForm onSubmit={() => {}} />
      </BrowserRouter>
    )

    await waitFor(() => {
      const addCompanyBtn = document.getElementById('btn-add-new-company-form')
      expect(addCompanyBtn).toBeDefined()
      expect(addCompanyBtn.className).toContain('btn-add-company-pill')
      expect(addCompanyBtn.textContent).toContain('Add Company')
      expect(addCompanyBtn.textContent).toContain('Can\'t find company?')
    })
  })
})

describe('ThemeContext - Default Light Mode', () => {
  function ThemeConsumer() {
    const { theme } = useTheme()
    return <span data-testid="current-theme">{theme}</span>
  }

  it('defaults to light theme', () => {
    localStorage.removeItem('interviewhub_theme')
    localStorage.removeItem('interviewhub_theme_v2')

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme').textContent).toBe('light')
  })
})
