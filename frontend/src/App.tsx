import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { FlightsPage } from './pages/FlightsPage'
import { FlightDetailPage } from './pages/FlightDetailPage'
import { FlightFormPage } from './pages/FlightFormPage'
import { AIRiskPage } from './pages/AIRiskPage'
import { GatesPage } from './pages/GatesPage'
import { UsersPage } from './pages/UsersPage'
import { AuditPage } from './pages/AuditPage'
import type { ReactNode } from 'react'

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/flights" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/flights" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/flights" replace /> : <RegisterPage />} />
      <Route path="/flights" element={<RequireAuth><FlightsPage /></RequireAuth>} />
      <Route path="/flights/new" element={<RequireAuth><FlightFormPage /></RequireAuth>} />
      <Route path="/flights/:id" element={<RequireAuth><FlightDetailPage /></RequireAuth>} />
      <Route path="/flights/:id/edit" element={<RequireAuth><FlightFormPage /></RequireAuth>} />
      <Route path="/flights/:id/risk" element={<RequireAuth><AIRiskPage /></RequireAuth>} />
      <Route path="/gates" element={<RequireAuth><GatesPage /></RequireAuth>} />
      <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
      <Route path="/audit" element={<RequireAdmin><AuditPage /></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/flights" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
