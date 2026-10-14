import React from 'react'
import { Routes, Route } from 'react-router-dom'

import Home from '../pages/Home'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Experiences from '../pages/Experiences'
import ExperienceDetails from '../pages/ExperienceDetails'
import CreateExperience from '../pages/CreateExperience'
import EditExperience from '../pages/EditExperience'
import Dashboard from '../pages/Dashboard'
import Companies from '../pages/Companies'
import CompanyDetails from '../pages/CompanyDetails'
import Profile from '../pages/Profile'
import About from '../pages/About'
import AdminDashboard from '../pages/AdminDashboard'
import Playground from '../pages/Playground'
import Chat from '../pages/Chat'
import NotFound from '../pages/NotFound'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/experiences" element={<Experiences />} />
      <Route path="/experiences/:id" element={<ExperienceDetails />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/companies/:id" element={<CompanyDetails />} />
      <Route path="/playground" element={<Playground />} />
      <Route path="/about" element={<About />} />

      {/* Authenticated-Only Candidate & User Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-experience"
        element={
          <ProtectedRoute>
            <CreateExperience />
          </ProtectedRoute>
        }
      />
      {/* Alias support for /experiences/create */}
      <Route
        path="/experiences/create"
        element={
          <ProtectedRoute>
            <CreateExperience />
          </ProtectedRoute>
        }
      />
      <Route
        path="/experiences/:id/edit"
        element={
          <ProtectedRoute>
            <EditExperience />
          </ProtectedRoute>
        }
      />

      {/* Admin Route (role === ADMIN required) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
