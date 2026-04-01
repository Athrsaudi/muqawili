import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * ProtectedRoute — يحمي الصفحات من الدخول بدون تسجيل
 * allowedTypes: مصفوفة أنواع المستخدمين المسموح لهم ['contractor', 'client', 'admin']
 * إذا كانت فارغة → أي مستخدم مسجّل مسموح له
 */
export default function ProtectedRoute({ children, allowedTypes = [] }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'allowed' | 'denied' | 'unauthenticated'

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('unauthenticated'); return }

      if (allowedTypes.length === 0) { setStatus('allowed'); return }

      const { data } = await supabase.from('users').select('user_type, is_active').eq('id', user.id).single()
      if (!data || data.is_active === false) { setStatus('unauthenticated'); return }
      if (allowedTypes.includes(data.user_type)) setStatus('allowed')
      else setStatus('denied')
    }
    check()
  }, [])

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  )

  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'denied') return <Navigate to="/" replace />

  return children
}
