import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

const CAT_LABELS = { cladding:'كلادينج', plumbing:'سباكة', electrical:'كهرباء', demolition:'هدم وبناء', finishing:'تشطيب', painting:'دهانات', flooring:'أرضيات', hvac:'تكييف', general:'عام' }
const CATS = Object.entries(CAT_LABELS)
const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم']

export default function ContractorDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [cp, setCp]           = useState(null)
  const [requests, setRequests] = useState([])
  const [myQuotes, setMyQuotes] = useState([])
  const [tab, setTab]           = useState('requests')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  const [bio, setBio]           = useState('')
  const [years, setYears]       = useState(0)
  const [hasReg, setHasReg]     = useState(false)
  const [regNo, setRegNo]       = useState('')
  const [available, setAvail]   = useState(true)
  const [selSpecs, setSpecs]    = useState([])
  const [selCities, setCities]  = useState([])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (profile?.user_type !== 'contractor') { navigate('/dashboard/client'); return }
    fetchAll()
  }, [user])

  async function fetchAll() {
    const { data: p } = await supabase
      .from('contractor_profiles')
      .select('*, contractor_specializations(category), contractor_areas(city,district)')
      .eq('user_id', user.id).single()

    if (p) {
      setCp(p)
      setBio(p.bio || ''); setYears(p.years_experience || 0)
      setHasReg(p.has_commercial_reg); setRegNo(p.commercial_reg_no || '')
      setAvail(p.is_available)
      setSpecs(p.contractor_specializations?.map(s => s.category) || [])
      setCities(p.contractor_areas?.map(a => a.city) || [])

      // Fetch matching requests
      const myCities = p.contractor_areas?.map(a => a.city) || []
      const mySpecs  = p.contractor_specializations?.map(s => s.category) || []
      if (myCities.length && mySpecs.length) {
        const { data: reqs } = await supabase
          .from('service_requests')
          .select('*, users(full_name)')
          .eq('status', 'open')
          .in('city', myCities)
          .in('category', mySpecs)
          .order('created_at', { ascending: false })
          .limit(20)
        setRequests(reqs || [])
      }

      const { data: qts } = await supabase
        .from('price_quotes')
        .select('*, service_requests(title, city, status)')
        .eq('contractor_id', p.id)
        .order('created_at', { ascending: false })
      setMyQuotes(qts || [])
    }
    setLoading(false)
  }

  function toggleSpec(cat) {
    setSpecs(s => s.includes(cat) ? s.filter(x => x !== cat) : [...s, cat])
  }
  function toggleCity(city) {
    setCities(s => s.includes(city) ? s.filter(x => x !== city) : [...s, city])
  }

  async function saveProfile() {
    setSaving(true); setMsg('')
    await supabase.from('contractor_profiles').update({
      bio, years_experience: years,
      has_commercial_reg: hasReg, commercial_reg_no: regNo || null,
      is_available: available,
    }).eq('user_id', user.id)

    await supabase.from('contractor_specializations').delete().eq('contractor_id', cp.id)
    if (selSpecs.length) {
      await supabase.from('contractor_specializations').insert(selSpecs.map(cat => ({ contractor_id: cp.id, category: cat })))
    }

    await supabase.from('contractor_areas').delete().eq('contractor_id', cp.id)
    if (selCities.length) {
      await supabase.from('contractor_areas').insert(selCities.map(city => ({ contractor_id: cp.id, city })))
    }

    setMsg('تم حفظ التغييرات بنجاح ✓')
    setSaving(false)
    fetchAll()
  }

  if (loading) return <div className="page-loading"><div className="spinner"/></div>

  const badgeMap = { verified: '✓ معتمد رسمياً', trusted: '★ موثوق', none: 'جديد' }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="db-header">
          <div>
            <h1>لوحة تحكم المقاول</h1>
            <p>أهلاً {profile?.full_name} — {badgeMap[cp?.badge_type] || ''}</p>
          </div>
          <div className="db-stats">
            <div className="db-stat"><span>{requests.length}</span><small>طلب متاح</small></div>
            <div className="db-stat"><span>{myQuotes.length}</span><small>عرض مقدَّم</small></div>
          </div>
        </div>

        {/* TABS */}
        <div className="db-tabs">
          {[['requests','الطلبات المتاحة'],['quotes','عروضي'],['profile','ملفي']].map(([key,label]) => (
            <button key={key} className={`tab-btn ${tab===key?'active':''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <div className="tab-content">
            {requests.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📋</span>
                <h3>لا توجد طلبات في منطقتك وتخصصك حالياً</h3>
                <p>تأكد من تحديث تخصصاتك ومناطق عملك</p>
                <button className="btn btn-outline" onClick={() => setTab('profile')}>تحديث الملف</button>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map(r => (
                  <Link key={r.id} to={`/request/${r.id}`} className="req-item card">
                    <div className="ri-header">
                      <h3>{r.title}</h3>
                      <span className="ri-cat">{CAT_LABELS[r.category]}</span>
                    </div>
                    <p className="ri-desc">{r.description?.slice(0, 100)}...</p>
                    <div className="ri-footer">
                      <span>📍 {r.city}{r.district ? ` — ${r.district}` : ''}</span>
                      {r.budget_max && <span>💰 حتى {r.budget_max.toLocaleString()} ريال</span>}
                      <span className="ri-date">{new Date(r.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── QUOTES TAB ── */}
        {tab === 'quotes' && (
          <div className="tab-content">
            {myQuotes.length === 0 ? (
              <div className="empty-state"><span className="empty-icon">📨</span><h3>لم تقدم أي عروض بعد</h3></div>
            ) : (
              <div className="quotes-list">
                {myQuotes.map(q => (
                  <Link key={q.id} to={`/request/${q.request_id}`} className="quote-item card">
                    <div className="qi-title">{q.service_requests?.title}</div>
                    <div className="qi-meta">
                      <span className="qi-price">{q.price?.toLocaleString()} ريال</span>
                      <span>{q.duration_days} يوم</span>
                      <span className={`qi-status status-${q.status}`}>
                        {q.status === 'pending' ? 'قيد الانتظار' : q.status === 'accepted' ? '✓ مقبول' : '✗ مرفوض'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="tab-content profile-edit card">
            <h2>تعديل ملفك الشخصي</h2>

            <div className="input-group">
              <label>نبذة تعريفية</label>
              <textarea className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="اشرح خبرتك وما تتميز به..." />
            </div>

            <div className="form-row2">
              <div className="input-group">
                <label>سنوات الخبرة</label>
                <input className="input" type="number" min={0} max={50} value={years} onChange={e => setYears(e.target.value)} />
              </div>
              <div className="input-group">
                <label>
                  <input type="checkbox" checked={available} onChange={e => setAvail(e.target.checked)} style={{marginLeft:6}} />
                  متاح لاستقبال طلبات جديدة
                </label>
              </div>
            </div>

            <div className="form-row2">
              <div className="input-group">
                <label>
                  <input type="checkbox" checked={hasReg} onChange={e => setHasReg(e.target.checked)} style={{marginLeft:6}} />
                  لدي سجل تجاري
                </label>
              </div>
              {hasReg && (
                <div className="input-group">
                  <label>رقم السجل التجاري</label>
                  <input className="input" value={regNo} onChange={e => setRegNo(e.target.value)} placeholder="1234567890" />
                </div>
              )}
            </div>

            <div className="input-group">
              <label>التخصصات</label>
              <div className="toggle-pills">
                {CATS.map(([key, label]) => (
                  <button key={key} type="button" className={`pill ${selSpecs.includes(key) ? 'on' : ''}`} onClick={() => toggleSpec(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>مناطق العمل</label>
              <div className="toggle-pills">
                {CITIES.map(city => (
                  <button key={city} type="button" className={`pill ${selCities.includes(city) ? 'on' : ''}`} onClick={() => toggleCity(city)}>
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {msg && <p className="success-msg">{msg}</p>}
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? <span className="spinner-sm"/> : 'حفظ التغييرات'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
