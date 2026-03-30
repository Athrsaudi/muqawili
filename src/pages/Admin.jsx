import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Admin.css'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ users: 0, contractors: 0, clients: 0, requests: 0 })
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
    const [usersRes, requestsRes] = await Promise.all([
      supabase.from('users').select('*, contractor_profiles(id, avg_rating, total_reviews, badge_type)').order('created_at', { ascending: false }),
      supabase.from('service_requests').select('*, users!service_requests_client_id_fkey(full_name)').order('created_at', { ascending: false })
    ])
    const allUsers = usersRes.data || []
    setUsers(allUsers)
    setRequests(requestsRes.data || [])
    setStats({
      users: allUsers.length,
      contractors: allUsers.filter(u => u.user_type === 'contractor').length,
      clients: allUsers.filter(u => u.user_type === 'client').length,
      requests: requestsRes.data?.length || 0,
    })
    setLoading(false)
  }

  async function toggleActive(userId, current) {
    setActionLoading(userId + '-active')
    await supabase.from('users').update({ is_active: !current }).eq('id', userId)
    await loadData(); setActionLoading(null)
  }

  async function toggleVerified(userId, current) {
    setActionLoading(userId + '-verified')
    await supabase.from('users').update({ is_verified: !current }).eq('id', userId)
    await loadData(); setActionLoading(null)
  }

  async function setBadge(contractorId, badge) {
    setActionLoading(contractorId + '-badge')
    await supabase.from('contractor_profiles').update({ badge_type: badge }).eq('id', contractorId)
    await loadData(); setActionLoading(null)
  }

  async function closeRequest(requestId) {
    setActionLoading(requestId + '-close')
    await supabase.from('service_requests').update({ status: 'closed' }).eq('id', requestId)
    await loadData(); setActionLoading(null)
  }

  async function logout() { await supabase.auth.signOut(); navigate('/') }

  if (loading) return <div className='admin-loading'>جارٍ التحميل...</div>

  const contractors = users.filter(u => u.user_type === 'contractor')
  const clients = users.filter(u => u.user_type === 'client')

  return (
    <div className='admin-layout' dir='rtl'>
      <aside className='admin-sidebar'>
        <div className='admin-logo'>⚙️ لوحة الإدارة</div>
        <nav className='admin-nav'>
          {[{id:'overview',label:'📊 نظرة عامة'},{id:'contractors',label:'🏗️ المقاولون'},{id:'clients',label:'👤 العملاء'},{id:'requests',label:'📋 الطلبات'}].map(t=>(
            <button key={t.id} className={'admin-nav-item '+(tab===t.id?'active':'')} onClick={()=>setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <button className='admin-logout' onClick={logout}>🚪 خروج</button>
      </aside>
      <main className='admin-main'>
        {tab==='overview'&&(
          <div className='admin-content'>
            <h1 className='admin-title'>نظرة عامة</h1>
            <div className='admin-stats'>
              <div className='admin-stat-card'><div className='ast-icon'>👥</div><div className='ast-val'>{stats.users}</div><div className='ast-lbl'>المستخدمون</div></div>
              <div className='admin-stat-card'><div className='ast-icon'>🏗️</div><div className='ast-val'>{stats.contractors}</div><div className='ast-lbl'>مقاولون</div></div>
              <div className='admin-stat-card'><div className='ast-icon'>👤</div><div className='ast-val'>{stats.clients}</div><div className='ast-lbl'>عملاء</div></div>
              <div className='admin-stat-card'><div className='ast-icon'>📋</div><div className='ast-val'>{stats.requests}</div><div className='ast-lbl'>طلبات</div></div>
            </div>
            <div className='admin-recent'><h2 className='admin-section-title'>أحدث المستخدمين</h2>
              <div className='admin-table-wrap'><table className='admin-table'>
                <thead><tr><th>الاسم</th><th>النوع</th><th>المدينة</th><th>الحالة</th><th>التاريخ</th></tr></thead>
                <tbody>{users.slice(0,10).map(u=>(
                  <tr key={u.id}>
                    <td className='td-name'>{u.full_name}</td>
                    <td><span className={'type-badge '+u.user_type}>{u.user_type==='contractor'?'مقاول':u.user_type==='client'?'عميل':'مدير'}</span></td>
                    <td>{u.city}</td>
                    <td><span className={'status-dot '+(u.is_active?'active':'inactive')}>{u.is_active?'نشط':'موقوف'}</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString('ar-SA')}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>
          </div>
        )}
        {tab==='contractors'&&(
          <div className='admin-content'>
            <h1 className='admin-title'>المقاولون ({contractors.length})</h1>
            <div className='admin-table-wrap'><table className='admin-table'>
              <thead><tr><th>الاسم</th><th>الجوال</th><th>المدينة</th><th>التقييم</th><th>الشارة</th><th>موثق</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>{contractors.map(u=>(
                <tr key={u.id} className={!u.is_active?'row-inactive':''}>
                  <td className='td-name'>{u.full_name}</td>
                  <td>{u.phone}</td>
                  <td>{u.city}</td>
                  <td>{u.contractor_profiles?.avg_rating>0?<span className='rating-badge'>⭐ {Number(u.contractor_profiles.avg_rating).toFixed(1)}</span>:<span className='no-rating'>—</span>}</td>
                  <td><select className='badge-select' value={u.contractor_profiles?.badge_type||'none'} disabled={actionLoading===u.contractor_profiles?.id+'-badge'} onChange={e=>setBadge(u.contractor_profiles?.id,e.target.value)}>
                    <option value='none'>بدون</option><option value='trusted'>موثوق</option><option value='verified'>موثق</option>
                  </select></td>
                  <td><button className={'verify-btn '+(u.is_verified?'verified':'')} onClick={()=>toggleVerified(u.id,u.is_verified)} disabled={actionLoading===u.id+'-verified'}>{u.is_verified?'✓ موثق':'توثيق'}</button></td>
                  <td><span className={'status-dot '+(u.is_active?'active':'inactive')}>{u.is_active?'نشط':'موقوف'}</span></td>
                  <td><button className={'toggle-active-btn '+(u.is_active?'deactivate':'activate')} onClick={()=>toggleActive(u.id,u.is_active)} disabled={actionLoading===u.id+'-active'}>{u.is_active?'إيقاف':'تفعيل'}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        )}
        {tab==='clients'&&(
          <div className='admin-content'>
            <h1 className='admin-title'>العملاء ({clients.length})</h1>
            <div className='admin-table-wrap'><table className='admin-table'>
              <thead><tr><th>الاسم</th><th>الجوال</th><th>المدينة</th><th>موثق</th><th>الحالة</th><th>إجراء</th></tr></thead>
              <tbody>{clients.map(u=>(
                <tr key={u.id} className={!u.is_active?'row-inactive':''}>
                  <td className='td-name'>{u.full_name}</td><td>{u.phone}</td><td>{u.city}</td>
                  <td><button className={'verify-btn '+(u.is_verified?'verified':'')} onClick={()=>toggleVerified(u.id,u.is_verified)} disabled={actionLoading===u.id+'-verified'}>{u.is_verified?'✓ موثق':'توثيق'}</button></td>
                  <td><span className={'status-dot '+(u.is_active?'active':'inactive')}>{u.is_active?'نشط':'موقوف'}</span></td>
                  <td><button className={'toggle-active-btn '+(u.is_active?'deactivate':'activate')} onClick={()=>toggleActive(u.id,u.is_active)} disabled={actionLoading===u.id+'-active'}>{u.is_active?'إيقاف':'تفعيل'}</button></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        )}
        {tab==='requests'&&(
          <div className='admin-content'>
            <h1 className='admin-title'>الطلبات ({requests.length})</h1>
            <div className='admin-table-wrap'><table className='admin-table'>
              <thead><tr><th>العنوان</th><th>العميل</th><th>المدينة</th><th>الحالة</th><th>التاريخ</th><th>إجراء</th></tr></thead>
              <tbody>{requests.map(r=>(
                <tr key={r.id}>
                  <td className='td-name'><a href={'/requests/'+r.id} target='_blank' rel='noopener noreferrer' className='req-link'>{r.title}</a></td>
                  <td>{r.users?.full_name}</td><td>{r.city}</td>
                  <td><span className={'req-status '+r.status}>{r.status==='open'?'مفتوح':r.status==='in_progress'?'جارٍ':r.status==='closed'?'مغلق':'ملغي'}</span></td>
                  <td>{new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>{r.status==='open'&&<button className='close-req-btn' onClick={()=>closeRequest(r.id)} disabled={actionLoading===r.id+'-close'}>إغلاق</button>}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
        )}
      </main>
    </div>
  )
}