import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import Login from '../pages/Login'
import Register from '../pages/Register'
import { AuthProvider, useAuth } from '../context/AuthContext'
import ProtectedRoute from '../routes/ProtectedRoute'
import AdminRoute from '../routes/AdminRoute'
import authApi from '../api/authApi'
import * as storage from '../utils/storage'

// Mock authApi
vi.mock('../api/authApi', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

describe('AUTH: Login, Register, State, Logout & Protected Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authApi.getCurrentUser.mockResolvedValue({
      data: { id: 1, name: 'Default User', role: 'USER' },
    })
  })

  // 1. Login Form Validation & Submission
  describe('Login Form', () => {
    const renderLogin = () =>
      render(
        <AuthProvider>
          <MemoryRouter>
            <Login />
          </MemoryRouter>
        </AuthProvider>
      )

    it('renders all login inputs and actions', () => {
      renderLogin()

      expect(screen.getByLabelText(/^Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument()
    })

    it('displays client-side validation errors when submitting empty form', async () => {
      renderLogin()

      fireEvent.click(screen.getByRole('button', { name: /^Login$/i }))

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument()
      })
    })

    it('displays validation error for invalid email format', async () => {
      renderLogin()

      const emailInput = screen.getByLabelText(/^Email/i)
      fireEvent.change(emailInput, { target: { value: 'not-an-email' } })
      fireEvent.click(screen.getByRole('button', { name: /^Login$/i }))

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument()
      })
    })
  })

  // 2. Registration Form Validation
  describe('Registration Form', () => {
    const renderRegister = () =>
      render(
        <AuthProvider>
          <MemoryRouter>
            <Register />
          </MemoryRouter>
        </AuthProvider>
      )

    it('renders name, email, password, and confirm password fields', () => {
      renderRegister()

      expect(screen.getByLabelText(/^Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument()
    })

    it('validates password mismatch on registration', async () => {
      renderRegister()

      fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: 'Alice Dev' } })
      fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'alice@example.com' } })
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password123!' } })
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'DifferentPassword123!' } })

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('validates minimum password length', async () => {
      renderRegister()

      fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: 'Bob Dev' } })
      fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'bob@example.com' } })
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'short' } })
      fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'short' } })

      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })
  })

  // 3. AuthContext State & Logout
  describe('Authentication State & Logout', () => {
    function DummyAuthConsumer() {
      const { user, isAuthenticated, isAdmin, logout } = useAuth()
      return (
        <div>
          <span data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</span>
          <span data-testid="user-name">{user?.name || 'NO_USER'}</span>
          <span data-testid="is-admin">{isAdmin ? 'ADMIN' : 'USER'}</span>
          <button onClick={logout} data-testid="logout-btn">
            Logout
          </button>
        </div>
      )
    }

    it('provides unauthenticated state by default', () => {
      vi.spyOn(storage, 'getToken').mockReturnValue(null)
      vi.spyOn(storage, 'getUser').mockReturnValue(null)

      render(
        <AuthProvider>
          <DummyAuthConsumer />
        </AuthProvider>
      )

      expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT')
    })

    it('clears state on logout', async () => {
      vi.spyOn(storage, 'getToken').mockReturnValue('mock-jwt-token')
      vi.spyOn(storage, 'getUser').mockReturnValue({ id: 1, name: 'Test User', role: 'USER' })
      authApi.getCurrentUser.mockResolvedValue({
        data: { id: 1, name: 'Test User', role: 'USER' },
      })

      render(
        <AuthProvider>
          <DummyAuthConsumer />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN')
        expect(screen.getByTestId('user-name').textContent).toBe('Test User')
      })

      fireEvent.click(screen.getByTestId('logout-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_OUT')
      })
    })
  })

  // 4. Protected & Admin Routes
  describe('Protected & Admin Route Access Control', () => {
    it('redirects unauthenticated users to /login when visiting ProtectedRoute', async () => {
      vi.spyOn(storage, 'getToken').mockReturnValue(null)
      vi.spyOn(storage, 'getUser').mockReturnValue(null)

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/login" element={<div>Login Page Mock</div>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Private Dashboard Area</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Login Page Mock')).toBeInTheDocument()
        expect(screen.queryByText('Private Dashboard Area')).not.toBeInTheDocument()
      })
    })

    it('redirects standard USER to /dashboard when accessing AdminRoute', async () => {
      const normalUser = { id: 2, name: 'Candidate User', role: 'USER' }
      vi.spyOn(storage, 'getToken').mockReturnValue('cand-token')
      vi.spyOn(storage, 'getUser').mockReturnValue(normalUser)
      authApi.getCurrentUser.mockResolvedValue({ data: normalUser })

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <Routes>
              <Route path="/dashboard" element={<div>Candidate Dashboard Page</div>} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <div>Super Admin Area</div>
                  </AdminRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Candidate Dashboard Page')).toBeInTheDocument()
        expect(screen.queryByText('Super Admin Area')).not.toBeInTheDocument()
      })
    })

    it('allows ADMIN role to access AdminRoute', async () => {
      const adminUser = { id: 3, name: 'Admin Master', role: 'ADMIN' }
      vi.spyOn(storage, 'getToken').mockReturnValue('admin-token')
      vi.spyOn(storage, 'getUser').mockReturnValue(adminUser)
      authApi.getCurrentUser.mockResolvedValue({ data: adminUser })

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={['/admin']}>
            <Routes>
              <Route path="/dashboard" element={<div>Candidate Dashboard Page</div>} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <div>Super Admin Area</div>
                  </AdminRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Super Admin Area')).toBeInTheDocument()
      })
    })
  })
})
