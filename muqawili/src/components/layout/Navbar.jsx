import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="nav-logo">
          <span>🔨</span>
          <span>مقاولي</span>
        </Link>

        <div className="nav-links">
          <Link to="/search" className="nav-link">البحث عن مقاول</Link>
          <Link to="/request/new" className="nav-link">نشر طلب</Link>
        </div>

        <div className="nav-actions">
          {user && profile ? (
            <div className="nav-user">
              <Link
                to={profile.user_type === 'contractor' ? '/dashboard/contractor' : '/dashboard/client'}
                className="nav-avatar"
                title={profile.full_name}
              >
                <span className="avatar-icon">
                  {profile.user_type === 'contractor' ? '👷' : '👤'}
                </span>
                <span className="avatar-name">{profile.full_name?.split(' ')[0]}</span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>خروج</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">دخول / تسجيل</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
