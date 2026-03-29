import FileViewer from '../components/FileViewer'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './RequestDetail.css'

const CATEGORY_MAP = { cladding: 'كلادينج', plumbing: 'سباكة', electrical: 'كهرباء', demolition: 'هدم', finishing: 'تشطيب', painting: 'دهان', flooring: 'أرضيات', hvac: 'تكييف', general: 'عام' }

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quoteForm, setQuoteForm] = useState({ price: '', duration_days: '', notes: '' })
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [quoteSent, setQuoteSent] = useState(false)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
    if (user) {
      const { data: userData } = await supabase.from('users').select('user_type').eq('id', user.id).single()
      if (userData?.user_type === 'contractor') {
        const { data: p } = await supabase.from('contractor_profiles').select('id').eq('user_id', user.id).single()
        setProfile(p)
      }
    }
    const { data: req } = await supabase.from('service_requests')
      .select('*, users!service_requests_client_id_fkey(full_name, city)')
      .eq('id', id).single()
    setRequest(req)
    const { data: q } = await supabase.from('price_quotes')
      .select('*, contractor_profiles(user_id, users(full_name, city, avg_rating))')
      .eq('request_id', id).order('price', { ascending: true })
    setQuotes(q || [])
    setLoading(false)
  }

  async function sendQuote() {
    setQuoteError(''); setQuoteLoading(true)
    if (!quoteForm.price) { setQuoteError('أدخل السعر'); setQuoteLoading(false); return }
    if (!quoteForm.duration_days) { setQuoteError('أدخل مدة التنفيذ'); setQuoteLoading(false); return }
    const { error } = await supabase.from('price_quotes').insert({
      request_id: id, contractor_id: profile.id,
      price: Number(quoteForm.price), duration_days: Number(quoteForm.duration_days),
      notes: quoteForm.notes || null, status: 'pending'
    })
    setQuoteLoading(false)
    if (error) { setQuoteError(error.code === '23505' ? 'لقد أرسلت عرضاً على هذا الطلب مسبقاً' : 'حدث خطأ، حاول مرة أخرى'); return }
    setQuoteSent(true); loadData()
  }

  async function acceptQuote(quoteId) {
    setAccepting(true)
    const { error: e1 } = await supabase.from('price_quotes').update({ status: 'accepted' }).eq('id', quoteId)
    if (e1) { alert('حدث خطأ: ' + e1.message); setAccepting(false); return }
    await supabase.from('price_quotes').update({ status: 'rejected' }).eq('request_id', id).neq('id', quoteId).eq('status', 'pending')
    await supabase.from('service_requests').update({ status: 'in_progress' }).eq('id', id)
    setAccepting(false); loadData()
  }

  if (loading) return <div className="detail-loading">جارٍ...</div>
  if (!request) return <div className="detail-loading">لم يتم العثور على الطلب</div>

  const isClient = currentUser?.id === request.client_id
  const alreadySent = quotes.some(q => q.contractor_id === profile?.id)
  const STATUS_LABEL = { open: 'مفتوح', in_progress: 'جارٍ', closed: 'مغلق', cancelled: 'ملغي' }
  const allFiles = [...(request.images || []), ...(request.files || [])].filter(Boolean)

  return (
    <div className="detail-page" dir="rtl">
      <div className="detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>← رجوع</button>
        <div className="detail-card">
          <div className="detail-header">
            <span className="detail-cat">{CATEGORY_MAP[request.category] || request.category}</span>
            <span className={'detail-status ' + request.status}>{STATUS_LABEL[request.status]}</span>
          </div>
          <h1 className="detail-title">{request.title}</h1>
          <p className="detail-desc">{request.description}</p>
          <FileViewer files={allFiles} title="الصور والملفات المرفقة" />
          <div className="detail-meta">
            <span>📍 {request.city}{request.district ? ' - ' + request.district : ''}</span>
            <span>👤 {request.users?.full_name}</span>
            {request.budget_min && <span>💰 {Number(request.budget_min).toLocaleString('ar')} - {Number(request.budget_max).toLocaleString('ar')} ريال</span>}
          </div>
        </div>

        {profile && request.status === 'open' && !alreadySent && !quoteSent && (
          <div className="quote-form-card">
            <h2>إرسال عرض سعر</h2>
            <div className="quote-fields">
              <div className="field"><label>السعر (ريال) *</label><input type="number" placeholder="15000" value={quoteForm.price} onChange={e => setQuoteForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div className="field"><label>مدة التنفيذ (يوم) *</label><input type="number" placeholder="30" value={quoteForm.duration_days} onChange={e => setQuoteForm(p => ({ ...p, duration_days: e.target.value }))} /></div>
            </div>
            <div className="field"><label>ملاحظات</label><textarea rows={3} placeholder="تفاصيل إضافية..." value={quoteForm.notes} onChange={e => setQuoteForm(p => ({ ...p, notes: e.target.value }))} /></div>
            {quoteError && <div className="req-error">⚠️ {quoteError}</div>}
            <button className="submit-quote-btn" onClick={sendQuote} disabled={quoteLoading}>{quoteLoading ? 'جارٍ...' : 'إرسال العرض'}</button>
          </div>
        )}
        {(alreadySent || quoteSent) && profile && <div className="quote-sent">✅ تم إرسال عرضك بنجاح</div>}

        <div className="quotes-section">
          <h2>العروض ({quotes.length})</h2>
          {quotes.length === 0 ? <p className="no-quotes">لم يصل أي عرض بعد</p> : quotes.map(q => (
            <div key={q.id} className={'quote-item ' + q.status}>
              <div className="quote-top">
                <div>
                  <div className="quote-contractor">{q.contractor_profiles?.users?.full_name}</div>
                  <div className="quote-location">📍 {q.contractor_profiles?.users?.city}</div>
                </div>
                <div className="quote-price-badge">💰 {Number(q.price).toLocaleString('ar')} ريال</div>
              </div>
              <div className="quote-days">⏱ {q.duration_days} يوم</div>
              {q.notes && <div className="quote-note">{q.notes}</div>}
              {isClient && request.status === 'open' && q.status === 'pending' && (
                <button className="accept-btn" onClick={() => acceptQuote(q.id)} disabled={accepting}>{accepting ? 'جارٍ...' : '✔ قبول هذا العرض'}</button>
              )}
              {q.status === 'accepted' && <div className="accepted-badge">✅ تم قبول هذا العرض</div>}
              {q.status === 'rejected' && <div className="rejected-badge">❌ مرفوض</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
