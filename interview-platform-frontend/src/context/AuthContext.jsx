import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authApi from '../api/authApi'
import {
  getToken,
  setToken as saveToken,
  removeToken,
  getUser,
  setUser as saveUser,
  removeUser,
} from '../utils/storage'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken())
  const [user, setUser] = useState(() => getUser())
  // If a token exists in storage, keep loading=true while we verify it against the backend
  const [loading, setLoading] = useState(() => Boolean(getToken()))

  // Verification & initialization of JWT when React starts
  useEffect(() => {
    let isMounted = true

    const verifyExistingToken = async () => {
      const storedToken = getToken()
      if (!storedToken) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        // Check for JWT and restore user state via GET /api/v1/users/me (or /api/users/me)
        const response = await authApi.getCurrentUser()
        if (isMounted) {
          const userData = response.data || response
          setUser(userData)
          setToken(storedToken)
          saveUser(userData)
        }
      } catch (err) {
        console.warn('[AuthContext] Stored token invalid, removing session:', err.message)
        if (isMounted) {
          removeToken()
          removeUser()
          setUser(null)
          setToken(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    verifyExistingToken()

    // Listen for unauthorized events triggered by Axios 401 response interceptor
    const handleUnauthorizedEvent = () => {
      if (isMounted) {
        removeToken()
        removeUser()
        setUser(null)
        setToken(null)
      }
    }

    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent)
    return () => {
      isMounted = false
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent)
    }
  }, [])

  // Login: Calls real backend API, persists token, restores user state
  const login = async (credentials) => {
    const response = await authApi.login(credentials)
    const responseData = response.data || {}
    const authToken = responseData.token
    const authUser = responseData.user

    if (authToken) {
      saveToken(authToken)
      setToken(authToken)
    }
    if (authUser) {
      saveUser(authUser)
      setUser(authUser)
    }

    return response
  }

  // Register: Calls real backend API
  const register = async (userData) => {
    return await authApi.register(userData)
  }

  // Logout: Removes token, clears user state
  const logout = useCallback(() => {
    removeToken()
    removeUser()
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(token && user)
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'

  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    loading,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
