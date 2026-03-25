import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Login.css'

const CITIES=['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم','نجران','جازان']
function fmt(raw){const t=raw.replace(/\D/g,'');if(t.startsWith('966'))return'+'+t;if(t.startsWith('0'))return'+966'+t.slice(1);return'+966'+t}
export default function Login(){
  const nav=useNavigate()
  const[tab,setTab]=useState('login')
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState('')
  const[phone,setPhone]=useState('')
  const[nid,setNid]=useState('')
  const[name,setName]=useState('')
  const[email,setEmail]=useState('')
  const[rPhone,setRPhone]=useState('')
  const[rNid,setRNid]=useState('')
  const[utype,setUtype]=useState('client')
  const[city,setCity]=useState('')
  async function doLogin(){
    setError('');setLoading(true)
    if(!phone.trim()||!nid.trim()){setError('أدخل رقم الجوال ورقم الهوية');setLoading(false);return}
    const p=fmt(phone)
    const{data:u}=await supabase.from('users').select('id,user_type,is_active').eq('phone',p).eq('national_id',nid).maybeSingle()
    if(!u){setError('رقم الجوال أو رقم الهوية غير صحيح');setLoading(false);return}
    if(u.is_active===false){setError('تم تعليق هذا الحساب. تواصل مع الدعم.');setLoading(false);return}
    const fe=nid+p.replace('+','')+'@mq.sa'
    const{error:e1}=await supabase.auth.signInWithPassword({email:fe,password:nid})
    if(!e1){u.user_type==='contractor'?nav('/dashboard/contractor'):nav('/');setLoading(false);return}
    const{error:e2}=await supabase.auth.signUp({email:fe,password:nid})
    if(e2){setError('حدث خطأ في تسجيل الدخول');setLoading(false);return}
    await supabase.rpc('confirm_user_email',{user_email:fe})
    const{error:e3}=await supabase.auth.signInWithPassword({email:fe,password:nid})
    if(e3){setError('تم إنشاء الحساب، حاول مرة أخرى');setLoading(false);return}
    u.user_type==='contractor'?nav('/dashboard/contractor'):nav('/');setLoading(false)
  }
  async function doRegister(){
    setError('');setLoading(true)
    if(!name.trim()){setError('أدخل اسمك الكامل');setLoading(false);return}
    const p=fmt(rPhone)
    if(p.length<12){setError('أدخل رقم جوال سعودي صحيح');setLoading(false);return}
    if(!rNid.match(/^[12]\d{9}$/)){setError('رقم الهوية 10 أرقام يبدأ بـ 1 أو 2');setLoading(false);return}
    if(!city){setError('اختر مدينتك');setLoading(false);return}
    const{data:ex}=await supabase.from('users').select('id').or('phone.eq.'+p+',national_id.eq.'+rNid).maybeSingle()
    if(ex){setError('هذا الجوال أو رقم الهوية مسجل مسبقاً');setLoading(false);return}
    const fe=rNid+p.replace('+','')+'@mq.sa'
    const{data:ad,error:e1}=await supabase.auth.signUp({email:fe,password:rNid})
    if(e1||!ad.user){setError(e1?.message?.includes('already registered')?'هذا الجوال أو رقم الهوية مسجل مسبقاً':'حدث خطأ: '+(e1?.message||''));setLoading(false);return}
    await supabase.rpc('confirm_user_email',{user_email:fe})
    const{error:e2}=await supabase.from('users').insert({id:ad.user.id,phone:p,email:email.trim()||null,full_name:name.trim(),national_id:rNid,user_type:utype,city,is_verified:true})
    if(e2){setError(e2.code==='23505'?'هذه البيانات مسجلة مسبقاً':'حدث خطأ، حاول مرة أخرى');setLoading(false);return}
    if(utype==='contractor'){await supabase.from('contractor_profiles').insert({user_id:ad.user.id,years_experience:0});nav('/dashboard/contractor')}else nav('/')
    setLoading(false)
  }
  return(
    <div className='auth-page' dir='rtl'>
      <div className='auth-bg'/>
      <div className='auth-wrap'>
        <div className='auth-logo'><div className='auth-logo-icon'>🏗️</div><h1>مقاولي</h1><p>سوق المقاولات السعودي</p></div>
        <div className='auth-card'>
          <div className='auth-tabs'>
            <button className={'auth-tab '+(tab==='login'?'active':'')} onClick={()=>{setTab('login');setError('')}}>تسجيل الدخول</button>
            <button className={'auth-tab '+(tab==='register'?'active':'')} onClick={()=>{setTab('register');setError('')}}>حساب جديد</button>
          </div>
          {tab==='login'&&<div className='auth-form'>
            <div className='field'><label>رقم الجوال</label><input type='tel' placeholder='05xxxxxxxx' value={phone} onChange={e=>setPhone(e.target.value)}/></div>
            <div className='field'><label>رقم الهوية الوطنية</label><input type='text' placeholder='1xxxxxxxxx' value={nid} onChange={e=>setNid(e.target.value)} maxLength={10}/></div>
            {error&&<div className='auth-error'>⚠️ {error}</div>}
            <button className='auth-btn' onClick={doLogin} disabled={loading}>{loading?<span className='spinner'/>:'دخول'}</button>
          </div>}
          {tab==='register'&&<div className='auth-form'>
            <div className='field'><label>الاسم الكامل</label><input type='text' value={name} onChange={e=>setName(e.target.value)}/></div>
            <div className='field'><label>البريد الإلكتروني (اختياري)</label><input type='email' value={email} onChange={e=>setEmail(e.target.value)}/></div>
            <div className='field'><label>رقم الجوال</label><input type='tel' placeholder='05xxxxxxxx' value={rPhone} onChange={e=>setRPhone(e.target.value)}/></div>
            <div className='field'><label>رقم الهوية الوطنية</label><input type='text' placeholder='1xxxxxxxxx' value={rNid} onChange={e=>setRNid(e.target.value)} maxLength={10}/></div>
            <div className='field'><label>المدينة</label><select value={city} onChange={e=>setCity(e.target.value)}><option value=''>اختر مدينتك</option>{CITIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div className='field'><label>نوع الحساب</label><div className='type-group'><button type='button' className={'type-btn '+(utype==='client'?'active':'')} onClick={()=>setUtype('client')}>🏠 صاحب عمل</button><button type='button' className={'type-btn '+(utype==='contractor'?'active':'')} onClick={()=>setUtype('contractor')}>🔧 مقاول</button></div></div>
            {error&&<div className='auth-error'>⚠️ {error}</div>}
            <button className='auth-btn' onClick={doRegister} disabled={loading}>{loading?<span className='spinner'/>:'إنشاء الحساب'}</button>
          </div>}
        </div>
        <p className='auth-footer'>بالدخول أنت توافق على شروط الاستخدام</p>
      </div>
    </div>
  )
}