import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { AuthUser } from '../services/authService'
import type { ReactNode } from 'react'

type Props = {
  allowedRole: AuthUser['role']
  children: ReactNode
}

export default function ProtectedRoute({ allowedRole, children }: Props) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === allowedRole) return <>{children}</>
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'business') return <Navigate to="/dashboard" replace />
  return <Navigate to="/" replace />
}
