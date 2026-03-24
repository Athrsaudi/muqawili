import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

enum Step {
  LOGIN,
  REGISTER,
}

const CITIES = ['جدة', 'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'حائل', 'القصيم']

function formatPhone(raw: string): string {
  const n = raw.replace(/\D/g, '')
  if (n.startsWith('966')) return '+' + n
  if (n.startsWith('0')) return '+966' + n.slice(1)
  return '+966' + n
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(Step.LOGIN)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login fields
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')

  // Register fields
  const [fullName, setFullName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regNationalId, setRegNationalId] = useState('')
  const [userType, setUserType] = useState<'contractor' | 'client'>('client')
  const [city, setCity] = useState('')

  // ─── LOGIN ───────────────────────────────────────────
  async function handleLogin() {
    setError('')
    setLoading(true)

    const formattedPhone = formatPhone(phone)
    if (formattedPhone.length < 13) {
      setError('أدخل رقم جوال سعودي صحيح')
      setLoading(false)
      return
    }
    if (!nationalId.match(/^[12]\d{9}$/)) {
      setError('أدخل رقم هوية وطنية صحيح (10 أرقام)')
      setLoading(false)
      return
    }

    // Check user exists in DB
    const { data: user, error: dbErr } = await supabase
      .from('users')
      .select('id, user_type, phone, national_id')
      .eq('phone', formattedPhone)
      .eq('national_id', nationalId)
      .single()

    if (dbErr || !user) {
      setError('رقم الجوال أو رقم الهوية غير صحيح')
      setLoading(false)
      return
    }

    // Sign in anonymously then set session via custom token
    // Use signInWithPassword with phone as email workaround
    const fakeEmail = `${user.id}@muqawili.app`
    const password = nationalId

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    })

    if (signInErr) {
      // Try creating auth user if not exists
      const { error: signUpErr } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
      })
      if (signUpErr) {
        setError('حدث خطأ في تسجيل الدخول، حاول مرة أخرى')
        setLoading(false)
        return
      }
    }

    user.user_type === 'contractor'
      ? navigate('/dashboard/contractor')
      : navigate('/')

    setLoading(false)
  }

  // ─── REGISTER ────────────────────────────────────────
  async function handleRegister() {
    setError('')
    setLoading(true)

    if (!fullName.trim()) { setError('أدخل اسمك الكامل'); setLoading(false); return }
    const formattedPhone = formatPhone(regPhone)
    if (formattedPhone.length < 13) { setError('أدخل رقم جوال سعودي صحيح'); setLoading(false); return }
    if (!regNationalId.match(/^[12]\d{9}$/)) { setError('أدخل رقم هوية وطنية صحيح (10 أرقام)'); setLoading(false); return }
    if (!city) { setError('اختر مدينتك'); setLoading(false); return }

    // Check not already registered
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`phone.eq.${formattedPhone},national_id.eq.${regNationalId}`)
      .single()

    if (existing) {
      setError('هذا الجوال أو رقم الهوية مسجل مسبقاً')
      setLoading(false)
      return
    }

    // Create auth user
    const tempId = crypto.randomUUID()
    const fakeEmail = `${tempId}@muqawili.app`
    const password = regNationalId

    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: fakeEmail,
      password,
    })

    if (signUpErr || !authData.user) {
      setError('حدث خطأ في إنشاء الحساب')
      setLoading(false)
      return
    }

    // Insert into users table
    const { error: insertErr } = await supabase.from('users').insert({
      id: authData.user.id,
      phone: formattedPhone,
      full_name: fullName,
      national_id: regNationalId,
      user_type: userType,
      city,
      is_verified: true,
    })

    if (insertErr) {
      insertErr.code === '23505'
        ? setError('هذه الهوية مسجلة مسبقاً')
        : setError('حدث خطأ، حاول مرة أخرى')
      setLoading(false)
      return
    }

    if (userType === 'contractor') {
      await supabase.from('contractor_profiles').insert({
        user_id: authData.user.id,
        years_experience: 0,
      })
      navigate('/dashboard/contractor')
    } else {
      navigate('/')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🏗️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">مقاولي</h1>
          <p className="text-gray-500 text-sm mt-1">سوق المقاولات السعودي</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setStep(Step.LOGIN); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                step === Step.LOGIN ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setStep(Step.REGISTER); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                step === Step.REGISTER ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              حساب جديد
            </button>
          </div>

          {/* LOGIN FORM */}
          {step === Step.LOGIN && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الجوال</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهوية الوطنية</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  placeholder="1xxxxxxxxx"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {loading ? 'جارٍ الدخول...' : 'دخول'}
              </button>
            </div>
          )}

          {/* REGISTER FORM */}
          {step === Step.REGISTER && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم الكامل</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="محمد بن أحمد"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الجوال</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهوية الوطنية</label>
                <input
                  type="text"
                  value={regNationalId}
                  onChange={e => setRegNationalId(e.target.value)}
                  placeholder="1xxxxxxxxx"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">المدينة</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">اختر مدينتك</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">نوع الحساب</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserType('client')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      userType === 'client'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    🏠 صاحب عمل
                  </button>
                  <button
                    onClick={() => setUserType('contractor')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      userType === 'contractor'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    🔧 مقاول
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
