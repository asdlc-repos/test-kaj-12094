import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TaskListPage } from '@/pages/TaskListPage'
import { CategoryPage } from '@/pages/CategoryPage'
import { ToastContainer } from '@/components/ToastContainer'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth()
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth()
  return authenticated ? <Navigate to="/tasks" replace /> : <>{children}</>
}

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><RegisterPage /></PublicRoute>}
        />
        <Route
          path="/tasks"
          element={<ProtectedRoute><TaskListPage /></ProtectedRoute>}
        />
        <Route
          path="/categories"
          element={<ProtectedRoute><CategoryPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  )
}
