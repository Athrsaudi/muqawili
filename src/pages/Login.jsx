import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icons'

function LogoIconMini() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
      <defs>
        <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C8922A"/>
          <stop offset="50%" stopColor="#E8B84B"/>
          <stop offset="100%" stopColor="#A67420"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="48" height="48" rx="12" fill="#2D1A00" stroke="url(#lg)" strokeWidth="1.5"/>
      <rect x="14" y="18" width="7" height="7" rx="1.5" fill="url(#lg)"/>
      <rect x="23" y="12" width="8" height="13" rx="1.5" fill="url(#lg)"/>
      <rect x="33" y="18" width="7" height="7" rx="1.5" fill="url(#lg)"/>
      <rect x="12" y="23" width="28" height="22" rx="2" fill="url(#lg)" fillOpacity=".13" stroke="url(#lg)" strokeWidth="1.1"/>
      <rect x="20" y="29" width="12" height="10" rx="2" fill="none" stroke="url(#lg)" strokeWidth="1"/>
      <path d="M20 34 Q26 27 32 34" fill="none" stroke="url(#lg)" strokeWidth="1"/>
      <line x1="26" y1="27" x2="26" y2="39" stroke="url(#lg)" strokeWidth=".8" strokeOpacity=".5"/>
    </svg>
  )
}
import './Login.css'

