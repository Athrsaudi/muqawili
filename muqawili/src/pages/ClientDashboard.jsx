import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const CAT_LABELS = { cladding:'كلادينج', plumbing:'سباكة', electrical:'كهرباء', demolition:'هدم وبناء', finishing:'تشطيب', painting:'دهانات', flooring:'أرضيات', hvac:'تكييف', general:'عام' }
const STATUS_MAP = { open:'مفتوح', in_progress:'قيد التنفيذ', closed:'مغلق', cancelled:'ملغي' }

export default function ClientDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchRequests()
  }, [user])

  async function fetchRequests() {
    const { data } = await supabase
      .from('service_requests')
      .select('*, price_quotes(id)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  if (loading) return <div className="page-loading"><div className="spinner"/></div>

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="db-header">
          <div>
            <h1>لوحة تحكم المشاريع</h1>
            <p>أهلاً {profile?.full_name}</p>
          </div>
          <div className="db-stats">
            <div className="db-stat"><span>{requests.filter(r => r.status === 'open').length}</span><small>طلب مفتوح</small></div>
            <div className="db-stat"><span>{requests.reduce((acc, r) => acc + (r.price_quotes?.length || 0), 0)}</span><small>عرض مستلم</small></div>
          </div>
        </div>

        <div className="client-actions">
          <Link to="/request/new" className="btn btn-primary btn-lg">
            + نشر طلب جديد
          </Link>
          <Link to="/search" className="btn btn-outline btn-lg">
            🔍 البحث عن مقاول
          </Link>
        </div>

        <h2 className="section-label2">طلباتي</h2>

        {requests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>لم تنشر أي طلبات بعد</h3>
            <p>انشر طلبك الأول واستقبل عروض من مقاولين في منطقتك</p>
            <Link to="/request/new" className="btn btn-primary">نشر طلب الآن</Link>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(r => (
              <Link key={r.id} to={`/request/${r.id}`} className="req-item card">
                <div className="ri-header">
                  <h3>{r.title}</h3>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <span className="ri-cat">{CAT_LABELS[r.category]}</span>
                    <span className={`status-badge status-${r.status}`}>{STATUS_MAP[r.status]}</span>
                  </div>
                </div>
                <div className="ri-footer">
                  <span>📍 {r.city}{r.district ? ` — ${r.district}` : ''}</span>
                  <span>📨 {r.price_quotes?.length || 0} عرض</span>
                  <span className="ri-date">{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
