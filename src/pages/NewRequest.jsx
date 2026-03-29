import FileUploader from '../components/FileUploader'
;
;
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './NewRequest.css'

const CATEGORIES = [
  { value: 'cladding', label: 'كلادينج', icon: '🏗️' },
  { value: 'plumbing', label: 'سباكة', icon: '🚧' },
  { value: 'electrical', label: 'كهرباء', icon: '⚡' },
  { value: 'demolition', label: 'هدم', icon: '💥' },
  { value: 'finishing', label: 'تشطيب', icon: '🎨' },
  { value: 'painting', label: 'دهان', icon: '🖌️' },
  { value: 'flooring', label: 'أرضيات', icon: '🧱' },
  { value: 'hvac', label: 'تكييف', icon: '❄️' },
  { value: 'general', label: 'عام', icon: '🔧' },
]

const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم','نجران','جازان']

export default function NewRequest() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    district: '',
    budget_min: '',
    budget_max: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
  }, [])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError(''); setLoading(true)
    const user = currentUser
    if (!user) { navigate('/login'); return }
    if (!form.title.trim()) { setError('أدخل عنوان الطلب'); setLoading(false); return }
    if (!form.description.trim()) { setError('أدخل وصف الطلب'); setLoading(false); return }
    if (!form.category) { setError('اختر تصنيف الخدمة'); setLoading(false); return }
    if (!form.city) { setError('اختر المدينة'); setLoading(false); return }
    const { data, error: err } = await supabase.from('service_requests').insert({
      client_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      city: form.city,
      district: form.district || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      status: 'open', files: uploadedFiles, images: uploadedFiles.filter(u => /\.(jpg|jpeg|png|gif|webp)/i.test(u)),
    }).select().single()
    setLoading(false)
    if (err) { setError('حدث خطأ، حاول مرة أخرى'); return }
    navigate('/requests/' + data.id)
  }

  return (
    <div className="new-req-page" dir="rtl">
      <div className="new-req-container">
        <div className="new-req-header">
          <button className="back-btn" onClick={() => navigate(-1)}>← رجوع</button>
          <h1>طلب خدمة جديد</h1>
        </div>

        <div className="steps-bar">
          {[1,2,3].map(s => (
            <div key={s} className={'step ' + (step >= s ? 'active' : '') + (step > s ? ' done' : '')}>
              <div className="step-num">{step > s ? '✓' : s}</div>
              <div className="step-label">{s===1?'التفاصيل':s===2?'التصنيف':'الميزانية'}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="step-content">
            <div className="field">
              <label>عنوان الطلب *</label>
              <input type="text" placeholder="مثال: تركيب كلادينج لواجهة عمارة" value={form.title} onChange={e=>update('title',e.target.value)} />
            </div>
            <div className="field">
              <label>وصف الطلب *</label>
              <textarea rows={5} placeholder="صف العمل المطلوب بتفصيل..." value={form.description} onChange={e=>update('description',e.target.value)} />
            </div>
            <div className="field">
              <label>المدينة *</label>
              <select value={form.city} onChange={e=>update('city',e.target.value)}>
                <option value="">اختر المدينة</option>
                {CITIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>الحي (اختياري)</label>
              <input type="text" placeholder="مثال: حي النزهة" value={form.district} onChange={e=>update('district',e.target.value)} />
            </div>
            <button className="next-btn" onClick={() => {
              if (!form.title.trim() || !form.description.trim() || !form.city) { setError('يرجى تعبئة جميع الحقول الإلزامية'); return }
              setError(''); setStep(2)
            }}>التالي →</button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <label className="field-label">تصنيف الخدمة *</label>
            <div className="categories-grid">
              {CATEGORIES.map(cat => (
                <button key={cat.value} className={'cat-card ' + (form.category === cat.value ? 'active' : '')} onClick={() => update('category', cat.value)}>
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-label">{cat.label}</span>
                </button>
              ))}
            </div>
            <div className="step-btns">
              <button className="back-step-btn" onClick={() => setStep(1)}>← رجوع</button>
              <button className="next-btn" onClick={() => {
                if (!form.category) { setError('اختر تصنيف الخدمة'); return }
                setError(''); setStep(3)
              }}>التالي →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="budget-section">
              <label className="field-label">الميزانية المتوقعة (ريال سعودي)</label>
              <div className="budget-row">
                <div className="field">
                  <label>الحد الأدنى</label>
                  <input type="number" placeholder="5000" value={form.budget_min} onChange={e=>update('budget_min',e.target.value)} />
                </div>
                <div className="budget-sep">-</div>
                <div className="field">
                  <label>الحد الأعلى</label>
                  <input type="number" placeholder="20000" value={form.budget_max} onChange={e=>update('budget_max',e.target.value)} />
                </div>
              </div>
            </div>

            <div className="req-summary">
              <h3>ملخص الطلب</h3>
              <div className="summary-row"><span>العنوان:</span><span>{form.title}</span></div>
              <div className="summary-row"><span>التصنيف:</span><span>{CATEGORIES.find(c=>c.value===form.category)?.label}</span></div>
              <div className="summary-row"><span>المدينة:</span><span>{form.city}</span></div>
            </div>

            {error && <div className="req-error">⚠️ {error}</div>}
            <div className="step-btns">
              <button className="back-step-btn" onClick={() => setStep(2)}>← رجوع</button>
              <FileUploader
          bucket="request-images"
          folder={currentUser?.id || 'requests'}
          label="صور أو ملفات توضيحية"
          maxFiles={10}
          onFilesChange={(urls) => setUploadedFiles(urls)}
        />
        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>{loading ? 'جاريي...' : 'إرسال الطلب ✓'}</button>
            </div>
          </div>
        )}

        {error && step < 3 && <div className="req-error">⚠️ {error}</div>}
      </div>
    </div>
  )
}
