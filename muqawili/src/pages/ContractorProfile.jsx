import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './ContractorProfile.css'

const CAT_LABELS = {
  cladding:'كلادينج', plumbing:'سباكة', electrical:'كهرباء',
  demolition:'هدم وبناء', finishing:'تشطيب', painting:'دهانات',
  flooring:'أرضيات', hvac:'تكييف وتهوية', general:'مقاولات عامة'
}

export default function ContractorProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile: myProfile } = useAuth()
  const [contractor, setContractor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchContractor() }, [id])

  async function fetchContractor() {
    const { data, error } = await supabase
      .from('contractor_profiles')
      .select(`
        *, users(full_name, city, phone),
        contractor_specializations(category),
        contractor_areas(city, district),
        contractor_portfolio(id, image_url, title, description)
      `)
      .eq('id', id)
      .single()

    if (!error) setContractor(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="page-loading">
      <div className="spinner"/>
      <p>جارٍ تحميل الملف...</p>
    </div>
  )

  if (!contractor) return (
    <div className="page-loading">
      <span style={{fontSize:48}}>😕</span>
      <p>المقاول غير موجود</p>
      <Link to="/search" className="btn btn-primary">العودة للبحث</Link>
    </div>
  )

  const c = contractor
  const name  = c.users?.full_name || 'مقاول'
  const city  = c.users?.city || ''
  const phone = c.users?.phone || ''
  const specs = c.contractor_specializations || []
  const areas = c.contractor_areas || []
  const portfolio = c.contractor_portfolio || []
  const isOwner = user && myProfile && c.user_id === user.id

  const badgeMap = { verified: { label: 'معتمد رسمياً', cls: 'badge-verified', icon: '✓' }, trusted: { label: 'موثوق', cls: 'badge-trusted', icon: '★' }, none: { label: 'جديد', cls: 'badge-none', icon: '' } }
  const badge = badgeMap[c.badge_type] || badgeMap.none

  function handleContact() {
    if (!user) { navigate('/login'); return }
    window.open(`tel:${phone}`)
  }

  function handleRequestQuote() {
    if (!user) { navigate('/login'); return }
    navigate(`/request/new?contractor=${id}`)
  }

  return (
    <div className="profile-page">
      <div className="container">

        {/* ── HEADER ── */}
        <div className="profile-header card">
          <div className="ph-main">
            <div className="ph-avatar">{name.charAt(0)}</div>
            <div className="ph-info">
              <div className="ph-name-row">
                <h1>{name}</h1>
                <span className={`badge ${badge.cls}`}>{badge.icon} {badge.label}</span>
              </div>
              <div className="ph-meta">
                <span>📍 {city}</span>
                <span>🏗️ {c.years_experience} سنة خبرة</span>
                {c.total_reviews > 0 && (
                  <span>⭐ {c.avg_rating?.toFixed(1)} ({c.total_reviews} تقييم)</span>
                )}
                <span className={c.is_available ? 'available' : 'unavailable'}>
                  {c.is_available ? '● متاح الآن' : '● غير متاح'}
                </span>
              </div>
              {c.bio && <p className="ph-bio">{c.bio}</p>}
            </div>
          </div>

          {!isOwner && (
            <div className="ph-actions">
              <button className="btn btn-primary btn-lg" onClick={handleRequestQuote}>
                📋 طلب عرض سعر
              </button>
              {user && (
                <button className="btn btn-outline btn-lg" onClick={handleContact}>
                  📞 تواصل مباشر
                </button>
              )}
              {!user && (
                <Link to="/login" className="btn btn-outline btn-lg">
                  دخول للتواصل
                </Link>
              )}
            </div>
          )}

          {isOwner && (
            <Link to="/dashboard/contractor" className="btn btn-outline">
              تعديل ملفي
            </Link>
          )}
        </div>

        <div className="profile-body">
          {/* ── SPECIALIZATIONS ── */}
          <div className="profile-section card">
            <h2>التخصصات</h2>
            <div className="specs-list">
              {specs.length > 0 ? specs.map((s, i) => (
                <span key={i} className="spec-pill">
                  {CAT_LABELS[s.category] || s.category}
                </span>
              )) : <p className="empty-text">لم يُحدد تخصصات بعد</p>}
            </div>
          </div>

          {/* ── AREAS ── */}
          <div className="profile-section card">
            <h2>مناطق العمل</h2>
            <div className="areas-list">
              {areas.length > 0 ? areas.map((a, i) => (
                <span key={i} className="area-pill">
                  📍 {a.city}{a.district ? ` — ${a.district}` : ''}
                </span>
              )) : <p className="empty-text">لم تُحدد مناطق بعد</p>}
            </div>
          </div>
        </div>

        {/* ── PORTFOLIO ── */}
        {portfolio.length > 0 && (
          <div className="portfolio-section card">
            <h2>معرض الأعمال السابقة</h2>
            <div className="portfolio-grid">
              {portfolio.map(item => (
                <div key={item.id} className="portfolio-item">
                  <img
                    src={item.image_url}
                    alt={item.title || 'عمل سابق'}
                    loading="lazy"
                    onError={e => { e.target.src = 'https://via.placeholder.com/300x200?text=صورة'; }}
                  />
                  {item.title && <p className="portfolio-title">{item.title}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
