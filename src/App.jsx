import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Home               from './pages/Home'
import Login              from './pages/Login'
import Search             from './pages/Search'
import ContractorProfile  from './pages/ContractorProfile'
import NewRequest         from './pages/NewRequest'
import RequestDetail      from './pages/RequestDetail'
import ContractorDashboard from './pages/ContractorDashboard'
import ClientDashboard    from './pages/ClientDashboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading"><div className="spinner"/></div>
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"                     element={<Home />} />
        <Route path="/login"                element={<Login />} />
        <Route path="/search"               element={<Search />} />
        <Route path="/contractor/:id"       element={<ContractorProfile />} />
        <Route path="/request/new"          element={<ProtectedRoute><NewRequest /></ProtectedRoute>} />
        <Route path="/request/:id"          element={<RequestDetail />} />
        <Route path="/dashboard/contractor" element={<ProtectedRoute><ContractorDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/client"     element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
        <Route path="*"                     element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
