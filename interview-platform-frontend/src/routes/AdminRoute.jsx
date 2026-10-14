import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/common/Loading'

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth()
  const location = useLocation()

  // Wait for initial session restoration check
  if (loading) {
    return <Loading message="Verifying permissions..." />
  }

  // Unauthenticated users are redirected to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Only users with role === 'ADMIN' can access /admin; normal users receive an appropriate redirect to /dashboard
  const hasAdminRole = isAdmin || user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN'
  if (!hasAdminRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}

export default AdminRoute
