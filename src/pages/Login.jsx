import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Login.css'

const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم','نجران','جازان']

function formatPhone(raw) {
  const n = raw.replace(/\D/g, '')
  if (n.startsWith('966')) return '+' + n
  if (n.startsWith('0')) return '+966' + n.slice(1)
  return '+966' + n
}

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')

  // Register
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regNationalId, setRegNationalId] = useState('')
  const [userType, setUserType] = useState('client')
  const [city, setCity] = useState('')

  async function handleLogin() {
    setError(''); setLoading(true)
    const fp = formatPhone(phone)
    if (fp.length < 13) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    if (!nationalId.match(/^[12]\d{9}$/)) { setError('رقم الهوية 10 أرقام يبدأ بـ 1 أو 2'); setLoading(false); return }
    const { data: user } = await supabase.from('users').select('id, user_type, email').eq('phone', fp).eq('national_id', nationalId).maybeSingle()
    if (!user) { setError('رقم الجوال أو رقم الهوية غير صحيح'); setLoading(false); return }
    const authEmail = user.email || (user.id + '@muqawili-user.com')
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: authEmail, password: nationalId })
    if (e1) {
      await supabase.auth.signUp({ email: authEmail, password: nationalId })
      const { error: e2 } = await supabase.auth.signInWithPassword({ email: authEmail, password: nationalId })
      if (e2) { setError('حدث خطأ في تسجيل الدخول'); setLoading(false); return }
    }
    user.user_type === 'contractor' ? navigate('/dashboard/contractor') : navigate('/')
    setLoading(false)
  }

  async function handleRegister() {
    setError(''); setLoading(true)
    if (!fullName.trim()) { setError('أدخل اسمك الكامل'); setLoading(false); return }
    if (!email.trim() || !email.includes('@')) { setError('أدخل بريد إلكتروني صحيح'); setLoading(false); return }
    const fp = formatPhone(regPhone)
    if (fp.length < 13) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    if (!regNationalId.match(/^[12]\d{9}$/)) { setError('رقم الهوية 10 أرقام يبدأ بـ 1 أو 2'); setLoading(false); return }
    if (!city) { setError('اختر مدينتك'); setLoading(false); return }
    const { data: ex } = await supabase.from('users').select('id').or('phone.eq.' + fp + ',national_id.eq.' + regNationalId + ',email.eq.' + email.trim()).maybeSingle()
    if (ex) { setError('هذا الجوال أو رقم الهوية أو البريد مسجل مسبقاً'); setLoading(false); return }
    const { data: auth, error: e1 } = await supabase.auth.signUp({ email: email.trim(), password: regNationalId })
    if (e1 || !auth.user) { setError('حدث خطأ: ' + (e1 ? e1.message : '')); setLoading(false); return }
    const { error: e2 } = await supabase.from('users').insert({ id: auth.user.id, phone: fp, email: email.trim(), full_name: fullName.trim(), national_id: regNationalId, user_type: userType, city, is_verified: true })
    if (e2) { setError(e2.code === '23505' ? 'هذه البيانات مسجلة مسبقاً' : 'حدث خطأ، حاول مرة أخرى'); setLoading(false); return }
    if (userType === 'contractor') { await supabase.from('contractor_profiles').insert({ user_id: auth.user.id, years_experience: 0 }); navigate('/dashboard/contractor') }
    else navigate('/')
    setLoading(false)
  }

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-bg" />
      <div className="auth-wrap">
        <div className="auth-logo"><div className="auth-logo-icon">🏗️</div><h1>مقاولي</h1><p>سوق المقاولات السعودي</p></div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={'auth-tab '+(tab==='login'?'active':'')} onClick={()=>{setTab('login');setError('')}}>تسجيل الدخول</button>
            <button className={'auth-tab '+(tab==='register'?'active':'')} onClick={()=>{setTab('register');setError('')}}>حساب جديد</button>
          </div>
          {tab==='login' && <div className="auth-form">
            <div className="field"><label>رقم الجوال</label><input type="tel" placeholder="05xxxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
            <div className="field"><label>رقم الهوية الوطنية</label><input type="text" placeholder="1xxxxxxxxx" value={nationalId} onChange={e=>setNationalId(e.target.value)} maxLength={10} /></div>
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button className="auth-btn" onClick={handleLogin} disabled={loading}>{loading?<span className="spinner"/>:'دخول'}</button>
          </div>}
          {tab==='register' && <div className="auth-form">
            <div className="field"><label>الاسم الكامل</label><input type="text" placeholder="محمد بن أحمد" value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
            <div className="field"><label>البريد الإلكتروني</label><input type="email" placeholder="example@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div className="field"><label>رقم الجوال</label><input type="tel" placeholder="05xxxxxxxx" value={regPhone} onChange={e=>setRegPhone(e.target.value)} /></div>
            <div className="field"><label>رقم الهوية الوطنية</label><input type="text" placeholder="1xxxxxxxxx" value={regNationalId} onChange={e=>setRegNationalId(e.target.value)} maxLength={10} /></div>
            <div className="field"><label>المدينة</label><select value={city} onChange={e=>setCity(e.target.value)}><option value="">اختر مدينتك</option>{CITIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div className="field"><label>نوع الحساب</label><div className="type-group"><button type="button" className={'type-btn '+(userType==='client'?'active':'')} onClick={()=>setUserType('client')}>🏠 صاحب عمل</button><button type="button" className={'type-btn '+(userType==='contractor'?'active':'')} onClick={()=>setUserType('contractor')}>🔧 مقاول</button></div></div>
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button className="auth-btn" onClick={handleRegister} disabled={loading}>{loading?<span className="spinner"/>:'إنشاء الحساب'}</button>
          </div>}
        </div>
        <p className="auth-footer">بالدخول أو التسجيل أنت توافق على شروط الاستخدام</p>
      </div>
    </div>
  )
}
