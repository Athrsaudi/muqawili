import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Login.css'

const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم']

function formatPhone(raw) {
  const n = raw.replace(/\D/g, '')
  if (n.startsWith('966')) return '+' + n
  if (n.startsWith('0')) return '+966' + n.slice(1)
  return '+966' + n
}

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')

  // Register
  const [fullName, setFullName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regNationalId, setRegNationalId] = useState('')
  const [userType, setUserType] = useState('client')
  const [city, setCity] = useState('')

  async function handleLogin() {
    setError(''); setLoading(true)
    const fp = formatPhone(phone)
    if (fp.length < 13) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    if (!nationalId.match(/^[12]\d{9}$/)) { setError('أدخل رقم هوية وطنية صحيح (10 أرقام)'); setLoading(false); return }

    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('id, user_type')
      .eq('phone', fp)
      .eq('national_id', nationalId)
      .single()

    if (dbErr || !user) {
      setError('رقم الجوال أو رقم الهوية غير صحيح')
      setLoading(false); return
    }

    const fakeEmail = `${user.id}@muqawili.app`
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: nationalId })

    if (signInErr) {
      await supabase.auth.signUp({ email: fakeEmail, password: nationalId })
      await supabase.auth.signInWithPassword({ email: fakeEmail, password: nationalId })
    }

    user.user_type === 'contractor' ? navigate('/dashboard/contractor') : navigate('/')
    setLoading(false)
  }

  async function handleRegister() {
    setError(''); setLoading(true)
    if (!fullName.trim()) { setError('أدخل اسمك الكامل'); setLoading(false); return }
    const fp = formatPhone(regPhone)
    if (fp.length < 13) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    if (!regNationalId.match(/^[12]\d{9}$/)) { setError('أدخل رقم هوية وطنية صحيح (10 أرقام)'); setLoading(false); return }
    if (!city) { setError('اختر مدينتك'); setLoading(false); return }

    const { data: existing } = await supabase
      .from('users').select('id')
      .or(`phone.eq.${fp},national_id.eq.${regNationalId}`)
      .maybeSingle()

    if (existing) { setError('هذا الجوال أو رقم الهوية مسجل مسبقاً'); setLoading(false); return }

    const tempId = crypto.randomUUID()
    const fakeEmail = `${tempId}@muqawili.app`

    const { data: authData, error: signUpErr } = await supabase.auth.signUp({ email: fakeEmail, password: regNationalId })
    if (signUpErr || !authData.user) { setError('حدث خطأ في إنشاء الحساب'); setLoading(false); return }

    const { error: insertErr } = await supabase.from('users').insert({
      id: authData.user.id,
      phone: fp,
      full_name: fullName,
      national_id: regNationalId,
      user_type: userType,
      city,
      is_verified: true,
    })

    if (insertErr) {
      setError(insertErr.code === '23505' ? 'هذه الهوية مسجلة مسبقاً' : 'حدث خطأ، حاول مرة أخرى')
      setLoading(false); return
    }

    if (userType === 'contractor') {
      await supabase.from('contractor_profiles').insert({ user_id: authData.user.id, years_experience: 0 })
      navigate('/dashboard/contractor')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="login-page" dir="rtl">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">🏗️</div>
          <h1>مقاولي</h1>
          <p>سوق المقاولات السعودي</p>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError('') }}>
              تسجيل الدخول
            </button>
            <button className={tab === 'register' ? 'active' : ''} onClick={() => { setTab('register'); setError('') }}>
              حساب جديد
            </button>
          </div>

          {tab === 'login' && (
            <div className="login-form">
              <div className="form-group">
                <label>رقم الجوال</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
              </div>
              <div className="form-group">
                <label>رقم الهوية الوطنية</label>
                <input type="text" value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="1xxxxxxxxx" maxLength={10} />
              </div>
              {error && <div className="login-error">{error}</div>}
              <button className="login-btn" onClick={handleLogin} disabled={loading}>
                {loading ? 'جارٍ الدخول...' : 'دخول'}
              </button>
            </div>
          )}

          {tab === 'register' && (
            <div className="login-form">
              <div className="form-group">
                <label>الاسم الكامل</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="محمد بن أحمد" />
              </div>
              <div className="form-group">
                <label>رقم الجوال</label>
                <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="05xxxxxxxx" />
              </div>
              <div className="form-group">
                <label>رقم الهوية الوطنية</label>
                <input type="text" value={regNationalId} onChange={e => setRegNationalId(e.target.value)} placeholder="1xxxxxxxxx" maxLength={10} />
              </div>
              <div className="form-group">
                <label>المدينة</label>
                <select value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">اختر مدينتك</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>نوع الحساب</label>
                <div className="user-type-btns">
                  <button className={userType === 'client' ? 'active' : ''} onClick={() => setUserType('client')}>🏠 صاحب عمل</button>
                  <button className={userType === 'contractor' ? 'active' : ''} onClick={() => setUserType('contractor')}>🔧 مقاول</button>
                </div>
              </div>
              {error && <div className="login-error">{error}</div>}
              <button className="login-btn" onClick={handleRegister} disabled={loading}>
                {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
