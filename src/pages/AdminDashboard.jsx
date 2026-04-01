import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ users: 0, contractors: 0, clients: 0, requests: 0, quotes: 0, reviews: 0 })
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [contractors, setContractors] = useState([])

  useEffect(() => { checkAdmin(); loadData() }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data } = await supabase.from('users').select('user_type').eq('id', user.id).single()
    if (data?.user_type !== 'admin') { navigate('/'); return }
  }

  async function loadData() {
    const [usersRes, reqRes, quotesRes, reviewsRes, contractorsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('service_requests').select('*, users!service_requests_client_id_fkey(full_name)').order('created_at', { ascending: false }),
      supabase.from('price_quotes').select('id'),
      supabase.from('reviews').select('id'),
      supabase.from('contractor_profiles').select('*, users(full_name, city, phone, is_verified)').order('created_at', { ascending: false }),
    ])

    const allUsers = usersRes.data || []
    setUsers(allUsers)
    setRequests(reqRes.data || [])
    setContractors(contractorsRes.data || [])
    setStats({
      users: allUsers.length,
      contractors: allUsers.filter(u => u.user_type === 'contractor').length,
      clients: allUsers.filter(u => u.user_type === 'client').length,
      requests: reqRes.data?.length || 0,
      quotes: quotesRes.data?.length || 0,
      reviews: reviewsRes.data?.length || 0,
    })
    setLoading(false)
  }

  async function toggleUserActive(userId, current) {
    await supabase.from('users').update({ is_active: !current }).eq('id', userId)
    loadData()
  }

  async function verifyContractor(userId) {
    await supabase.from('users').update({ is_verified: true }).eq('id', userId)
    await supabase.from('contractor_profiles').update({ badge_type: 'verified' }).eq('user_id', userId)
    loadData()
  }

  async function closeRequest(reqId) {
    await supabase.from('service_requests').update({ status: 'closed' }).eq('id', reqId)
    loadData()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const STATUS_MAP = { open: 'مفتوح', in_progress: 'جاري', closed: 'مغلق', cancelled: 'ملغي' }
  const BADGE_MAP = { none: '-', trusted: 'موثوق', verified: 'موثق' }

  if (loading) return <div className="dash-loading"><div className="dash-spinner" /><p>جاريي...</p></div>

  return (
    <div className="contractor-dash" dir="rtl">
      <aside className="dash-sidebar">
        <div className="dash-brand">لوحة الإدارة</div>
        <nav className="dash-nav">
          {[
            { id: 'overview', icon: 'overview', label: 'إحصائيات' },
            { id: 'users', icon: '👥', label: 'المستخدمون' },
            { id: 'contractors', icon: 'tool', label: 'المقاولون' },
            { id: 'requests', icon: '📋', label: 'الطلبات' },
          ].map(item => (
            <button key={item.id} className={'dash-nav-item ' + (activeTab === item.id ? 'active' : '')} onClick={() => setActiveTab(item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="dash-logout" onClick={handleLogout}>خروج</button>
      </aside>

      <main className="dash-main">
        {activeTab === 'overview' && (
          <div className="dash-content">
            <h1 className="dash-title">لوحة الإدارة</h1>
            <div className="stats-grid">
              {[
                { icon: '👥', value: stats.users, label: 'إجمالي المستخدمين' },
                { icon: 'tool', value: stats.contractors, label: 'مقاولون' },
                { icon: 'users', value: stats.clients, label: 'أصحاب عمل' },
                { icon: '📋', value: stats.requests, label: 'طلبات' },
                { icon: 'money', value: stats.quotes, label: 'عروض أسعار' },
                { icon: 'star', value: stats.reviews, label: 'تقييمات' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="dash-content">
            <h1 className="dash-title">المستخدمون ({users.length})</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>الاسم</th><th>الجوال</th><th>المدينة</th><th>النوع</th><th>مفعّل</th><th>إجراء</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.full_name}</td>
                      <td>{u.phone}</td>
                      <td>{u.city}</td>
                      <td><span className={'badge-type ' + u.user_type}>{u.user_type === 'contractor' ? 'مقاول' : u.user_type === 'client' ? 'عميل' : 'إداري'}</span></td>
                      <td><span className={u.is_active ? 'status-active' : 'status-inactive'}>{u.is_active ? 'نعم' : 'لا'}</span></td>
                      <td><button className={'toggle-active-btn ' + (u.is_active ? 'deactivate' : 'activate')} onClick={() => toggleUserActive(u.id, u.is_active)}>{u.is_active ? 'تعطيل' : 'تفعيل'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contractors' && (
          <div className="dash-content">
            <h1 className="dash-title">المقاولون ({contractors.length})</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>الاسم</th><th>المدينة</th><th>التقييم</th><th>الشارة</th><th>متاح</th><th>إجراء</th></tr></thead>
                <tbody>
                  {contractors.map(c => (
                    <tr key={c.id}>
                      <td>{c.users?.full_name}</td>
                      <td>{c.users?.city}</td>
                      <td>{c.avg_rating > 0 ? c.avg_rating.toFixed(1) : '-'} ({c.total_reviews})</td>
                      <td><span className={'badge-' + c.badge_type}>{BADGE_MAP[c.badge_type] || '-'}</span></td>
                      <td><span className={c.is_available ? 'status-active' : 'status-inactive'}>{c.is_available ? 'نعم' : 'لا'}</span></td>
                      <td>{c.badge_type !== 'verified' && <button className="verify-btn" onClick={() => verifyContractor(c.user_id)}>توثيق</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="dash-content">
            <h1 className="dash-title">الطلبات ({requests.length})</h1>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>العنوان</th><th>صاحب العمل</th><th>المدينة</th><th>الحالة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.users?.full_name}</td>
                      <td>{r.city}</td>
                      <td><span className={'req-status-' + r.status}>{STATUS_MAP[r.status]}</span></td>
                      <td>{r.status === 'open' && <button className="close-req-btn" onClick={() => closeRequest(r.id)}>إغلاق</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
