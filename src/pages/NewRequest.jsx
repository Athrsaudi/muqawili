import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './NewRequest.css'

const CATEGORIES = [
  { key: 'cladding',   label: 'كلادينج',       icon: '🏗️' },
  { key: 'plumbing',   label: 'سباكة',         icon: '🔧' },
  { key: 'electrical', label: 'كهرباء',        icon: '⚡' },
  { key: 'demolition', label: 'هدم وبناء',     icon: '🪚' },
  { key: 'finishing',  label: 'تشطيب',         icon: '🏠' },
  { key: 'painting',   label: 'دهانات',        icon: '🎨' },
  { key: 'flooring',   label: 'أرضيات',        icon: '🪵' },
  { key: 'hvac',       label: 'تكييف وتهوية',  icon: '❄️' },
  { key: 'general',    label: 'مقاولات عامة',  icon: '🏢' },
]

const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم']

export default function NewRequest() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ title:'', description:'', category:'', city:'', district:'', budget_min:'', budget_max:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) return (
    <div className="page-loading">
      <span style={{fontSize:48}}>🔐</span>
      <h3>يجب تسجيل الدخول أولاً</h3>
      <Link to="/login" className="btn btn-primary">تسجيل الدخول</Link>
    </div>
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    setError('')
    if (!form.title.trim())       { setError('أدخل عنوان الطلب'); return }
    if (!form.description.trim()) { setError('أدخل وصف العمل المطلوب'); return }
    if (!form.category)           { setError('اختر نوع الخدمة'); return }
    if (!form.city)               { setError('اختر مدينة المشروع'); return }

    setLoading(true)
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)

    const { data, error: err } = await supabase.from('service_requests').insert({
      client_id:   user.id,
      title:       form.title,
      description: form.description,
      category:    form.category,
      city:        form.city,
      district:    form.district || null,
      budget_min:  form.budget_min ? parseFloat(form.budget_min) : null,
      budget_max:  form.budget_max ? parseFloat(form.budget_max) : null,
      expires_at:  expiry.toISOString(),
    }).select().single()

    if (err) { setError('حدث خطأ أثناء نشر الطلب، حاول مجدداً'); setLoading(false); return }
    navigate(`/request/${data.id}`)
  }

  return (
    <div className="new-request-page">
      <div className="container">
        <div className="nr-card card">
          <div className="nr-header">
            <h1>نشر طلب جديد</h1>
            <p>أنشر تفاصيل مشروعك وسيصلك عروض من مقاولين في منطقتك</p>
          </div>

          <div className="nr-form">
            {/* Title */}
            <div className="input-group">
              <label>عنوان الطلب *</label>
              <input className="input" type="text" placeholder="مثال: تركيب كلادينج لواجهة عمارة تجارية"
                value={form.title} onChange={e => set('title', e.target.value)} maxLength={200} />
              <span className="char-count">{form.title.length}/200</span>
            </div>

            {/* Category */}
            <div className="input-group">
              <label>نوع الخدمة *</label>
              <div className="category-picker">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    className={`cat-btn ${form.category === cat.key ? 'selected' : ''}`}
                    onClick={() => set('category', cat.key)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="input-group">
              <label>وصف العمل المطلوب *</label>
              <textarea className="input textarea" rows={4}
                placeholder="اشرح بالتفصيل ما تحتاجه: المساحة، نوع المواد، أي متطلبات خاصة..."
                value={form.description} onChange={e => set('description', e.target.value)} maxLength={2000}
              />
              <span className="char-count">{form.description.length}/2000</span>
            </div>

            {/* Location */}
            <div className="form-row">
              <div className="input-group">
                <label>مدينة المشروع *</label>
                <select className="input" value={form.city} onChange={e => set('city', e.target.value)}>
                  <option value="">اختر المدينة</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>الحي (اختياري)</label>
                <input className="input" type="text" placeholder="مثال: الروضة"
                  value={form.district} onChange={e => set('district', e.target.value)} />
              </div>
            </div>

            {/* Budget */}
            <div className="form-row">
              <div className="input-group">
                <label>الميزانية الدنيا (ريال)</label>
                <input className="input" type="number" placeholder="5000"
                  value={form.budget_min} onChange={e => set('budget_min', e.target.value)} min={0} />
              </div>
              <div className="input-group">
                <label>الميزانية القصوى (ريال)</label>
                <input className="input" type="number" placeholder="20000"
                  value={form.budget_max} onChange={e => set('budget_max', e.target.value)} min={0} />
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="nr-submit">
              <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading}>
                {loading ? <span className="spinner-sm"/> : '🚀 نشر الطلب الآن'}
              </button>
              <p className="nr-note">سيبقى طلبك مفتوحاً لمدة ٣٠ يوماً</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