const CITIES = ['جدة', 'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'حائل', 'القصيم', 'نجران', 'جازان']

function fmt(raw) {
  const t = raw.replace(/\D/g, '')
  if (t.startsWith('966')) return '+' + t
  if (t.startsWith('0')) return '+966' + t.slice(1)
  return '+966' + t
}

export default function Login() {
  const nav = useNavigate()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showPassReg, setShowPassReg] = useState(false)

  // Login fields
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [name, setName] = useState('')
  const [rPhone, setRPhone] = useState('')
  const [rPassword, setRPassword] = useState('')
  const [rPasswordConfirm, setRPasswordConfirm] = useState('')
  const [utype, setUtype] = useState('client')
  const [city, setCity] = useState('')
  const [workCities, setWorkCities] = useState([])

  function toggleWorkCity(c) {
    setWorkCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  async function doLogin() {
    setError(''); setLoading(true)
    if (!phone.trim() || !password.trim()) {
      setError('أدخل رقم الجوال وكلمة المرور'); setLoading(false); return
    }
    const p = fmt(phone)
    // جلب المستخدم بالجوال
    const { data: u } = await supabase.from('users')
      .select('id, user_type, is_active, email')
      .eq('phone', p)
      .maybeSingle()

    if (!u) { setError('رقم الجوال غير مسجل'); setLoading(false); return }
    if (u.is_active === false) { setError('تم تعليق هذا الحساب. تواصل مع الدعم.'); setLoading(false); return }

    const { error: e1 } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: password
    })
    if (e1) { setError('كلمة المرور غير صحيحة'); setLoading(false); return }

    u.user_type === 'contractor' ? nav('/dashboard/contractor')
      : u.user_type === 'admin' ? nav('/admin')
      : nav('/')
    setLoading(false)
  }

  async function doRegister() {
    setError(''); setLoading(true)
    if (!name.trim()) { setError('أدخل اسمك الكامل'); setLoading(false); return }
    const p = fmt(rPhone)
    if (p.length < 12) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    if (rPassword.length < 6) { setError('كلمة المرور 6 أحرف على الأقل'); setLoading(false); return }
    if (rPassword !== rPasswordConfirm) { setError('كلمتا المرور غير متطابقتان'); setLoading(false); return }
    if (!city) { setError('اختر مدينتك'); setLoading(false); return }
    if (utype === 'contractor' && workCities.length === 0) { setError('حدد مدينة عمل واحدة على الأقل'); setLoading(false); return }

    // تحقق من عدم تكرار الجوال
    const { data: ex } = await supabase.from('users').select('id').eq('phone', p).maybeSingle()
    if (ex) { setError('هذا الجوال مسجل مسبقاً'); setLoading(false); return }

    // إنشاء email وهمي من رقم الجوال فقط
    const fe = p.replace('+', '') + '@mq.sa'

    const { data: ad, error: e1 } = await supabase.auth.signUp({ email: fe, password: rPassword })
    if (e1 || !ad.user) {
      setError(e1?.message?.includes('already registered') ? 'هذا الجوال مسجل مسبقاً' : 'حدث خطأ: ' + (e1?.message || ''))
      setLoading(false); return
    }

    await supabase.rpc('confirm_user_email', { user_email: fe })

    const { error: e2 } = await supabase.from('users').insert({
      id: ad.user.id,
      phone: p,
      email: fe,
      full_name: name.trim(),
      national_id: '0000000000', // placeholder — لم نعد نطلبه
      user_type: utype,
      city,
      is_verified: true
    })
    if (e2) {
      setError(e2.code === '23505' ? 'هذه البيانات مسجلة مسبقاً' : 'حدث خطأ، حاول مرة أخرى')
      setLoading(false); return
    }

    if (utype === 'contractor') {
      const { data: profile } = await supabase.from('contractor_profiles')
        .insert({ user_id: ad.user.id, years_experience: 0 })
        .select('id').single()
      if (profile?.id && workCities.length > 0) {
        await supabase.from('contractor_areas')
          .upsert(workCities.map(c => ({ contractor_id: profile.id, city: c })), { onConflict: 'contractor_id,city' })
      }
      nav('/dashboard/contractor')
    } else {
      nav('/')
    }
    setLoading(false)
  }

  return (
    <div className='auth-page' dir='rtl'>
      <div className='auth-bg' />
      <div className='auth-wrap'>
        <div className='auth-logo'>
          <div className='auth-logo-icon'><LogoIconMini /></div>
          <h1>مقاولي</h1>
          <p>سوق المقاولات السعودي</p>
        </div>
        <div className='auth-card'>
          <div className='auth-tabs'>
            <button className={'auth-tab ' + (tab === 'login' ? 'active' : '')} onClick={() => { setTab('login'); setError('') }}>تسجيل الدخول</button>
            <button className={'auth-tab ' + (tab === 'register' ? 'active' : '')} onClick={() => { setTab('register'); setError('') }}>حساب جديد</button>
          </div>

          {/* ── تسجيل الدخول ── */}
          {tab === 'login' && (
            <div className='auth-form'>
              <div className='field'>
                <label>رقم الجوال</label>
                <input type='tel' placeholder='05xxxxxxxx' value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className='field'>
                <label>كلمة المرور</label>
                <div className='pass-wrapper'>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder='أدخل كلمة المرور'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doLogin()}
                  />
                  <button type='button' className='pass-toggle' onClick={() => setShowPass(v => !v)}>
                    <Icon name={showPass ? 'eyeOff' : 'eye'} size={17} />
                  </button>
                </div>
              </div>
              {error && <div className='auth-error'>{error}</div>}
              <button className='auth-btn' onClick={doLogin} disabled={loading}>
                {loading ? <span className='spinner' /> : 'دخول'}
              </button>
            </div>
          )}

          {/* ── إنشاء حساب ── */}
          {tab === 'register' && (
            <div className='auth-form'>
              <div className='field'>
                <label>الاسم الكامل</label>
                <input type='text' value={name} onChange={e => setName(e.target.value)} placeholder='محمد عبدالله' />
              </div>
              <div className='field'>
                <label>رقم الجوال</label>
                <input type='tel' placeholder='05xxxxxxxx' value={rPhone} onChange={e => setRPhone(e.target.value)} />
              </div>
              <div className='field'>
                <label>كلمة المرور</label>
                <div className='pass-wrapper'>
                  <input
                    type={showPassReg ? 'text' : 'password'}
                    placeholder='6 أحرف على الأقل'
                    value={rPassword}
                    onChange={e => setRPassword(e.target.value)}
                  />
                  <button type='button' className='pass-toggle' onClick={() => setShowPassReg(v => !v)}>
                    <Icon name={showPassReg ? 'eyeOff' : 'eye'} size={17} />
                  </button>
                </div>
              </div>
              <div className='field'>
                <label>تأكيد كلمة المرور</label>
                <div className='pass-wrapper'>
                  <input
                    type={showPassReg ? 'text' : 'password'}
                    placeholder='أعد كتابة كلمة المرور'
                    value={rPasswordConfirm}
                    onChange={e => setRPasswordConfirm(e.target.value)}
                  />
                </div>
              </div>
              <div className='field'>
                <label>مدينة الإقامة</label>
                <select value={city} onChange={e => setCity(e.target.value)}>
                  <option value=''>اختر مدينتك</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className='field'>
                <label>نوع الحساب</label>
                <div className='type-group'>
                  <button type='button' className={'type-btn ' + (utype === 'client' ? 'active' : '')} onClick={() => setUtype('client')}>🏠 صاحب عمل</button>
                  <button type='button' className={'type-btn ' + (utype === 'contractor' ? 'active' : '')} onClick={() => setUtype('contractor')}>🔧 مقاول</button>
                </div>
              </div>
              {utype === 'contractor' && (
                <div className='field'>
                  <label>مدن العمل <span style={{ color: '#94a3b8', fontSize: '12px' }}>(اختر كل المدن التي تعمل فيها)</span></label>
                  <div className='cities-grid'>
                    {CITIES.map(c => (
                      <button key={c} type='button'
                        className={'city-chip ' + (workCities.includes(c) ? 'active' : '')}
                        onClick={() => toggleWorkCity(c)}>
                        {workCities.includes(c) ? '✓ ' : ''}{c}
                      </button>
                    ))}
                  </div>
                  {workCities.length > 0 && <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '6px' }}>تم اختيار {workCities.length} مدينة</p>}
                </div>
              )}
              {error && <div className='auth-error'>{error}</div>}
              <button className='auth-btn' onClick={doRegister} disabled={loading}>
                {loading ? <span className='spinner' /> : 'إنشاء الحساب'}
              </button>
            </div>
          )}
        </div>
        <p className='auth-footer'>بالدخول أنت توافق على شروط الاستخدام</p>
      </div>
    </div>
  )
}
