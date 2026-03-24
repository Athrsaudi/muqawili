import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Login.css'

const STEPS = { PHONE: 'phone', OTP: 'otp', TYPE: 'type', NAME: 'name' }

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(STEPS.PHONE)
  const [phone, setPhone]     = useState('')
  const [otp, setOtp]         = useState('')
  const [userType, setType]   = useState('')
  const [fullName, setName]   = useState('')
  const [nationalId, setNid]  = useState('')
  const [city, setCity]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم']

  function formatPhone(raw) {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('966')) return '+' + digits
    if (digits.startsWith('0'))   return '+966' + digits.slice(1)
    if (digits.length === 9)      return '+966' + digits
    return '+966' + digits
  }

  async function sendOtp() {
    setError(''); setLoading(true)
    const formatted = formatPhone(phone)
    if (formatted.length < 13) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    const { error: err } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (err) { setError('تعذر إرسال الرمز، تحقق من الرقم وحاول مجدداً'); setLoading(false); return }
    setStep(STEPS.OTP); setLoading(false)
  }

  async function verifyOtp() {
    setError(''); setLoading(true)
    const formatted = formatPhone(phone)
    const { data, error: err } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    if (err || !data.user) { setError('الرمز غير صحيح أو انتهت صلاحيته'); setLoading(false); return }

    // Check if user already has a profile
    const { data: existing } = await supabase.from('users').select('id,user_type').eq('id', data.user.id).single()
    if (existing) { navigate('/'); return }

    setStep(STEPS.TYPE); setLoading(false)
  }

  async function completeProfile() {
    setError(''); setLoading(true)
    if (!fullName.trim()) { setError('أدخل اسمك الكامل'); setLoading(false); return }
    if (!nationalId.match(/^[12]\d{9}$/)) { setError('أدخل رقم هوية وطنية صحيح (١٠ أرقام)'); setLoading(false); return }
    if (!city) { setError('اختر مدينتك'); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('users').insert({
      id: user.id, phone: formatPhone(phone),
      full_name: fullName, national_id: nationalId,
      user_type: userType, city, is_verified: true
    })

    if (err) {
      if (err.code === '23505') setError('هذه الهوية مسجلة مسبقاً')
      else setError('حدث خطأ، حاول مرة أخرى')
      setLoading(false); return
    }

    if (userType === 'contractor') {
      await supabase.from('contractor_profiles').insert({ user_id: user.id, years_experience: 0 })
      navigate('/dashboard/contractor')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">🔨</span>
          <span className="logo-text">مقاولي</span>
        </div>

        {/* ── STEP 1: PHONE ── */}
        {step === STEPS.PHONE && (
          <div className="login-step">
            <h2>أهلاً بك</h2>
            <p className="step-desc">أدخل رقم جوالك للدخول أو التسجيل</p>
            <div className="input-group">
              <label>رقم الجوال</label>
              <div className="phone-input-wrapper">
                <span className="phone-prefix">🇸🇦 +966</span>
                <input
                  className="input phone-input"
                  type="tel"
                  placeholder="05XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  maxLength={10}
                />
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary btn-full btn-lg" onClick={sendOtp} disabled={loading}>
              {loading ? <span className="spinner-sm"/> : 'إرسال رمز التحقق'}
            </button>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === STEPS.OTP && (
          <div className="login-step">
            <h2>رمز التحقق</h2>
            <p className="step-desc">أرسلنا رمزاً من ٦ أرقام إلى <strong>{phone}</strong></p>
            <div className="input-group">
              <label>رمز التحقق</label>
              <input
                className="input otp-input"
                type="number"
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                maxLength={6}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary btn-full btn-lg" onClick={verifyOtp} disabled={loading || otp.length < 6}>
              {loading ? <span className="spinner-sm"/> : 'تحقق من الرمز'}
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => { setStep(STEPS.PHONE); setOtp(''); setError('') }}>
              تغيير رقم الجوال
            </button>
          </div>
        )}

        {/* ── STEP 3: USER TYPE ── */}
        {step === STEPS.TYPE && (
          <div className="login-step">
            <h2>نوع حسابك</h2>
            <p className="step-desc">اختر كيف ستستخدم المنصة</p>
            <div className="type-cards">
              <button
                className={`type-card ${userType === 'contractor' ? 'selected' : ''}`}
                onClick={() => { setType('contractor'); setStep(STEPS.NAME) }}
              >
                <span className="type-icon">👷</span>
                <strong>أنا مقاول</strong>
                <span>أقدم خدمات البناء والمقاولات</span>
              </button>
              <button
                className={`type-card ${userType === 'client' ? 'selected' : ''}`}
                onClick={() => { setType('client'); setStep(STEPS.NAME) }}
              >
                <span className="type-icon">🏗️</span>
                <strong>أبحث عن مقاول</strong>
                <span>لدي مشروع أو أحتاج خدمة</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: COMPLETE PROFILE ── */}
        {step === STEPS.NAME && (
          <div className="login-step">
            <h2>أكمل بياناتك</h2>
            <p className="step-desc">بياناتك الأساسية لإنشاء حسابك</p>
            <div className="input-group">
              <label>الاسم الكامل</label>
              <input className="input" type="text" placeholder="محمد أحمد العتيبي" value={fullName} onChange={e => setName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>رقم الهوية الوطنية</label>
              <input className="input" type="number" placeholder="1XXXXXXXXX" value={nationalId} onChange={e => setNid(e.target.value)} maxLength={10} />
            </div>
            <div className="input-group">
              <label>المدينة</label>
              <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                <option value="">اختر مدينتك</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary btn-full btn-lg" onClick={completeProfile} disabled={loading}>
              {loading ? <span className="spinner-sm"/> : 'إنشاء الحساب'}
            </button>
          </div>
        )}

        <p className="login-footer">
          بالمتابعة توافق على <a href="/terms">شروط الاستخدام</a> و<a href="/privacy">سياسة الخصوصية</a>
        </p>
      </div>
    </div>
  )
}
