import Icon from '../components/Icons'
import FileUploader from '../components/FileUploader'
import FileViewer from '../components/FileViewer'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContractorDashboard.css'

const CAT = { cladding: 'كلادينج', plumbing: 'سباكة', electrical: 'كهرباء', demolition: 'هدم', finishing: 'تشطيب', painting: 'دهان', flooring: 'أرضيات', hvac: 'تكييف', general: 'عام' }
const ALL_CITIES = ['جدة', 'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'حائل', 'القصيم', 'نجران', 'جازان']

function ProfileTab({ user, profile, onUpdate }) {
  const [bio, setBio] = useState('')
  const [years, setYears] = useState(0)
  const [avail, setAvail] = useState(true)
  const [workCities, setWorkCities] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingCities, setLoadingCities] = useState(true)

  useEffect(() => {
    if (!profile) return
    setBio(profile.bio || '')
    setYears(profile.years_experience || 0)
    setAvail(profile.is_available ?? true)
    setLoadingCities(true)
    supabase.from('contractor_areas').select('city').eq('contractor_id', profile.id)
      .then(({ data }) => {
        setWorkCities((data || []).map(r => r.city))
        setLoadingCities(false)
      })
  }, [profile?.id])

  function toggleCity(c) {
    setWorkCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  async function save() {
    if (workCities.length === 0) { alert('اختر مدينة عمل واحدة على الأقل'); return }
    setSaving(true)
    const { error: e1 } = await supabase.from('contractor_profiles')
      .update({ bio: bio.trim(), years_experience: years, is_available: avail })
      .eq('user_id', user.id)
    if (e1) { alert('حدث خطأ أثناء الحفظ: ' + e1.message); setSaving(false); return }
    await supabase.from('contractor_areas').delete().eq('contractor_id', profile.id)
    const { error: e2 } = await supabase.from('contractor_areas')
      .insert(workCities.map(c => ({ contractor_id: profile.id, city: c })))
    if (e2) { alert('خطأ في حفظ المدن: ' + e2.message); setSaving(false); return }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500); onUpdate()
  }

  if (!profile) return <div className='empty-state'>جارٍ التحميل...</div>
  return (
    <div className='profile-form'>
      {saved && <div className='profile-saved-banner'>تم حفظ التغييرات بنجاح</div>}
      <div className='form-field'><label>الاسم الكامل</label><input value={user?.full_name || ''} disabled className='disabled' /></div>
      <div className='form-field'><label>الجوال</label><input value={user?.phone || ''} disabled className='disabled' /></div>
      <div className='form-field'><label>مدينة الإقامة</label><input value={user?.city || ''} disabled className='disabled' /></div>
      <div className='form-field'>
        <label>مدن العمل <span style={{ color: '#64748b', fontSize: '12px' }}>(ستصلك إشعارات الطلبات الجديدة في هذه المدن)</span></label>
        {loadingCities ? <div style={{ color: '#94a3b8', fontSize: '13px' }}>جارٍ تحميل المدن...</div> : (
          <div className='cities-grid-dark'>
            {ALL_CITIES.map(c => (
              <button key={c} type='button'
                className={'city-chip-dark ' + (workCities.includes(c) ? 'active' : '')}
                onClick={() => toggleCity(c)}>
                {workCities.includes(c) ? '✓ ' : ''}{c}
              </button>
            ))}
          </div>
        )}
        {workCities.length > 0 && <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '6px' }}>{workCities.length} مدينة مختارة</p>}
      </div>
      <div className='form-field'><label>نبذة عنك</label><textarea rows={4} value={bio} onChange={e => setBio(e.target.value)} placeholder='اكتب نبذة مختصرة عن خبرتك...' /></div>
      <div className='form-field'><label>سنوات الخبرة</label><input type='number' value={years} onChange={e => setYears(Number(e.target.value))} min={0} max={50} /></div>
      <div className='form-field form-toggle'><label>متاح للعمل</label><button className={'toggle-btn ' + (avail ? 'on' : 'off')} onClick={() => setAvail(!avail)}>{avail ? 'نعم' : 'لا'}</button></div>
      <button className='save-btn' onClick={save} disabled={saving}>{saving ? 'جارِ الحفظ...' : 'حفظ التغييرات'}</button>
    </div>
  )
}

