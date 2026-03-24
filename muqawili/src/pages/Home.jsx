import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './Home.css'

const CATEGORIES = [
  { key: 'cladding',    label: 'كلادينج',        icon: '🏗️' },
  { key: 'plumbing',   label: 'سباكة',           icon: '🔧' },
  { key: 'electrical', label: 'كهرباء',          icon: '⚡' },
  { key: 'demolition', label: 'هدم وبناء',       icon: '🪚' },
  { key: 'finishing',  label: 'تشطيب',           icon: '🏠' },
  { key: 'painting',   label: 'دهانات',          icon: '🎨' },
  { key: 'flooring',   label: 'أرضيات',          icon: '🪵' },
  { key: 'hvac',       label: 'تكييف وتهوية',    icon: '❄️' },
  { key: 'general',    label: 'مقاولات عامة',    icon: '🏢' },
]

const CITIES = ['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها']

const HOW_IT_WORKS = [
  { icon: '📋', title: 'انشر طلبك',        desc: 'حدد نوع الخدمة والمنطقة ووصف ما تحتاجه' },
  { icon: '📨', title: 'استقبل العروض',     desc: 'يصلك عروض أسعار حقيقية من مقاولين في منطقتك' },
  { icon: '🤝', title: 'اختر الأنسب',       desc: 'قارن العروض وملفات المقاولين وتواصل معهم مباشرة' },
]

const STATS = [
  { value: '٥٠٠+', label: 'مقاول مسجّل' },
  { value: '١٢+',  label: 'تخصص مختلف' },
  { value: '١٠+',  label: 'مدن في المملكة' },
  { value: '٩٨٪',  label: 'نسبة رضا العملاء' },
]

export default function Home() {
  const navigate = useNavigate()
  const [city, setCity]         = useState('')
  const [category, setCategory] = useState('')

  function handleSearch() {
    const params = new URLSearchParams()
    if (city)     params.set('city', city)
    if (category) params.set('category', category)
    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className="home">

      {/* ── HERO ── */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-text">
            <h1>ابحث عن مقاول <span className="hero-highlight">موثوق</span> في منطقتك</h1>
            <p>منصة مقاولي تربطك بمقاولين محترفين في جميع التخصصات — احصل على عروض أسعار حقيقية وقارن بينها بسهولة</p>
          </div>

          <div className="hero-search card">
            <div className="search-row">
              <div className="input-group search-field">
                <label>نوع الخدمة</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">جميع التخصصات</option>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div className="input-group search-field">
                <label>المدينة</label>
                <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">جميع المدن</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-lg search-btn" onClick={handleSearch}>
                🔍 ابحث الآن
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-bar">
        <div className="container stats-inner">
          {STATS.map((s, i) => (
            <div key={i} className="stat-item">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2>تخصصاتنا</h2>
            <p>نغطي جميع أعمال البناء والمقاولات</p>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.key}
                to={`/search?category=${cat.key}`}
                className="category-card card"
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header">
            <h2>كيف تعمل المنصة؟</h2>
            <p>ثلاث خطوات بسيطة للحصول على مقاولك</p>
          </div>
          <div className="how-grid">
            {HOW_IT_WORKS.map((h, i) => (
              <div key={i} className="how-card card">
                <div className="how-num">{i + 1}</div>
                <div className="how-icon">{h.icon}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-text">
              <h2>هل أنت مقاول؟</h2>
              <p>سجّل في المنصة مجاناً وابدأ في استقبال طلبات من منطقتك — بدون سجل تجاري مطلوب</p>
            </div>
            <Link to="/login" className="btn btn-accent btn-lg">
              سجّل الآن مجاناً
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
