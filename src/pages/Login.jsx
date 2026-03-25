import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Login.css'

const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم','نجران','جازان']

function formatPhone(raw) {
  const n = raw.replace(/\D/g, '')
  if (n.startsWith('966')) return '+' + n
  if (n.startsWith('0')) return '+966' + n.slice(1)
  if (n.length === 9) return '+966' + n
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
    if (!phone.trim() || !nationalId.trim()) { setError('أدخل رقم الجوال ورقم الهوية'); setLoading(false); return }
    const fp = formatPhone(phone)
    // Find user in public.users first
    const { data: userData } = await supabase.from('users').select('id, user_type, email').eq('phone', fp).eq('national_id', nationalId).maybeSingle()
    if (!userData) { setError('رقم الجوال أو رقم الهوية غير صحيح'); setLoading(false); return }
    // Use deterministic fake email
    const authEmail = nationalId + fp.replace('+', '') + '@mq.sa'
    // Try sign in first
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: authEmail, password: nationalId })
    if (!signInErr) {
      userData.user_type === 'contractor' ? navigate('/dashboard/contractor') : navigate('/')
      setLoading(false); return
    }
    // If failed, try creating auth record (user exists in public.users but not in auth)
    const { error: signUpErr } = await supabase.auth.signUp({ email: authEmail, password: nationalId })
    if (signUpErr) { setError('حدث خطأ في تسجيل الدخول'); setLoading(false); return }
    // Confirm email via RPC
    await supabase.rpc('confirm_user_email', { user_email: authEmail })
    // Sign in again
    const { error: signInErr2 } = await supabase.auth.signInWithPassword({ email: authEmail, password: nationalId })
    if (signInErr2) { setError('تم إنشاء الحساب، حاول تسجيل الدخول مرة أخرى'); setLoading(false); return }
    userData.user_type === 'contractor' ? navigate('/dashboard/contractor') : navigate('/')
    setLoading(false)
  }

  async function handleRegister() {
    setError(''); setLoading(true)
    if (!fullName.trim()) { setError('أدخل اسمك الكامل'); setLoading(false); return }
    const fp = formatPhone(regPhone)
    if (fp.length < 12) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    if (!regNationalId.match(/^[12]\d{9}$/)) { setError('رقم الهوية 10 أرقام يبدأ بـ 1 أو 2'); setLoading(false); return }
    if (!city) { setError('اختر مدينتك'); setLoading(false); return }
    // Check if user already exists
    const { data: ex } = await supabase.from('users').select('id').or('phone.eq.' + fp + ',national_id.eq.' + regNationalId).maybeSingle()
    if (ex) { setError('هذا الجوال أو رقم الهوية مسجل مسبقاً'); setLoading(false); return }
    const authEmail = regNationalId + fp.replace('+', '') + '@mq.sa'
    // Sign up in auth
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({ email: authEmail, password: regNationalId })
    if (signUpErr || !authData.user) {
      // Email already registered in auth but not in public.users - handle gracefully
      if (signUpErr?.message?.includes('already registered')) {
        setError('هذا الجوال أو رقم الهوية مسجل مسبقاً')
      } else {
        setError('حدث خطأ: ' + (signUpErr?.message || ''))
      }
      setLoading(false); return
    }
    // Confirm email immediately
    await supabase.rpc('confirm_user_email', { user_email: authEmail })
    // Insert into public.users
    const { error: insertErr } = await supabase.from('users').insert({
      id: authData.user.id, phone: fp,
      email: email.trim() || null,
      full_name: fullName.trim(),
      national_id: regNationalId,
      user_type: userType, city,
      is_verified: true
    })
    if (insertErr) {
      setError(insertErr.code === '23505' ? 'هذه البيانات مسجلة مسبقاً' : 'حدث خطأ، حاول مرة أخرى')
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
    <div className="auth-page" dir="rtl">
      <div className="auth-bg" />
      <div className="auth-wrap">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏗️</div>
          <h1>مقاولي</h1>
          <p>سوق المقاولات السعودي</p>
        </div>
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={'auth-tab '+(tab==='login'?'active':'')} onClick={()=>{setTab('login');setError('')}}>تسجيل الدخول</button>
            <button className={'auth-tab '+(tab==='register'?'active':'')} onClick={()=>{setTab('register');setError('')}}>حساب جديد</button>
          </div>
          {tab === 'login' && (
            <div className="auth-form">
              <div className="field"><label>رقم الجوال</label><input type="tel" placeholder="05xxxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
              <div className="field"><label>رقم الهوية الوطنية</label><input type="text" placeholder="1xxxxxxxxx" value={nationalId} onChange={e=>setNationalId(e.target.value)} maxLength={10} /></div>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button className="auth-btn" onClick={handleLogin} disabled={loading}>{loading ? <span className="spinner" /> : 'دخول'}</button>
            </div>
          )}
          {tab === 'register' && (
            <div className="auth-form">
              <div className="field"><label>الاسم الكامل</label><input type="text" placeholder="محمد بن أحمد" value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
              <div className="field"><label>البريد الإلكتروني (اختياري)</label><input type="email" placeholder="example@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
              <div className="field"><label>رقم الجوال</label><input type="tel" placeholder="05xxxxxxxx" value={regPhone} onChange={e=>setRegPhone(e.target.value)} /></div>
              <div className="field"><label>رقم الهوية الوطنية</label><input type="text" placeholder="1xxxxxxxxx" value={regNationalId} onChange={e=>setRegNationalId(e.target.value)} maxLength={10} /></div>
              <div className="field"><label>المدينة</label><select value={city} onChange={e=>setCity(e.target.value)}><option value="">اختر مدينتك</option>{CITIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div className="field"><label>نوع الحساب</label><div className="type-group"><button type="button" className={'type-btn '+(userType==='client'?'active':'')} onClick={()=>setUserType('client')}>🏠 صاحب عمل</button><button type="button" className={'type-btn '+(userType==='contractor'?'active':'')} onClick={()=>setUserType('contractor')}>🔧 مقاول</button></div></div>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button className="auth-btn" onClick={handleRegister} disabled={loading}>{loading ? <span className="spinner" /> : 'إنشاء الحساب'}</button>
            </div>
          )}
        </div>
        <p className="auth-footer">بالدخول أنت توافق على شروط الاستخدام</p>
      </div>
    </div>
  )
}
