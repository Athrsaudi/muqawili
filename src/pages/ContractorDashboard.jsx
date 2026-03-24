import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContractorDashboard.css'

export default function ContractorDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ requests: 0, quotes: 0, portfolio: 0, rating: 0 })
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { navigate('/login'); return }

    const { data: userData } = await supabase.from('users').select('*').eq('id', u.id).single()
    if (!userData || userData.user_type !== 'contractor') { navigate('/'); return }
    setUser(userData)

    const { data: profileData } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', u.id)
      .single()
    setProfile(profileData)

    const { data: quotesData } = await supabase
      .from('price_quotes')
      .select('id, status')
      .eq('contractor_id', profileData?.id)
    
    const { data: portfolioData } = await supabase
      .from('contractor_portfolio')
      .select('id')
      .eq('contractor_id', profileData?.id)

    const { data: requestsData } = await supabase
      .from('service_requests')
      .select('*, users!service_requests_client_id_fkey(full_name, city)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10)
    setRequests(requestsData || [])

    setStats({
      requests: requestsData?.length || 0,
      quotes: quotesData?.length || 0,
      portfolio: portfolioData?.length || 0,
      rating: profileData?.avg_rating || 0
    })
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function sendQuote(requestId) {
    navigate('/dashboard/contractor/quote/' + requestId)
  }

  const CATEGORY_MAP = {
    cladding: 'كلادينج', plumbing: 'سباكة', electrical: 'كهرباء',
    demolition: 'هدم', finishing: 'تشطيب', painting: 'دهان', flooring: 'أرضيات',
    hvac: 'تكييف', general: 'عام'
  }

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner"></div>
      <p>جاريي التحميل...</p>
    </div>
  )

  return (
    <div className="contractor-dash" dir="rtl">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-brand">🏗️ مقاولي</div>
        
        <div className="dash-profile-mini">
          <div className="dash-avatar">{user?.full_name?.[0] || 'م'}</div>
          <div>
            <div className="dash-name">{user?.full_name}</div>
            <div className="dash-role">مقاول</div>
          </div>
        </div>

        <nav className="dash-nav">
          {[
            { id: 'overview', icon: '📊', label: 'نظرة عامة' },
            { id: 'requests', icon: '📋', label: 'طلبات الخدمة' },
            { id: 'quotes', icon: '💰', label: 'عروضي' },
            { id: 'portfolio', icon: '🖼️', label: 'أعمالي' },
            { id: 'profile', icon: '👤', label: 'ملفي' },
          ].map(item => (
            <button key={item.id} className={'dash-nav-item ' + (activeTab === item.id ? 'active' : '')} onClick={() => setActiveTab(item.id)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="dash-logout" onClick={handleLogout}>🚪 تسجيل خروج</button>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dash-content">
            <h1 className="dash-title">مرحباً، {user?.full_name?.split(' ')[0]} 👋</h1>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-value">{stats.requests}</div>
                <div className="stat-label">طلبات متاحة</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-value">{stats.quotes}</div>
                <div className="stat-label">عروضي</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🖼️</div>
                <div className="stat-value">{stats.portfolio}</div>
                <div className="stat-label">أعمال منجزة</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{stats.rating > 0 ? stats.rating.toFixed(1) : 'جديد'}</div>
                <div className="stat-label">التقييم</div>
              </div>
            </div>

            <h2 className="section-title">آخر طلبات الخدمة</h2>
            <div className="requests-list">
              {requests.slice(0, 5).map(req => (
                <div key={req.id} className="request-card">
                  <div className="request-header">
                    <span className="request-category">{CATEGORY_MAP[req.category] || req.category}</span>
                    <span className="request-city">📍 {req.city}</span>
                  </div>
                  <h3 className="request-title">{req.title}</h3>
                  <p className="request-desc">{req.description?.slice(0, 100)}...</p>
                  {req.budget_min && <p className="request-budget">💰 {req.budget_min?.toLocaleString()} - {req.budget_max?.toLocaleString()} ريال</p>}
                  <div className="request-footer">
                    <span className="request-client">👤 {req.users?.full_name}</span>
                    <button className="btn-quote" onClick={() => setActiveTab('requests')}>إرسال عرض</button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p className="empty-state">لا توجد طلبات حالياً</p>}
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="dash-content">
            <h1 className="dash-title">طلبات الخدمة</h1>
            <div className="requests-list">
              {requests.map(req => (
                <div key={req.id} className="request-card">
                  <div className="request-header">
                    <span className="request-category">{CATEGORY_MAP[req.category] || req.category}</span>
                    <span className="request-city">📍 {req.city}</span>
                  </div>
                  <h3 className="request-title">{req.title}</h3>
                  <p className="request-desc">{req.description}</p>
                  {req.budget_min && <p className="request-budget">💰 {req.budget_min?.toLocaleString()} - {req.budget_max?.toLocaleString()} ريال</p>}
                  <div className="request-footer">
                    <span className="request-client">👤 {req.users?.full_name} | {req.users?.city}</span>
                    <button className="btn-quote" onClick={() => alert('سيتم إضافة نموذج عرض السعر قريباً')}>إرسال عرض سعر</button>
                  </div>
                </div>
              ))}
              {requests.length === 0 && <p className="empty-state">لا توجد طلبات حالياً</p>}
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="dash-content">
            <h1 className="dash-title">أعمالي</h1>
            <PortfolioSection contractorId={profile?.id} />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="dash-content">
            <h1 className="dash-title">ملفي الشخصي</h1>
            <ProfileSection user={user} profile={profile} onUpdate={loadData} />
          </div>
        )}

        {/* Quotes Tab */}
        {activeTab === 'quotes' && (
          <div className="dash-content">
            <h1 className="dash-title">عروضي</h1>
            <QuotesSection contractorId={profile?.id} />
          </div>
        )}
      </main>
    </div>
  )
}

function PortfolioSection({ contractorId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!contractorId) return
    supabase.from('contractor_portfolio').select('*').eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [contractorId])

  if (loading) return <div className="empty-state">جاريي التحميل...</div>

  return (
    <div>
      {items.length === 0 ? (
        <div className="empty-state">لا توجد أعمال بعد. أضف أول عمل!</div>
      ) : (
        <div className="portfolio-grid">
          {items.map(item => (
            <div key={item.id} className="portfolio-card">
              <img src={item.image_url} alt={item.title} className="portfolio-img" />
              <div className="portfolio-info">
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileSection({ user, profile, onUpdate }) {
  const [bio, setBio] = useState(profile?.bio || '')
  const [years, setYears] = useState(profile?.years_experience || 0)
  const [available, setAvailable] = useState(profile?.is_available ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('contractor_profiles').update({ bio, years_experience: years, is_available: available }).eq('user_id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onUpdate()
  }

  return (
    <div className="profile-form">
      <div className="form-field">
        <label>الاسم الكامل</label>
        <input type="text" value={user?.full_name || ''} disabled className="disabled" />
      </div>
      <div className="form-field">
        <label>الجوال</label>
        <input type="text" value={user?.phone || ''} disabled className="disabled" />
      </div>
      <div className="form-field">
        <label>المدينة</label>
        <input type="text" value={user?.city || ''} disabled className="disabled" />
      </div>
      <div className="form-field">
        <label>نبذة عنك</label>
        <textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder="اكتب نبذة مختصرة عن خبرتك..." />
      </div>
      <div className="form-field">
        <label>سنوات الخبرة</label>
        <input type="number" value={years} onChange={e => setYears(Number(e.target.value))} min={0} max={50} />
      </div>
      <div className="form-field form-toggle">
        <label>متاح للعمل</label>
        <button className={'toggle-btn ' + (available ? 'on' : 'off')} onClick={() => setAvailable(!available)}>
          {available ? 'نعم' : 'لا'}
        </button>
      </div>
      <button className="save-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'جاريي الحفظ...' : saved ? '✅ تم الحفظ' : 'حفظ التغييرات'}
      </button>
    </div>
  )
}

function QuotesSection({ contractorId }) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!contractorId) return
    supabase.from('price_quotes')
      .select('*, service_requests(title, city, category)')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setQuotes(data || []); setLoading(false) })
  }, [contractorId])

  const STATUS = { pending: 'معلق', accepted: 'مقبول ✅', rejected: 'مرفوض ❌' }

  if (loading) return <div className="empty-state">جاريي التحميل...</div>

  return (
    <div>
      {quotes.length === 0 ? (
        <div className="empty-state">لم ترسل أي عروض بعد</div>
      ) : (
        <div className="quotes-list">
          {quotes.map(q => (
            <div key={q.id} className="quote-card">
              <div className="quote-header">
                <h3>{q.service_requests?.title}</h3>
                <span className={'quote-status ' + q.status}>{STATUS[q.status]}</span>
              </div>
              <p className="quote-price">💰 {q.price?.toLocaleString()} ريال</p>
              <p className="quote-duration">⏱ {q.duration_days} يوم</p>
              {q.notes && <p className="quote-notes">{q.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
