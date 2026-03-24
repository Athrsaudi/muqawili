import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Search.css'

const CATEGORIES = [
  { key: '',           label: 'الكل' },
  { key: 'cladding',   label: 'كلادينج',      icon: '🏗️' },
  { key: 'plumbing',   label: 'سباكة',        icon: '🔧' },
  { key: 'electrical', label: 'كهرباء',       icon: '⚡' },
  { key: 'demolition', label: 'هدم وبناء',    icon: '🪚' },
  { key: 'finishing',  label: 'تشطيب',        icon: '🏠' },
  { key: 'painting',   label: 'دهانات',       icon: '🎨' },
  { key: 'flooring',   label: 'أرضيات',       icon: '🪵' },
  { key: 'hvac',       label: 'تكييف',        icon: '❄️' },
  { key: 'general',    label: 'عام',          icon: '🏢' },
]

const CITIES = ['','جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم']
const BADGES = [{ key: '', label: 'الكل' },{ key: 'verified', label: 'معتمد' },{ key: 'trusted', label: 'موثوق' }]

const BADGE_LABELS = { verified: 'معتمد رسمياً', trusted: 'موثوق', none: 'جديد' }
const BADGE_CLASS  = { verified: 'badge-verified', trusted: 'badge-trusted', none: 'badge-none' }

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)

  const city     = params.get('city')     || ''
  const category = params.get('category') || ''
  const badge    = params.get('badge')    || ''

  useEffect(() => { fetchContractors() }, [city, category, badge])

  async function fetchContractors() {
    setLoading(true)
    let query = supabase
      .from('contractor_profiles')
      .select(`
        id, bio, years_experience, badge_type, avg_rating, total_reviews, is_available,
        users!inner(full_name, city),
        contractor_specializations(category),
        contractor_areas(city, district)
      `)
      .eq('is_available', true)
      .order('avg_rating', { ascending: false })

    if (badge) query = query.eq('badge_type', badge)

    const { data, error } = await query
    if (error) { setLoading(false); return }

    let filtered = data || []

    if (city) {
      filtered = filtered.filter(c =>
        c.contractor_areas?.some(a => a.city === city)
      )
    }
    if (category) {
      filtered = filtered.filter(c =>
        c.contractor_specializations?.some(s => s.category === category)
      )
    }

    setContractors(filtered)
    setLoading(false)
  }

  function updateParam(key, val) {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val); else next.delete(key)
    setParams(next)
  }

  const catLabel = CATEGORIES.find(c => c.key === category)?.label || 'الكل'

  return (
    <div className="search-page">
      <div className="container">

        {/* ── FILTERS ── */}
        <div className="filters-bar card">
          <div className="filter-group">
            <label>المدينة</label>
            <select className="input" value={city} onChange={e => updateParam('city', e.target.value)}>
              <option value="">كل المدن</option>
              {CITIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>التخصص</label>
            <select className="input" value={category} onChange={e => updateParam('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon || ''} {c.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>الشارة</label>
            <select className="input" value={badge} onChange={e => updateParam('badge', e.target.value)}>
              {BADGES.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── RESULTS HEADER ── */}
        <div className="results-header">
          <h2>
            {loading ? 'جارٍ البحث...' : `${contractors.length} مقاول`}
            {city && <span className="filter-tag"> في {city}</span>}
            {category && <span className="filter-tag"> · {catLabel}</span>}
          </h2>
        </div>

        {/* ── RESULTS ── */}
        {loading ? (
          <div className="loading-grid">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-card"/>)}
          </div>
        ) : contractors.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>لا يوجد مقاولون في هذا البحث</h3>
            <p>جرب تغيير المدينة أو التخصص</p>
          </div>
        ) : (
          <div className="contractors-grid">
            {contractors.map(c => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContractorCard({ contractor: c }) {
  const name  = c.users?.full_name || 'مقاول'
  const city  = c.users?.city || ''
  const specs = c.contractor_specializations?.map(s =>
    CATEGORIES.find(cat => cat.key === s.category)?.label || s.category
  ).slice(0, 3) || []

  return (
    <Link to={`/contractor/${c.id}`} className="contractor-card card">
      <div className="cc-header">
        <div className="cc-avatar">
          {name.charAt(0)}
        </div>
        <div className="cc-info">
          <h3>{name}</h3>
          <span className="cc-city">📍 {city}</span>
        </div>
        <span className={`badge ${BADGE_CLASS[c.badge_type] || 'badge-none'}`}>
          {c.badge_type === 'verified' ? '✓ ' : ''}{BADGE_LABELS[c.badge_type] || 'جديد'}
        </span>
      </div>

      {c.bio && <p className="cc-bio">{c.bio.slice(0, 90)}{c.bio.length > 90 ? '...' : ''}</p>}

      <div className="cc-specs">
        {specs.map((s, i) => <span key={i} className="spec-tag">{s}</span>)}
      </div>

      <div className="cc-footer">
        <div className="cc-rating">
          <span className="stars">{'★'.repeat(Math.round(c.avg_rating || 0))}{'☆'.repeat(5 - Math.round(c.avg_rating || 0))}</span>
          <span className="rating-num">{c.avg_rating > 0 ? c.avg_rating.toFixed(1) : 'جديد'}</span>
          {c.total_reviews > 0 && <span className="review-count">({c.total_reviews})</span>}
        </div>
        <span className="cc-exp">{c.years_experience} سنة خبرة</span>
      </div>
    </Link>
  )
}