function PortfolioTab({ contractorId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])

  useEffect(() => { if (contractorId) load() }, [contractorId])

  async function load() {
    const { data } = await supabase.from('contractor_portfolio').select('*').eq('contractor_id', contractorId).order('created_at', { ascending: false })
    setItems(data || []); setLoading(false)
  }

  async function add() {
    setErr('')
    if (!title.trim()) { setErr('أدخل عنوان العمل'); return }
    if (uploadedFiles.length === 0) { setErr('أرفق صورة أو ملف واحد على الأقل'); return }
    setSaving(true)
    const { error } = await supabase.from('contractor_portfolio').insert({
      contractor_id: contractorId,
      title: title.trim(),
      description: desc.trim() || null,
      image_url: uploadedFiles[0] || '',
      files: uploadedFiles
    })
    setSaving(false)
    if (error) { setErr('حدث خطأ: ' + error.message); return }
    setTitle(''); setDesc(''); setUploadedFiles([]); setShowForm(false); load()
  }

  async function del(id) {
    if (!confirm('حذف هذا العمل؟')) return
    await supabase.from('contractor_portfolio').delete().eq('id', id)
    load()
  }

  if (loading) return <div className='empty-state'>جارٍ التحميل...</div>
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>{items.length} عمل</span>
        <button className='add-portfolio-btn' onClick={() => setShowForm(!showForm)}>{showForm ? 'إلغاء' : '+ إضافة عمل جديد'}</button>
      </div>
      {showForm && (
        <div className='portfolio-add-form'>
          <div className='field'><label>عنوان العمل *</label><input type='text' placeholder='مثال: تركيب كلادينج' value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className='field'><label>وصف العمل</label><textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} /></div>
          <FileUploader
            bucket="portfolio-images"
            folder={contractorId || 'portfolio'}
            label="صور وفيديوهات العمل *"
            maxFiles={8}
            existingFiles={uploadedFiles}
            onFilesChange={urls => setUploadedFiles(urls)}
          />
          {err && <div className='req-error'>{err}</div>}
          <button className='save-btn' onClick={add} disabled={saving}>{saving ? 'جارٍ...' : 'إضافة العمل'}</button>
        </div>
      )}
      {items.length === 0 && !showForm
        ? <div className='empty-state'>لا توجد أعمال. اضغط + إضافة عمل جديد!</div>
        : <div className='portfolio-grid'>
          {items.map(item => (
            <div key={item.id} className='portfolio-card' style={{ position: 'relative' }}>
              {item.image_url && <img src={item.image_url} alt={item.title} className='portfolio-img' />}
              {(item.files || []).length > 1 && <div className='portfolio-file-count'>+{item.files.length - 1} ملفات</div>}
              <div className='portfolio-info'>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
              </div>
              {(item.files || []).length > 0 && <FileViewer files={item.files} title='ملفات العمل' />}
              <button onClick={() => del(item.id)} style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(239,68,68,.85)', border: 'none', borderRadius: '6px', color: '#fff', padding: '3px 9px', fontSize: '12px', cursor: 'pointer' }}>حذف</button>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

function RequestsTab({ contractorId }) {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (contractorId) load() }, [contractorId])

  async function load() {
    const { data } = await supabase.from('price_quotes')
      .select('*, service_requests(id, title, category, city, status)')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })
    setQuotes(data || []); setLoading(false)
  }

  if (loading) return <div className='empty-state'>جارٍ التحميل...</div>
  if (quotes.length === 0) return <div className='empty-state'>لم تقدم أي عروض بعد</div>
  return (
    <div className='quotes-list'>
      {quotes.map(q => (
        <div key={q.id} className={'quote-card ' + q.status} onClick={() => navigate('/requests/' + q.service_requests?.id)} style={{ cursor: 'pointer' }}>
          <div className='quote-req-title'>{q.service_requests?.title}</div>
          <div className='quote-meta'>
            <span><Icon name="money" size={14} /> {Number(q.price).toLocaleString('ar')} ريال</span>
            <span>⏱ {q.duration_days} يوم</span>
            <span className={'quote-status-badge ' + q.status}>{q.status === 'pending' ? 'قيد الانتظار' : q.status === 'accepted' ? 'مقبول ✓' : 'مرفوض ✗'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ContractorDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { navigate('/login'); return }
    const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    if (!userData || userData.user_type !== 'contractor') { navigate('/'); return }
    setUser(userData)
    const { data: p } = await supabase.from('contractor_profiles').select('*').eq('user_id', authUser.id).single()
    setProfile(p)
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <div className='dash-loading'>جارٍ التحميل...</div>

  const tabs = [
    { id: 'overview',  label: 'نظرة عامة', icon: 'home' },
    { id: 'profile',   label: 'ملفي',       icon: 'user' },
    { id: 'portfolio', label: 'أعمالي',     icon: 'building' },
    { id: 'requests',  label: 'عروضي',      icon: 'clipboard' },
  ]

  return (
    <div className='dash-layout' dir='rtl'>
      <aside className='dash-sidebar'>
        <div className='dash-logo'>خدماتي</div>
        <nav className='dash-nav'>
          {tabs.map(t => (
            <button key={t.id} className={'dash-nav-item ' + (tab === t.id ? 'active' : '')} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} size={17} />
              {t.label}
            </button>
          ))}
        </nav>
        <button className='dash-logout' onClick={logout}>
          <Icon name="logout" size={17} /> تسجيل خروج
        </button>
      </aside>
      <main className='dash-main'>
        {tab === 'overview' && (
          <div className='dash-content'>
            <h1 className='dash-title'>مرحباً، {user?.full_name?.split(' ')[0]} 👋</h1>
            <div className='stats-grid'>
              <div className='stat-card'><div className='stat-icon'><Icon name='star' size={22} color='var(--gold)' /></div><div className='stat-val'>{profile?.avg_rating ? Number(profile.avg_rating).toFixed(1) : '—'}</div><div className='stat-lbl'>التقييم</div></div>
              <div className='stat-card'><div className='stat-icon'><Icon name='chat' size={22} color='var(--gold)' /></div><div className='stat-val'>{profile?.total_reviews || 0}</div><div className='stat-lbl'>التقييمات</div></div>
              <div className='stat-card'><div className='stat-icon'><Icon name='shield' size={22} color='var(--gold)' /></div><div className='stat-val'>{profile?.badge_type === 'verified' ? 'موثق' : profile?.badge_type === 'trusted' ? 'موثوق' : '—'}</div><div className='stat-lbl'>الشارة</div></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button className='action-btn' onClick={() => setTab('profile')}>تعديل ملفي</button>
              <button className='action-btn' onClick={() => setTab('portfolio')}>+ إضافة عمل</button>
              <button className='action-btn' onClick={() => navigate('/search')}>تصفح الطلبات</button>
            </div>
          </div>
        )}
        {tab === 'profile' && <ProfileTab user={user} profile={profile} onUpdate={loadData} />}
        {tab === 'portfolio' && <PortfolioTab contractorId={profile?.id} />}
        {tab === 'requests' && <RequestsTab contractorId={profile?.id} />}
      </main>
    </div>
  )
}
