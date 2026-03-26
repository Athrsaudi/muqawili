import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import './Navbar.css'

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [notifCount, setNotifCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
      <Link to="/" className="nav-logo">🏗️ مقاولي</Link>

      <div className="nav-links">
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
