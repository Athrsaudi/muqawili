import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContractorDashboard.css'
const CAT={cladding:'كلادينج',plumbing:'سباكة',electrical:'كهرباء',demolition:'هدم',finishing:'تشطيب',painting:'دهان',flooring:'أرضيات',hvac:'تكييف',general:'عام'}
function ProfileTab({user,profile,onUpdate}){
  const[bio,setBio]=useState(profile?.bio||'')
  const[years,setYears]=useState(profile?.years_experience||0)
  const[avail,setAvail]=useState(profile?.is_available??true)
  const[saving,setSaving]=useState(false)
  const[saved,setSaved]=useState(false)
  async function save(){setSaving(true);await supabase.from('contractor_profiles').update({bio,years_experience:years,is_available:avail}).eq('user_id',user.id);setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2000);onUpdate()}
  return(
    <div className='profile-form'>
      <div className='form-field'><label>الاسم الكامل</label><input value={user?.full_name||''} disabled className='disabled'/></div>
      <div className='form-field'><label>الجوال</label><input value={user?.phone||''} disabled className='disabled'/></div>
      <div className='form-field'><label>المدينة</label><input value={user?.city||''} disabled className='disabled'/></div>
      <div className='form-field'><label>نبذة عنك</label><textarea rows={4} value={bio} onChange={e=>setBio(e.target.value)} placeholder='اكتب نبذة...'/></div>
      <div className='form-field'><label>سنوات الخبرة</label><input type='number' value={years} onChange={e=>setYears(Number(e.target.value))} min={0} max={50}/></div>
      <div className='form-field form-toggle'><label>متاح للعمل</label><button className={'toggle-btn '+(avail?'on':'off')} onClick={()=>setAvail(!avail)}>{avail?'نعم':'لا'}</button></div>
      <button className='save-btn' onClick={save} disabled={saving}>{saving?'جارٍ...':saved?'✅ تم الحفظ':'حفظ التغييرات'}</button>
    </div>
  )
}
function PortfolioTab({contractorId}){
  const[items,setItems]=useState([])
  const[loading,setLoading]=useState(true)
  const[showForm,setShowForm]=useState(false)
  const[title,setTitle]=useState('')
  const[desc,setDesc]=useState('')
  const[url,setUrl]=useState('')
  const[saving,setSaving]=useState(false)
  const[err,setErr]=useState('')
  useEffect(()=>{if(contractorId)load()},[contractorId])
  async function load(){
    const{data}=await supabase.from('contractor_portfolio').select('*').eq('contractor_id',contractorId).order('created_at',{ascending:false})
    setItems(data||[]);setLoading(false)
  }
  async function add(){
    setErr('')
    if(!title.trim()){setErr('أدخل عنوان العمل');return}
    if(!url.trim()){setErr('أدخل رابط الصورة');return}
    setSaving(true)
    const{error}=await supabase.from('contractor_portfolio').insert({contractor_id:contractorId,title:title.trim(),description:desc.trim()||null,image_url:url.trim()})
    setSaving(false)
    if(error){setErr('حدث خطأ أثناء الحفظ');return}
    setTitle('');setDesc('');setUrl('');setShowForm(false);load()
  }
  async function del(id){await supabase.from('contractor_portfolio').delete().eq('id',id);load()}
  if(loading)return <div className='empty-state'>جارٍ التحميل...</div>
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <span style={{color:'#94a3b8',fontSize:14}}>{items.length} عمل مضاف</span>
        <button className='add-portfolio-btn' onClick={()=>setShowForm(!showForm)}>{showForm?'إلغاء':'+ إضافة عمل جديد'}</button>
      </div>
      {showForm&&(
        <div className='portfolio-add-form'>
          <div className='field'><label>عنوان العمل *</label><input type='text' placeholder='مثال: تركيب كلادينج' value={title} onChange={e=>setTitle(e.target.value)}/></div>
          <div className='field'><label>وصف العمل</label><textarea rows={2} value={desc} onChange={e=>setDesc(e.target.value)}/></div>
          <div className='field'><label>رابط صورة العمل *</label><input type='url' placeholder='https://...' value={url} onChange={e=>setUrl(e.target.value)}/></div>
          {err&&<div className='req-error'>⚠️ {err}</div>}
          <button className='save-btn' onClick={add} disabled={saving}>{saving?'جارٍ...':'إضافة العمل'}</button>
        </div>
      )}
      {items.length===0&&!showForm?(
        <div className='empty-state'>لا توجد أعمال. اضغط «+ إضافة عمل جديد»!</div>
      ):(
        <div className='portfolio-grid'>{items.map(i=>(
          <div key={i.id} className='portfolio-card' style={{position:'relative'}}>
            <img src={i.image_url} alt={i.title} className='portfolio-img'/>
            <div className='portfolio-info'><h3>{i.title}</h3>{i.description&&<p>{i.description}</p>}</div>
            <button onClick={()=>del(i.id)} style={{position:'absolute',top:8,left:8,background:'rgba(239,68,68,.8)',border:'none',borderRadius:6,color:'#fff',padding:'4px 8px',fontSize:12,cursor:'pointer'}}>حذف</button>
          </div>
        ))}</div>
      )}
    </div>
  )
}
function QuotesTab({contractorId}){
  const[quotes,setQuotes]=useState([]);const[loading,setLoading]=useState(true)
  useEffect(()=>{if(!contractorId)return;supabase.from('price_quotes').select('*,service_requests(title,city,category)').eq('contractor_id',contractorId).order('created_at',{ascending:false}).then(({data})=>{setQuotes(data||[]);setLoading(false)})},[contractorId])
  const lbl={pending:'معلق',accepted:'مقبول ✅',rejected:'مرفوض ❌'}
  if(loading)return <div className='empty-state'>جارٍ...</div>
  if(!quotes.length)return <div className='empty-state'>لم ترسل أي عروض بعد</div>
  return <div className='quotes-list'>{quotes.map(q=>(
    <div key={q.id} className='quote-card'>
      <div className='quote-header'><h3>{q.service_requests?.title}</h3><span className={'quote-status '+q.status}>{lbl[q.status]}</span></div>
      <p className='quote-price'>💰 {q.price?.toLocaleString()} ريال</p>
      <p className='quote-duration'>⏱ {q.duration_days} يوم</p>
      {q.notes&&<p className='quote-notes'>{q.notes}</p>}
    </div>
  ))}</div>
}
export default function ContractorDashboard(){
  const nav=useNavigate()
  const[user,setUser]=useState(null)
  const[profile,setProfile]=useState(null)
  const[stats,setStats]=useState({requests:0,quotes:0,portfolio:0,rating:0})
  const[requests,setRequests]=useState([])
  const[loading,setLoading]=useState(true)
  const[tab,setTab]=useState('overview')
  useEffect(()=>{load()},[])
  async function load(){
    const{data:{user:u}}=await supabase.auth.getUser()
    if(!u){nav('/login');return}
    const{data:ud}=await supabase.from('users').select('*').eq('id',u.id).single()
    if(!ud||ud.user_type!=='contractor'){nav('/');return}
    setUser(ud)
    const{data:p}=await supabase.from('contractor_profiles').select('*').eq('user_id',u.id).single()
    setProfile(p)
    const{data:qd}=await supabase.from('price_quotes').select('id,status').eq('contractor_id',p?.id)
    const{data:pd}=await supabase.from('contractor_portfolio').select('id').eq('contractor_id',p?.id)
    const{data:rd}=await supabase.from('service_requests').select('*,users!service_requests_client_id_fkey(full_name,city)').eq('status','open').order('created_at',{ascending:false}).limit(10)
    setRequests(rd||[])
    setStats({requests:rd?.length||0,quotes:qd?.length||0,portfolio:pd?.length||0,rating:p?.avg_rating||0})
    setLoading(false)
  }
  async function logout(){await supabase.auth.signOut();nav('/login')}
  if(loading)return <div className='dash-loading'><div className='dash-spinner'/><p>جارٍ التحميل...</p></div>
  return(
    <div className='contractor-dash' dir='rtl'>
      <aside className='dash-sidebar'>
        <div className='dash-brand'>🏗️ مقاولي</div>
        <div className='dash-profile-mini'>
          <div className='dash-avatar'>{user?.full_name?.[0]||'م'}</div>
          <div><div className='dash-name'>{user?.full_name}</div><div className='dash-role'>مقاول</div></div>
        </div>
        <nav className='dash-nav'>
          {[{id:'overview',icon:'📊',label:'نظرة عامة'},{id:'requests',icon:'📋',label:'طلبات الخدمة'},{id:'quotes',icon:'💰',label:'عروضي'},{id:'portfolio',icon:'🖼️',label:'أعمالي'},{id:'profile',icon:'👤',label:'ملفي'}].map(x=>(
            <button key={x.id} className={'dash-nav-item '+(tab===x.id?'active':'')} onClick={()=>setTab(x.id)}><span>{x.icon}</span><span>{x.label}</span></button>
          ))}
        </nav>
        <button className='dash-logout' onClick={logout}>🚪 تسجيل خروج</button>
      </aside>
      <main className='dash-main'>
        {tab==='overview'&&(
          <div className='dash-content'>
            <h1 className='dash-title'>مرحباً، {user?.full_name?.split(' ')[0]} 👋</h1>
            <div className='stats-grid'>
              <div className='stat-card'><div className='stat-icon'>📋</div><div className='stat-value'>{stats.requests}</div><div className='stat-label'>طلبات متاحة</div></div>
              <div className='stat-card'><div className='stat-icon'>💰</div><div className='stat-value'>{stats.quotes}</div><div className='stat-label'>عروضي</div></div>
              <div className='stat-card'><div className='stat-icon'>🖼️</div><div className='stat-value'>{stats.portfolio}</div><div className='stat-label'>أعمال منجزة</div></div>
              <div className='stat-card'><div className='stat-icon'>⭐</div><div className='stat-value'>{stats.rating>0?stats.rating.toFixed(1):'جديد'}</div><div className='stat-label'>التقييم</div></div>
            </div>
            <h2 className='section-title'>آخر طلبات الخدمة</h2>
            <div className='requests-list'>
              {requests.slice(0,5).map(r=>(
                <div key={r.id} className='request-card'>
                  <div className='request-header'><span className='request-category'>{CAT[r.category]||r.category}</span><span className='request-city'>📍 {r.city}</span></div>
                  <h3 className='request-title'>{r.title}</h3>
                  <p className='request-desc'>{r.description?.slice(0,100)}...</p>
                  {r.budget_min&&<p className='request-budget'>💰 {r.budget_min?.toLocaleString()} - {r.budget_max?.toLocaleString()} ريال</p>}
                  <div className='request-footer'>
                    <span className='request-client'>👤 {r.users?.full_name}</span>
                    <button className='btn-quote' onClick={()=>setTab('requests')}>إرسال عرض</button>
                  </div>
                </div>
              ))}
              {requests.length===0&&<p className='empty-state'>لا توجد طلبات حالياً</p>}
            </div>
          </div>
        )}
        {tab==='requests'&&(
          <div className='dash-content'>
            <h1 className='dash-title'>طلبات الخدمة</h1>
            <div className='requests-list'>
              {requests.map(r=>(
                <div key={r.id} className='request-card'>
                  <div className='request-header'><span className='request-category'>{CAT[r.category]||r.category}</span><span className='request-city'>📍 {r.city}</span></div>
                  <h3 className='request-title'>{r.title}</h3>
                  <p className='request-desc'>{r.description}</p>
                  {r.budget_min&&<p className='request-budget'>💰 {r.budget_min?.toLocaleString()} - {r.budget_max?.toLocaleString()} ريال</p>}
                  <div className='request-footer'>
                    <span className='request-client'>👤 {r.users?.full_name} | {r.users?.city}</span>
                    <button className='btn-quote' onClick={()=>nav('/requests/'+r.id)}>إرسال عرض سعر</button>
                  </div>
                </div>
              ))}
              {requests.length===0&&<p className='empty-state'>لا توجد طلبات حالياً</p>}
            </div>
          </div>
        )}
        {tab==='portfolio'&&<div className='dash-content'><h1 className='dash-title'>أعمالي</h1><PortfolioTab contractorId={profile?.id}/></div>}
        {tab==='profile'&&<div className='dash-content'><h1 className='dash-title'>ملفي الشخصي</h1><ProfileTab user={user} profile={profile} onUpdate={load}/></div>}
        {tab==='quotes'&&<div className='dash-content'><h1 className='dash-title'>عروضي</h1><QuotesTab contractorId={profile?.id}/></div>}
      </main>
    </div>
  )
}