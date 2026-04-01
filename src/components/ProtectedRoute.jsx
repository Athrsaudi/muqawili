import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedTypes = [] }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-page)'
    }}>
      <div style={{
        width: 36, height: 36, border: '3px solid var(--border)',
        borderTopColor: 'var(--gold)', borderRadius: '50%',
        animation: 'spin .7s linear infinite'
      }} />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (allowedTypes.length > 0 && profile && !allowedTypes.includes(profile.user_type)) {
    return <Navigate to="/" replace />
  }

  return children
}
