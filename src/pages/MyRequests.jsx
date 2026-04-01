import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATEGORY_MAP, STATUS_LABELS } from '../lib/constants'
import { SkeletonGrid } from '../components/Skeleton'
import './MyRequests.css'

const PAGE_SIZE = 8

const STATUS_CLS = {
  open: 'open', in_progress: 'progress', closed: 'closed', cancelled: 'cancelled'
}

export default function MyRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { if (user) loadRequests() }, [user, filter, page])

  async function loadRequests() {
    setLoading(true)
    let q = supabase
      .from('service_requests')
      .select('id, title, description, category, city, district, budget_min, budget_max, status, created_at, price_quotes(id, status)', { count: 'exact' })
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (filter !== 'all') q = q.eq('status', filter)
    q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    const { data, count } = await q
    setRequests(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  async function cancelRequest(id) {
    if (!confirm('هل تريد إلغاء هذا الطلب؟')) return
    await supabase.from('service_requests').update({ status: 'cancelled' }).eq('id', id)
    loadRequests()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const filters = [
    { val: 'all', label: 'الكل' },
    { val: 'open', label: 'مفتوح' },
    { val: 'in_progress', label: 'جارٍ' },
    { val: 'closed', label: 'مغلق' },
    { val: 'cancelled', label: 'ملغي' },
  ]

  return (
    <div className='mreq-page' dir='rtl'>
      <div className='mreq-container'>
        <div className='mreq-header'>
          <h1 className='mreq-title'>طلباتي</h1>
          <Link to='/requests/new' className='mreq-new-btn'>+ طلب جديد</Link>
        </div>

        {/* فلاتر */}
        <div className='mreq-filters'>
          {filters.map(f => (
            <button key={f.val}
              className={'mreq-filter-btn ' + (filter === f.val ? 'active' : '')}
              onClick={() => { setFilter(f.val); setPage(1) }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* محتوى */}
        {loading ? (
          <div style={{ padding: '24px 0' }}><SkeletonGrid count={4} /></div>
        ) : requests.length === 0 ? (
          <div className='mreq-empty'>
            <span className='mreq-empty-icon'>📋</span>
            <p>{filter === 'all' ? 'لا توجد طلبات بعد' : 'لا توجد طلبات بهذه الحالة'}</p>
            {filter === 'all' && <Link to='/requests/new' className='mreq-new-btn'>أنشئ طلبك الأول</Link>}
          </div>
        ) : (
          <>
            <div className='mreq-list'>
              {requests.map(req => {
                const qCount = req.price_quotes?.length || 0
                const accepted = req.price_quotes?.find(q => q.status === 'accepted')
                return (
                  <div key={req.id} className='mreq-card'>
                    <div className='mreq-card-header'>
                      <div className='mreq-card-meta'>
                        <span className='mreq-category'>{CATEGORY_MAP[req.category] || req.category}</span>
                        <span className={'mreq-status ' + (STATUS_CLS[req.status] || 'closed')}>
                          {STATUS_LABELS[req.status] || req.status}
                        </span>
                      </div>
                      <span className='mreq-date'>{new Date(req.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <h2 className='mreq-card-title'>{req.title}</h2>
                    <p className='mreq-card-desc'>{req.description?.slice(0, 100)}{req.description?.length > 100 ? '...' : ''}</p>
                    <div className='mreq-card-info'>
                      <span>📍 {req.city}{req.district ? ' - ' + req.district : ''}</span>
                      {req.budget_min && (
                        <span>💰 {Number(req.budget_min).toLocaleString('ar')} - {Number(req.budget_max).toLocaleString('ar')} ريال</span>
                      )}
                    </div>
                    <div className='mreq-card-footer'>
                      <div>
                        {qCount > 0
                          ? <span className='mreq-quotes-badge'>{accepted ? '✅ تم قبول عرض' : '💬 ' + qCount + ' عرض'}</span>
                          : <span className='mreq-no-quotes'>لا توجد عروض بعد</span>}
                      </div>
                      <div className='mreq-card-actions'>
                        {req.status === 'open' && (
                          <button className='mreq-cancel-btn' onClick={() => cancelRequest(req.id)}>إلغاء</button>
                        )}
                        <Link to={'/requests/' + req.id} className='mreq-view-btn'>عرض التفاصيل</Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mreq-pagination'>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className='mreq-page-btn'>السابق</button>
                <span className='mreq-page-info'>{page} / {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className='mreq-page-btn'>التالي</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
