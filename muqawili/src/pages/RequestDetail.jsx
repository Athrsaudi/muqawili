import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './RequestDetail.css'

const CAT_LABELS = { cladding:'كلادينج', plumbing:'سباكة', electrical:'كهرباء', demolition:'هدم وبناء', finishing:'تشطيب', painting:'دهانات', flooring:'أرضيات', hvac:'تكييف', general:'عام' }
const STATUS_MAP  = { open:'مفتوح', in_progress:'قيد التنفيذ', closed:'مغلق', cancelled:'ملغي' }

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [request, setRequest]   = useState(null)
  const [quotes, setQuotes]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [myQuote, setMyQuote]   = useState({ price:'', duration_days:'', notes:'' })
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const { data: req } = await supabase
      .from('service_requests')
      .select('*, users(full_name, city)')
      .eq('id', id).single()
    setRequest(req)

    if (req) {
      const { data: q } = await supabase
        .from('price_quotes')
        .select('*, contractor_profiles(id, badge_type, avg_rating, users(full_name))')
        .eq('request_id', id)
        .order('created_at', { ascending: true })
      setQuotes(q || [])
    }
    setLoading(false)
  }

  async function submitQuote() {
    setError(''); setSuccess('')
    if (!myQuote.price || !myQuote.duration_days) { setError('أدخل السعر والمدة'); return }

    const { data: cp } = await supabase
      .from('contractor_profiles')
      .select('id').eq('user_id', user.id).single()
    if (!cp) { setError('أكمل ملف المقاول أولاً'); return }

    setSubmit(true)
    const { error: err } = await supabase.from('price_quotes').insert({
      request_id: id, contractor_id: cp.id,
      price: parseFloat(myQuote.price),
      duration_days: parseInt(myQuote.duration_days),
      notes: myQuote.notes || null,
    })
    if (err) { setError(err.code === '23505' ? 'قدمت عرضاً على هذا الطلب مسبقاً' : 'حدث خطأ، حاول مجدداً') }
    else { setSuccess('تم تقديم عرضك بنجاح!'); fetchData() }
    setSubmit(false)
  }

  async function acceptQuote(quoteId, contractorId) {
    await supabase.from('price_quotes').update({ status: 'accepted' }).eq('id', quoteId)
    await supabase.from('price_quotes').update({ status: 'rejected' }).eq('request_id', id).neq('id', quoteId)
    await supabase.from('service_requests').update({ status: 'in_progress' }).eq('id', id)
    fetchData()
  }

  if (loading) return <div className="page-loading"><div className="spinner"/></div>
  if (!request) return <div className="page-loading"><p>الطلب غير موجود</p><Link to="/" className="btn btn-primary">الرئيسية</Link></div>

  const isOwner      = user && request.client_id === user.id
  const isContractor = profile?.user_type === 'contractor'
  const canQuote     = isContractor && !isOwner && request.status === 'open'

  return (
    <div className="request-page">
      <div className="container">

        <div className="request-grid">
          {/* ── REQUEST DETAILS ── */}
          <div className="request-main">
            <div className="request-card card">
              <div className="req-header">
                <div>
                  <span className={`status-badge status-${request.status}`}>{STATUS_MAP[request.status]}</span>
                  <span className="cat-label">{CAT_LABELS[request.category]}</span>
                </div>
                <h1>{request.title}</h1>
                <div className="req-meta">
                  <span>📍 {request.city}{request.district ? ` — ${request.district}` : ''}</span>
                  <span>👤 {request.users?.full_name}</span>
                  <span>🕐 {new Date(request.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>

              <div className="req-desc">
                <h3>تفاصيل الطلب</h3>
                <p>{request.description}</p>
              </div>

              {(request.budget_min || request.budget_max) && (
                <div className="req-budget">
                  <span>💰 الميزانية:</span>
                  <strong>
                    {request.budget_min && `${request.budget_min.toLocaleString()} ريال`}
                    {request.budget_min && request.budget_max && ' — '}
                    {request.budget_max && `${request.budget_max.toLocaleString()} ريال`}
                  </strong>
                </div>
              )}
            </div>

            {/* ── SUBMIT QUOTE ── */}
            {canQuote && (
              <div className="quote-form card">
                <h2>تقديم عرض سعر</h2>
                <div className="qf-row">
                  <div className="input-group">
                    <label>السعر (ريال) *</label>
                    <input className="input" type="number" placeholder="15000"
                      value={myQuote.price} onChange={e => setMyQuote(q => ({...q, price: e.target.value}))} />
                  </div>
                  <div className="input-group">
                    <label>مدة التنفيذ (أيام) *</label>
                    <input className="input" type="number" placeholder="14"
                      value={myQuote.duration_days} onChange={e => setMyQuote(q => ({...q, duration_days: e.target.value}))} />
                  </div>
                </div>
                <div className="input-group">
                  <label>ملاحظات إضافية</label>
                  <textarea className="input" rows={3} placeholder="أي شروط أو ملاحظات خاصة بعرضك..."
                    value={myQuote.notes} onChange={e => setMyQuote(q => ({...q, notes: e.target.value}))} />
                </div>
                {error   && <p className="error-msg">{error}</p>}
                {success && <p className="success-msg">{success}</p>}
                <button className="btn btn-primary" onClick={submitQuote} disabled={submitting}>
                  {submitting ? <span className="spinner-sm"/> : 'إرسال العرض'}
                </button>
              </div>
            )}

            {!user && (
              <div className="login-prompt card">
                <p>سجّل دخول كمقاول لتقديم عرض سعر</p>
                <Link to="/login" className="btn btn-primary">تسجيل الدخول</Link>
              </div>
            )}
          </div>

          {/* ── QUOTES LIST ── */}
          {(isOwner || quotes.length > 0) && (
            <div className="quotes-panel">
              <h2 className="quotes-title">عروض الأسعار ({quotes.length})</h2>
              {quotes.length === 0 ? (
                <div className="card empty-quotes">
                  <p>لا توجد عروض بعد</p>
                </div>
              ) : quotes.map(q => (
                <div key={q.id} className={`quote-card card ${q.status === 'accepted' ? 'accepted' : q.status === 'rejected' ? 'rejected' : ''}`}>
                  <div className="qc-header">
                    <div className="qc-contractor">
                      <div className="qc-avatar">{q.contractor_profiles?.users?.full_name?.charAt(0) || 'م'}</div>
                      <div>
                        <strong>{q.contractor_profiles?.users?.full_name}</strong>
                        {q.contractor_profiles?.avg_rating > 0 && (
                          <span className="qc-rating">⭐ {q.contractor_profiles.avg_rating.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                    {q.status === 'accepted' && <span className="accepted-badge">✓ مقبول</span>}
                  </div>
                  <div className="qc-details">
                    <span className="qc-price">{q.price?.toLocaleString()} ريال</span>
                    <span className="qc-duration">⏱ {q.duration_days} يوم</span>
                  </div>
                  {q.notes && <p className="qc-notes">{q.notes}</p>}
                  {isOwner && q.status === 'pending' && request.status === 'open' && (
                    <button className="btn btn-accent btn-sm" onClick={() => acceptQuote(q.id, q.contractor_id)}>
                      قبول هذا العرض
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
