import { useEffect, useState, useRef} from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) loadUser(session.user)
      else { setUser(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); setUserData(null); setUnread(0) }
    })
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

    return () => document.removeEventListener('mousedown', h);
  }, []);

    return () => subscription.unsubscribe()
  }, [])

  async function loadUser(u) {
    setUser(u)
    const { data } = await supabase.from('users').select('*').eq('id', u.id).single()
    setUserData(data)
    loadNotifications(u.id)
  }

  async function loadNotifications(userId) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data || [])
    setUnread((data || []).filter(n => !n.is_read).length)
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnread(0)
  }

  async function handleNotifClick(notif) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
    setShowNotifs(false)
    if (notif.data?.request_id) navigate('/requests/' + notif.data.request_id)
    else if (notif.data?.contractor_id) navigate('/contractors/' + notif.data.contractor_id)
  }

  const NOTIF_ICONS = { new_quote: '💰', quote_accepted: '✅', new_review: '⭐' }

  return (
    <nav className="navbar" dir="rtl">
      <Link to="/" className="nav-logo">🏗️ مقاولي</Link>

      <div className="nav-links">
        <Link to="/search" className={'nav-link ' + (location.pathname==='/search'?'active':'')}>طلبات</Link>
        {userData?.user_type === 'client' && (
          <Link to="/requests/new" className={'nav-link ' + (location.pathname==='/requests/new'?'active':'')}>+ طلب جديد</Link>
        )}
        {userData?.user_type === 'contractor' && (
          <Link to="/dashboard/contractor" className={'nav-link ' + (location.pathname.includes('/dashboard')?'active':'')}>لوحة التحكم</Link>
        )}
      </div>

      <div className="nav-actions">
        {user ? (
          <>
            {/* Notifications */}
            <div className="notif-wrapper">
              <button className="notif-btn" onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead() }}>
                🔔
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>الإشعارات</span>
                    {unread > 0 && <button onClick={markAllRead} className="mark-read-btn">قراءة الكل</button>}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="no-notifs">لا توجد إشعارات</div>
                  ) : notifs.map(n => (
                    <div key={n.id} className={'notif-item ' + (n.is_read ? 'read' : 'unread')} onClick={() => handleNotifClick(n)}>
                      <span className="notif-icon">{NOTIF_ICONS[n.type] || '🔔'}</span>
                      <div className="notif-content">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                        <div className="notif-time">{new Date(n.created_at).toLocaleDateString('ar-SA')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User */}
            <div className="nav-user-wrapper" ref={menuRef}>
              <button
                className="nav-user"
                onClick={() => setMenuOpen(o => !o)}
              >
                <div className="nav-avatar">
                  {userData?.full_name?.[0] || 'م'}
                </div>
              </button>
              {menuOpen && (
                <div className="nav-user-dropdown">
                  {userData?.user_type === 'contractor' && (
                    <Link to="/dashboard/contractor" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      <span>🏗️</span> لوحة التحكم
                    </Link>
                  )}
                  {userData?.user_type === 'client' && (
                    <Link to="/my-requests" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      <span>📋</span> طلباتي
                    </Link>
                  )}
                  {userData?.user_type === 'admin' && (
                    <Link to="/admin" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      <span>⚙️</span> الإدارة
                    </Link>
                  )}
                  <div className="nav-menu-divider" />
                  <button className="nav-menu-item nav-menu-logout" onClick={handleLogout}>
                    <span>🚪</span> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link to="/login" className="nav-login-btn">دخول</Link>
        )}
      </div>
    </nav>
  )
}
