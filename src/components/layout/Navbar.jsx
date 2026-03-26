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
      <div className="nav-user-wrapper" ref={menuRef}>
              <button
                className="nav-avatar-btn"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="قائمة المستخدم"
              >
                <div className="nav-avatar">
                  {userData?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'م'}
                </div>
              </button>
              {menuOpen && (
                <div className="nav-user-dropdown" dir="rtl">
                  <div className="nav-menu-header">
                    <span className="nav-menu-name">{userData?.full_name || ''}</span>
                    <span className="nav-menu-type">
                      {userData?.user_type === 'contractor' ? 'مقاول' : userData?.user_type === 'client' ? 'عميل' : 'مدير'}
                    </span>
                  </div>
                  <div className="nav-menu-divider" />
                  {userData?.user_type === 'contractor' && (
                    <Link to="/dashboard/contractor" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      🏗️ لوحة التحكم
                    </Link>
                  )}
                  {userData?.user_type === 'client' && (
                    <Link to="/my-requests" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      📋 طلباتي
                    </Link>
                  )}
                  {userData?.user_type === 'admin' && (
                    <Link to="/admin" className="nav-menu-item" onClick={() => setMenuOpen(false)}>
                      ⚙️ لوحة الإدارة
                    </Link>
                  )}
                  <div className="nav-menu-divider" />
                  <button className="nav-menu-item nav-menu-logout" onClick={handleLogout}>
                    🚪 تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
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
