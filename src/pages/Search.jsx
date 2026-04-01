import Icon from '../components/Icons'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Search.css'

const CATEGORIES = [
  { value: '', label: 'كل التصنيفات' },
  { value: 'cladding', label: 'كلادينج' },
  { value: 'plumbing', label: 'سباكة' },
  { value: 'electrical', label: 'كهرباء' },
  { value: 'demolition', label: 'هدم' },
  { value: 'finishing', label: 'تشطيب' },
  { value: 'painting', label: 'دهان' },
  { value: 'flooring', label: 'أرضيات' },
  { value: 'hvac', label: 'تكييف' },
  { value: 'general', label: 'عام' },
]

const CITIES = ['', 'جدة', 'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'حائل', 'القصيم', 'نجران', 'جازان']

const CATEGORY_LABEL = { cladding:'كلادينج', plumbing:'سباكة', electrical:'كهرباء', demolition:'هدم', finishing:'تشطيب', painting:'دهان', flooring:'أرضيات', hvac:'تكييف', general:'عام' }

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const city = searchParams.get('city') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = Number(searchParams.get('page') || 1)
  const PAGE_SIZE = 10

  useEffect(() => { loadRequests() }, [q, category, city, sort, page])

  async function loadRequests() {
    setLoading(true)
    let query = supabase.from('service_requests')
      .select('*, users!service_requests_client_id_fkey(full_name, city)', { count: 'exact' })
      .eq('status', 'open')

    if (q) query = query.or('title.ilike.%' + q + '%,description.ilike.%' + q + '%')
    if (category) query = query.eq('category', category)
    if (city) query = query.eq('city', city)

    if (sort === 'newest') query = query.order('created_at', { ascending: false })
    else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
    else if (sort === 'budget_high') query = query.order('budget_max', { ascending: false })
    else if (sort === 'budget_low') query = query.order('budget_min', { ascending: true })

    query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    const { data, count } = await query
    setRequests(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page')
    setSearchParams(params)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="search-page" dir="rtl">
      <div className="search-container">
        <h1 className="search-title">طلبات الخدمة</h1>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="ابحث عن طلب..."
            value={q}
            onChange={e => updateParam('q', e.target.value)}
            className="search-input"
          />
          <Link to="/requests/new" className="new-req-btn">+ طلب جديد</Link>
        </div>

        {/* Filters */}
        <div className="filters-row">
          <select value={category} onChange={e => updateParam('category', e.target.value)} className="filter-select">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={city} onChange={e => updateParam('city', e.target.value)} className="filter-select">
            <option value="">كل المدن</option>
            {CITIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => updateParam('sort', e.target.value)} className="filter-select">
            <option value="newest">الأحدث</option>
            <option value="oldest">الأقدم</option>
            <option value="budget_high">أعلى ميزانية</option>
            <option value="budget_low">أدنى ميزانية</option>
          </select>
        </div>

        {/* Results count */}
        <div className="results-count">
          {loading ? 'جاريي البحث...' : total + ' طلب'}
        </div>

        {/* Results */}
        {loading ? (
          <div className="search-loading">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon"><Icon name="search" size={48} color="var(--text-muted)" /></div>
            <p>لا توجد طلبات تطابق البحث</p>
          </div>
        ) : (
          <div className="results-list">
            {requests.map(req => (
              <Link key={req.id} to={'/requests/' + req.id} className="result-card">
                <div className="result-header">
                  <span className="result-cat">{CATEGORY_LABEL[req.category] || req.category}</span>
                  <span className="result-city"><Icon name="location" size={13} /> {req.city}</span>
                </div>
                <h2 className="result-title">{req.title}</h2>
                <p className="result-desc">{req.description?.slice(0, 120)}...</p>
                <div className="result-footer">
                  <span className="result-client"><Icon name="user" size={13} /> {req.users?.full_name}</span>
                  {req.budget_min && <span className="result-budget"><Icon name="money" size={13} /> {req.budget_min?.toLocaleString()} - {req.budget_max?.toLocaleString()} ريال</span>}
                  <span className="result-date">{new Date(req.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => updateParam('page', page - 1)} className="page-btn">←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={'page-btn ' + (p === page ? 'active' : '')} onClick={() => updateParam('page', p)}>{p}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => updateParam('page', page + 1)} className="page-btn">→</button>
          </div>
        )}
      </div>
    </div>
  )
}
