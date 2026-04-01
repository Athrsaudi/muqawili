import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Home.css'

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

const CATEGORY_LABEL = { cladding:'كلادينج', plumbing:'سباكة', electrical:'كهرباء', demolition:'هدم', finishing:'تشطيب', painting:'دهان', flooring:'أرضيات', hvac:'تكييف', general:'عام' }

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ contractors: 0, requests: 0 })
  const [recentRequests, setRecentRequests] = useState([])
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [contractorsRes, requestsRes] = await Promise.all([
      supabase.from('contractor_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ])
    const { data: recent } = await supabase.from('service_requests')
      .select('id, title, category, city, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6)
    setStats({ contractors: contractorsRes.count || 0, requests: requestsRes.count || 0 })
    setRecentRequests(recent || [])
  }

  return (
    <div className="home" dir="rtl">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1 className="hero-title">ابحث عن مزود خدمة موثوق في منطقتك</h1>
          <p className="hero-sub">احصل على عروض أسعار حقيقية من خدماتين محترفين في جميع أنحاء المملكة</p>
          <div className="hero-search">
            <input type="text" placeholder="ماذا تحتاج؟ مثال: تركيب كلادينج..." value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && navigate('/search?q=' + searchQ)} />
            <button onClick={() => navigate('/search?q=' + searchQ)}>بحث</button>
          </div>
          <div className="hero-btns">
            <Link to="/requests/new" className="hero-btn-primary">أنشئ طلبًا مجانًا</Link>
            <Link to="/search" className="hero-btn-secondary">تصفح الطلبات</Link>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-row">
          <div className="stat-item"><span className="stat-num">{stats.contractors}+</span><span className="stat-lbl">مزود خدمة مسجل</span></div>
          <div className="stat-item"><span className="stat-num">{stats.requests}+</span><span className="stat-lbl">طلب مفتوح</span></div>
          <div className="stat-item"><span className="stat-num">12</span><span className="stat-lbl">مدينة سعودية</span></div>
        </div>
      </section>

      <section className="section">
        <div className="section-container">
          <h2 className="section-title">تصفح حسب التخصص</h2>
          <div className="cats-grid">
            {CATEGORIES.map(cat => (
              <Link key={cat.value} to={'/search?category=' + cat.value} className="cat-item">
                <span className="cat-emoji">{cat.icon}</span>
                <span className="cat-name">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {recentRequests.length > 0 && (
        <section className="section">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">آخر الطلبات</h2>
              <Link to="/search" className="see-all">عرض الكل ←</Link>
            </div>
            <div className="recent-grid">
              {recentRequests.map(req => (
                <Link key={req.id} to={'/requests/' + req.id} className="recent-card">
                  <span className="recent-cat">{CATEGORY_LABEL[req.category] || req.category}</span>
                  <h3 className="recent-title">{req.title}</h3>
                  <span className="recent-city">📍 {req.city}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta-section">
        <div className="cta-content">
          <h2>أنت مزود خدمة؟</h2>
          <p>سجّل الآن واحصل على عملاء جدد في منطقتك</p>
          <Link to="/login" className="cta-btn">سجّل كمقاول مجانًا</Link>
        </div>
      </section>
    </div>
  )
}
