import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './MyRequests.css'

const CAT={cladding:'كلادينج',plumbing:'سباكة',electrical:'كهرباء',demolition:'هدم',finishing:'تشطيب',painting:'دهان',flooring:'أرضيات',hvac:'تكييف',general:'عام'}
const STATUS={open:{label:'مفتوح',cls:'open'},in_progress:{label:'جارٍ',cls:'progress'},closed:{label:'مغلق',cls:'closed'},cancelled:{label:'ملغي',cls:'cancelled'}}

export default function MyRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(()=>{ loadRequests() },[])

  async function loadRequests() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data } = await supabase
      .from('service_requests')
      .select('*, price_quotes(id, status)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    setRequests(data||[]); setLoading(false)
  }

  async function cancelRequest(id) {
    if(!confirm('هل تريد إلغاء هذا الطلب؟'))return
    await supabase.from('service_requests').update({status:'cancelled'}).eq('id',id)
    loadRequests()
  }

  const filtered = filter==='all' ? requests : requests.filter(r=>r.status===filter)

  if(loading) return <div className='mreq-loading'>جارٍ التحميل...</div>

  return (
    <div className='mreq-page' dir='rtl'>
      <div className='mreq-container'>
        <div className='mreq-header'>
          <h1 className='mreq-title'>طلباتي</h1>
          <Link to='/requests/new' className='mreq-new-btn'>+ طلب جديد</Link>
        </div>
        <div className='mreq-filters'>
          {[{val:'all',label:'الكل'},{val:'open',label:'مفتوح'},{val:'in_progress',label:'جارٍ'},{val:'closed',label:'مغلق'},{val:'cancelled',label:'ملغي'}].map(f=>(
            <button key={f.val} className={'mreq-filter-btn '+(filter===f.val?'active':'')} onClick={()=>setFilter(f.val)}>
              {f.label}
              <span className='mreq-filter-count'>{f.val==='all'?requests.length:requests.filter(r=>r.status===f.val).length}</span>
            </button>
          ))}
        </div>
        {filtered.length===0?(
          <div className='mreq-empty'>
            <div className='mreq-empty-icon'>📋</div>
            <p>{filter==='all'?'لا توجد طلبات بعد':'لا توجد طلبات بهذه الحالة'}</p>
            {filter==='all'&&<Link to='/requests/new' className='mreq-empty-btn'>أنشئ طلبك الأول</Link>}
          </div>
        ):(
          <div className='mreq-list'>
            {filtered.map(req=>{
              const qCount=req.price_quotes?.length||0
              const accepted=req.price_quotes?.find(q=>q.status==='accepted')
              const st=STATUS[req.status]||{label:req.status,cls:'closed'}
              return(
                <div key={req.id} className='mreq-card'>
                  <div className='mreq-card-header'>
                    <div className='mreq-card-meta'>
                      <span className='mreq-category'>{CAT[req.category]||req.category}</span>
                      <span className={'mreq-status '+st.cls}>{st.label}</span>
                    </div>
                    <span className='mreq-date'>{new Date(req.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <h2 className='mreq-card-title'>{req.title}</h2>
                  <p className='mreq-card-desc'>{req.description?.slice(0,100)}{req.description?.length>100?'...':''}</p>
                  <div className='mreq-card-info'>
                    <span>📍 {req.city}{req.district?' - '+req.district:''}</span>
                    {req.budget_min&&<span>💰 {Number(req.budget_min).toLocaleString('ar')} - {Number(req.budget_max).toLocaleString('ar')} ريال</span>}
                  </div>
                  <div className='mreq-card-footer'>
                    <div>
                      {qCount>0?<span className='mreq-quotes-badge'>{accepted?'✅ تم قبول عرض':'💬 '+qCount+' عرض'}</span>
                        :<span className='mreq-no-quotes'>لا توجد عروض بعد</span>}
                    </div>
                    <div className='mreq-card-actions'>
                      {req.status==='open'&&<button className='mreq-cancel-btn' onClick={()=>cancelRequest(req.id)}>إلغاء</button>}
                      <Link to={'/requests/'+req.id} className='mreq-view-btn'>عرض التفاصيل</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}