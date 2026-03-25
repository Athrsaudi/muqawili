import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Navbar.css'
export default function Navbar(){
  const loc=useLocation(),nav=useNavigate()
  const[user,setUser]=useState(null)
  const[profile,setProfile]=useState(null)
  const[unread,setUnread]=useState(0)
  const[open,setOpen]=useState(false)
  const[notifs,setNotifs]=useState([])
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{if(s?.user)load(s.user)})
    const{data:{subscription:sub}}=supabase.auth.onAuthStateChange((_,s)=>{
      if(s?.user)load(s.user);else{setUser(null);setProfile(null);setUnread(0)}
    })
    return()=>sub.unsubscribe()
  },[])
  async function load(u){
    setUser(u)
    const{data:p}=await supabase.from('users').select('*').eq('id',u.id).single()
    setProfile(p);loadNotifs(u.id)
  }
  async function loadNotifs(uid){
    const{data}=await supabase.from('notifications').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(20)
    setNotifs(data||[]);setUnread((data||[]).filter(n=>!n.is_read).length)
  }
  async function markAll(){
    if(!user)return
    await supabase.from('notifications').update({is_read:true}).eq('user_id',user.id).eq('is_read',false)
    setNotifs(p=>p.map(n=>({...n,is_read:true})));setUnread(0)
  }
  async function onNotif(n){
    await supabase.from('notifications').update({is_read:true}).eq('id',n.id)
    setOpen(false)
    if(n.data?.request_id)nav('/requests/'+n.data.request_id)
    else if(n.data?.contractor_id)nav('/contractors/'+n.data.contractor_id)
  }
  async function logout(){await supabase.auth.signOut();nav('/')}
  const icons={new_quote:'💰',quote_accepted:'✅',new_review:'⭐'}
  return(
    <nav className='navbar' dir='rtl'>
      <Link to='/' className='nav-logo'>🏗️ مقاولي</Link>
      <div className='nav-links'>
        <Link to='/search' className={'nav-link '+(loc.pathname==='/search'?'active':'')}>طلبات</Link>
        {profile?.user_type==='client'&&<Link to='/requests/new' className={'nav-link '+(loc.pathname==='/requests/new'?'active':'')}>+ طلب جديد</Link>}
        {profile?.user_type==='contractor'&&<Link to='/dashboard/contractor' className={'nav-link '+(loc.pathname.includes('/dashboard')?'active':'')}>لوحة التحكم</Link>}
        {profile?.user_type==='admin'&&<Link to='/admin' className={'nav-link '+(loc.pathname==='/admin'?'active':'')}>⚙️ الإدارة</Link>}
      </div>
      <div className='nav-actions'>
        {user?(
          <>
            <div className='notif-wrapper'>
              <button className='notif-btn' onClick={()=>{setOpen(!open);if(!open)markAll()}}>
                🔔{unread>0&&<span className='notif-badge'>{unread>9?'9+':unread}</span>}
              </button>
              {open&&(
                <div className='notif-dropdown'>
                  <div className='notif-header'><span>الإشعارات</span>{unread>0&&<button onClick={markAll} className='mark-read-btn'>قراءة الكل</button>}</div>
                  {notifs.length===0?<div className='no-notifs'>لا توجد إشعارات</div>:notifs.map(n=>(
                    <div key={n.id} className={'notif-item '+(n.is_read?'read':'unread')} onClick={()=>onNotif(n)}>
                      <span className='notif-icon'>{icons[n.type]||'🔔'}</span>
                      <div className='notif-content'><div className='notif-title'>{n.title}</div><div className='notif-body'>{n.body}</div><div className='notif-time'>{new Date(n.created_at).toLocaleDateString('ar-SA')}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {profile?.user_type==='contractor'?(
              <Link to='/dashboard/contractor' className='nav-user'><div className='nav-avatar'>{profile?.full_name?.[0]||'م'}</div></Link>
            ):(
              <button className='nav-logout-btn' onClick={logout}>خروج</button>
            )}
          </>
        ):(
          <Link to='/login' className='nav-login-btn'>دخول</Link>
        )}
      </div>
    </nav>
  )
}