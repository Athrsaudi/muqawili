import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Login from './pages/Login'
import Search from './pages/Search'
import NewRequest from './pages/NewRequest'
import RequestDetail from './pages/RequestDetail'
import ContractorDashboard from './pages/ContractorDashboard'
import ContractorProfile from './pages/ContractorProfile'
import AdminPanel from './pages/Admin'
import MyRequests from './pages/MyRequests'

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Navbar />
      <Routes>
        {/* صفحات عامة */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/contractors/:id" element={<ContractorProfile />} />

        {/* صفحات تحتاج تسجيل دخول فقط */}
        <Route path="/requests/:id" element={
          <ProtectedRoute>
            <RequestDetail />
          </ProtectedRoute>
        } />

        {/* صفحات العملاء فقط */}
        <Route path="/requests/new" element={
          <ProtectedRoute allowedTypes={['client']}>
            <NewRequest />
          </ProtectedRoute>
        } />
        <Route path="/my-requests" element={
          <ProtectedRoute allowedTypes={['client']}>
            <MyRequests />
          </ProtectedRoute>
        } />

        {/* صفحات المقاولين فقط */}
        <Route path="/dashboard/contractor" element={
          <ProtectedRoute allowedTypes={['contractor']}>
            <ContractorDashboard />
          </ProtectedRoute>
        } />

        {/* صفحات الإدارة فقط */}
        <Route path="/admin" element={
          <ProtectedRoute allowedTypes={['admin']}>
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
