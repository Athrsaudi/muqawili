import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Navbar.css'

// ── شعار خدماتي SVG ──
function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 52" height="40" width="auto">
      <defs>
        <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#C8922A"/>
          <stop offset="50%"  stopColor="#E8B84B"/>
          <stop offset="100%" stopColor="#A67420"/>
        </linearGradient>
        <linearGradient id="nbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2D1A00"/>
          <stop offset="100%" stopColor="#1A0F00"/>
        </linearGradient>
      </defs>
      {/* أيقونة البرج */}
      <rect x="2" y="2" width="48" height="48" rx="11" fill="url(#nbg)" stroke="url(#ng)" strokeWidth="1.2"/>
      <rect x="14" y="18" width="6"  height="6"  rx="1" fill="url(#ng)"/>
      <rect x="22" y="13" width="8"  height="11" rx="1" fill="url(#ng)"/>
      <rect x="32" y="18" width="6"  height="6"  rx="1" fill="url(#ng)"/>
      <rect x="13" y="23" width="26" height="20" rx="2" fill="url(#ng)" fillOpacity=".12" stroke="url(#ng)" strokeWidth="1"/>
      <rect x="20" y="28" width="12" height="9"  rx="2" fill="none" stroke="url(#ng)" strokeWidth=".9"/>
      <path d="M20 32 Q26 26 32 32" fill="none" stroke="url(#ng)" strokeWidth=".9"/>
      <line x1="26" y1="26" x2="26" y2="37" stroke="url(#ng)" strokeWidth=".7" strokeOpacity=".5"/>
      <g transform="translate(26,9)">
        <polygon points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2" fill="url(#ng)" opacity=".85"/>
        <circle r="1.5" fill="url(#ng)"/>
      </g>
      {/* النص */}
      <text x="58" y="30" fontFamily="Tajawal, Arial, sans-serif" fontSize="22" fontWeight="800" fill="url(#ng)">خدماتي</text>
      <text x="59" y="43" fontFamily="Tajawal, Arial, sans-serif" fontSize="9"  fontWeight="400" fill="#A67420" fillOpacity=".85">سوق الخدمات السعودي</text>
    </svg>
  )
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // تطبيق الثيم عند التحميل وعند التغيير
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        loadUser(session.user);
      } else {
        setUser(null);
        setUserData(null);
        setNotifCount(0);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function loadUser(authUser) {
    setUser(authUser);
    const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
    setUserData(data);
    loadNotifs(authUser.id);
  }

  async function loadNotifs(userId) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifs(data || []);
    setNotifCount((data || []).filter(n => !n.is_read).length);
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', user.id).eq('is_read', false);
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
    setNotifCount(0);
  }

  async function handleNotifClick(notif) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    setNotifOpen(false);
    if (notif.data?.request_id) navigate('/requests/' + notif.data.request_id);
    else if (notif.data?.contractor_id) navigate('/contractors/' + notif.data.contractor_id);
  }

  async function handleLogout() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  }

  const notifIcons = { new_quote: '💰', quote_accepted: '✅', new_review: '⭐' };

  return (
    <nav className="navbar" dir="rtl">
      <Link to="/" className="nav-logo"><Logo /></Link>

      {/* زر الموبايل */}
      <button className="nav-mobile-toggle" onClick={() => setMobileOpen(o => !o)} aria-label="القائمة">
        {mobileOpen ? '✕' : '☰'}
      </button>

      <div className={`nav-links${mobileOpen ? ' open' : ''}`}>
        <Link to="/search" className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}>
          طلبات
        </Link>
        {userData?.user_type === 'client' && (
          <Link to="/requests/new" className={`nav-link ${location.pathname === '/requests/new' ? 'active' : ''}`}>
            + طلب جديد
          </Link>
        )}
        {userData?.user_type === 'contractor' && (
          <Link to="/dashboard/contractor" className={`nav-link ${location.pathname.includes('/dashboard') ? 'active' : ''}`}>
            لوحة التحكم
          </Link>
        )}
        {userData?.user_type === 'admin' && (
          <Link to="/admin" className={`nav-link ${location.pathname.includes('/admin') ? 'active' : ''}`}>
            الإدارة
          </Link>
        )}
      </div>

      <div className="nav-actions">
            {/* زر Dark/Light */}
            <button className="theme-toggle" onClick={toggleTheme} title="تغيير الوضع">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
        {user ? (
          <>
            <div className="notif-wrapper">
              <button
                className="notif-btn"
                onClick={() => { setNotifOpen(o => !o); if (!notifOpen) loadNotifs(user.id); }}
              >
                🔔
                {notifCount > 0 && (
                  <span className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>الإشعارات</span>
                    {notifCount > 0 && (
                      <button onClick={markAllRead} className="mark-read-btn">قراءة الكل</button>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="no-notifs">لا توجد إشعارات</div>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                        onClick={() => handleNotifClick(n)}
                      >
                        <span className="notif-icon">{notifIcons[n.type] || '🔔'}</span>
                        <div className="notif-content">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-body">{n.body}</div>
                          <div className="notif-time">
                            {new Date(n.created_at).toLocaleDateString('ar-SA')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="nav-user-wrapper" ref={menuRef}>
              <button
                className="nav-user"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="قائمة المستخدم"
              >
                <div className="nav-avatar">
                  {userData?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'م'}
                </div>
              </button>

              {menuOpen && (
                <div className="nav-user-dropdown">
                  <div className="nav-menu-header">
                    <span className="nav-menu-name">{userData?.full_name || ''}</span>
                    <span className="nav-menu-type">
                      {userData?.user_type === 'contractor' ? 'مقاول'
                        : userData?.user_type === 'client' ? 'عميل'
                        : 'مدير'}
                    </span>
                  </div>
                  <div className="nav-menu-divider" />
                  {userData?.user_type === 'contractor' && (
                    <Link
                      to="/dashboard/contractor"
                      className="nav-menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      🏗️ لوحة التحكم
                    </Link>
                  )}
                  {userData?.user_type === 'client' && (
                    <Link
                      to="/my-requests"
                      className="nav-menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
                      📋 طلباتي
                    </Link>
                  )}
                  {userData?.user_type === 'admin' && (
                    <Link
                      to="/admin"
                      className="nav-menu-item"
                      onClick={() => setMenuOpen(false)}
                    >
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
          </>
        ) : (
          <Link to="/login" className="nav-login-btn">دخول</Link>
        )}
      </div>
    </nav>
  );
}
