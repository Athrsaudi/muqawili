import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Admin.css'

const CAT_LABELS = {
  cladding: 'كلادينج', plumbing: 'سباكة', electrical: 'كهرباء',
  demolition: 'هدم', finishing: 'تشطيب', painting: 'دهان',
  flooring: 'أرضيات', hvac: 'تكييف', general: 'عام'
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ users: 0, contractors: 0, clients: 0, requests: 0, openRequests: 0, quotes: 0, reviews: 0 })
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => { checkAdmin() }, [])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data } = await supabase.from('users').select('user_type').eq('id', user.id).single()
    if (!data || data.user_type !== 'admin') { navigate('/'); return }
    loadData()
  }

  async function loadData() {
    setLoading(true)
    const [usersRes, reqRes, quotesRes, reviewsRes] = await Promise.all([
      supabase.from('users').select('*, contractor_profiles(id, avg_rating, total_reviews, badge_type, is_available)').order('created_at', { ascending: false }),
      supabase.from('service_requests').select('*, users!service_requests_client_id_fkey(full_name)').order('created_at', { ascending: false }),
      supabase.from('price_quotes').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true })
    ])
    const allUsers = usersRes.data || []
    const allReqs = reqRes.data || []
    setUsers(allUsers)
    setRequests(allReqs)
    setStats({
      users: allUsers.length,
      contractors: allUsers.filter(u => u.user_type === 'contractor').length,
      clients: allUsers.filter(u => u.user_type === 'client').length,
      requests: allReqs.length,
      openRequests: allReqs.filter(r => r.status === 'open').length,
      quotes: quotesRes.count || 0,
      reviews: reviewsRes.count || 0
    })
    setLoading(false)
  }

  async function toggleActive(userId, currentActive) {
    setActionLoading(userId + '-active')
    await supabase.from('users').update({ is_active: !currentActive }).eq('id', userId)
    await loadData()
    setActionLoading(null)
  }

  async function toggleVerified(userId, currentVerified) {
    setActionLoading(userId + '-verify')
    await supabase.from('users').update({ is_verified: !currentVerified }).eq('id', userId)
    await loadData()
    setActionLoading(null)
  }

  async function changeBadge(contractorProfileId, badge) {
    setActionLoading(contractorProfileId + '-badge')
    await supabase.from('contractor_profiles').update({ badge_type: badge }).eq('id', contractorProfileId)
    await loadData()
    setActionLoading(null)
  }

  async function closeRequest(reqId) {
    setActionLoading(reqId + '-close')
    await supabase.from('service_requests').update({ status: 'closed' }).eq('id', reqId)
    await loadData()
    setActionLoading(null)
  }

  async function deleteRequest(reqId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return
    setActionLoading(reqId + '-delete')
    await supabase.from('price_quotes').delete().eq('request_id', reqId)
    await supabase.from('service_requests').delete().eq('id', reqId)
    await loadData()
    setActionLoading(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return (
    <div className="admin-loading-screen">
      <div className="admin-loading-spinner"></div>
      <p>جارٍ تحميل لوحة الإدارة...</p>
    </div>
  )

  const contractors = users.filter(u => u.user_type === 'contractor')
  const clients = users.filter(u => u.user_type === 'client')

  const TABS = [
    { id: 'overview', icon: '📊', label: 'نظرة عامة' },
    { id: 'contractors', icon: '🏗️', label: 'المقاولون' },
    { id: 'clients', icon: '👤', label: 'العملاء' },
    { id: 'requests', icon: '📋', label: 'الطلبات' },
  ]

  return (
    <div className="admin-page" dir="rtl">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-icon">⚙️</span>
          <span className="admin-sidebar-title">لوحة الإدارة</span>
        </div>
        <nav className="admin-sidebar-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={'admin-sidebar-btn' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              <span className="admin-sidebar-btn-icon">{t.icon}</span>
              <span className="admin-sidebar-btn-label">{t.label}</span>
            </button>
          ))}
        </nav>
        <button className="admin-sidebar-logout" onClick={handleLogout}>
          🚪 تسجيل الخروج
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">

        {/* ======= OVERVIEW ======= */}
        {tab === 'overview' && (
          <div className="admin-panel">
            <h1 className="admin-page-title">نظرة عامة</h1>
            <div className="admin-stats-grid">
              {[
                { icon: '👥', val: stats.users, label: 'إجمالي المستخدمين', color: '#3b82f6' },
                { icon: '🏗️', val: stats.contractors, label: 'مقاول', color: '#f59e0b' },
                { icon: '👤', val: stats.clients, label: 'عميل', color: '#10b981' },
                { icon: '📋', val: stats.requests, label: 'طلب', color: '#8b5cf6' },
                { icon: '📂', val: stats.openRequests, label: 'طلب مفتوح', color: '#06b6d4' },
                { icon: '💬', val: stats.quotes, label: 'عرض سعر', color: '#ec4899' },
                { icon: '⭐', val: stats.reviews, label: 'تقييم', color: '#f97316' },
              ].map((s, i) => (
                <div className="admin-stat-box" key={i} style={{ '--accent': s.color }}>
                  <div className="admin-stat-icon">{s.icon}</div>
                  <div className="admin-stat-val">{s.val}</div>
                  <div className="admin-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <h2 className="admin-section-heading">أحدث المستخدمين</h2>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>المدينة</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 8).map(u => (
                    <tr key={u.id}>
                      <td className="admin-td-name">{u.full_name}</td>
                      <td>
                        <span className={'admin-type-badge ' + u.user_type}>
                          {u.user_type === 'contractor' ? 'مقاول' : u.user_type === 'client' ? 'عميل' : 'مدير'}
                        </span>
                      </td>
                      <td>{u.city}</td>
                      <td>
                        <span className={'admin-status-dot ' + (u.is_active ? 'active' : 'inactive')}>
                          {u.is_active ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td className="admin-td-date">{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======= CONTRACTORS ======= */}
        {tab === 'contractors' && (
          <div className="admin-panel">
            <h1 className="admin-page-title">المقاولون ({contractors.length})</h1>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الجوال</th>
                    <th>المدينة</th>
                    <th>التقييم</th>
                    <th>الشارة</th>
                    <th>موثق</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {contractors.map(u => (
                    <tr key={u.id} className={u.is_active ? '' : 'admin-row-inactive'}>
                      <td className="admin-td-name">{u.full_name}</td>
                      <td className="admin-td-phone">{u.phone}</td>
                      <td>{u.city}</td>
                      <td>
                        {u.contractor_profiles?.avg_rating > 0
                          ? <span className="admin-rating">⭐ {Number(u.contractor_profiles.avg_rating).toFixed(1)}</span>
                          : <span className="admin-no-rating">—</span>
                        }
                      </td>
                      <td>
                        <select
                          className="admin-badge-select"
                          value={u.contractor_profiles?.badge_type || 'none'}
                          disabled={actionLoading === u.contractor_profiles?.id + '-badge'}
                          onChange={e => changeBadge(u.contractor_profiles?.id, e.target.value)}
                        >
                          <option value="none">بدون</option>
                          <option value="trusted">موثوق</option>
                          <option value="verified">موثق</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className={'admin-verify-btn ' + (u.is_verified ? 'verified' : '')}
                          onClick={() => toggleVerified(u.id, u.is_verified)}
                          disabled={actionLoading === u.id + '-verify'}
                        >
                          {u.is_verified ? '✓ موثق' : 'توثيق'}
                        </button>
                      </td>
                      <td>
                        <span className={'admin-status-dot ' + (u.is_active ? 'active' : 'inactive')}>
                          {u.is_active ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={'admin-toggle-btn ' + (u.is_active ? 'deactivate' : 'activate')}
                          onClick={() => toggleActive(u.id, u.is_active)}
                          disabled={actionLoading === u.id + '-active'}
                        >
                          {u.is_active ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======= CLIENTS ======= */}
        {tab === 'clients' && (
          <div className="admin-panel">
            <h1 className="admin-page-title">العملاء ({clients.length})</h1>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>الجوال</th>
                    <th>المدينة</th>
                    <th>موثق</th>
                    <th>الحالة</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(u => (
                    <tr key={u.id} className={u.is_active ? '' : 'admin-row-inactive'}>
                      <td className="admin-td-name">{u.full_name}</td>
                      <td className="admin-td-phone">{u.phone}</td>
                      <td>{u.city}</td>
                      <td>
                        <button
                          className={'admin-verify-btn ' + (u.is_verified ? 'verified' : '')}
                          onClick={() => toggleVerified(u.id, u.is_verified)}
                          disabled={actionLoading === u.id + '-verify'}
                        >
                          {u.is_verified ? '✓ موثق' : 'توثيق'}
                        </button>
                      </td>
                      <td>
                        <span className={'admin-status-dot ' + (u.is_active ? 'active' : 'inactive')}>
                          {u.is_active ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={'admin-toggle-btn ' + (u.is_active ? 'deactivate' : 'activate')}
                          onClick={() => toggleActive(u.id, u.is_active)}
                          disabled={actionLoading === u.id + '-active'}
                        >
                          {u.is_active ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======= REQUESTS ======= */}
        {tab === 'requests' && (
          <div className="admin-panel">
            <h1 className="admin-page-title">الطلبات ({requests.length})</h1>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>العنوان</th>
                    <th>العميل</th>
                    <th>التصنيف</th>
                    <th>المدينة</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td className="admin-td-name">
                        <a href={'/requests/' + r.id} className="admin-req-link">{r.title}</a>
                      </td>
                      <td>{r.users?.full_name}</td>
                      <td><span className="admin-cat-badge">{CAT_LABELS[r.category] || r.category}</span></td>
                      <td>{r.city}</td>
                      <td>
                        <span className={'admin-req-status ' + r.status}>
                          {r.status === 'open' ? 'مفتوح' : r.status === 'in_progress' ? 'جارٍ' : r.status === 'closed' ? 'مغلق' : 'ملغي'}
                        </span>
                      </td>
                      <td className="admin-td-date">{new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="admin-td-actions">
                        {r.status === 'open' && (
                          <button
                            className="admin-close-btn"
                            onClick={() => closeRequest(r.id)}
                            disabled={actionLoading === r.id + '-close'}
                          >
                            إغلاق
                          </button>
                        )}
                        <button
                          className="admin-delete-btn"
                          onClick={() => deleteRequest(r.id)}
                          disabled={actionLoading === r.id + '-delete'}
                        >
                          حذف
                        </button>
                      </td>
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
