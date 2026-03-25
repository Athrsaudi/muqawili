import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Search from './pages/Search'
import NewRequest from './pages/NewRequest'
import RequestDetail from './pages/RequestDetail'
import ContractorDashboard from './pages/ContractorDashboard'
import ContractorProfile from './pages/ContractorProfile'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/requests/new" element={<NewRequest />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/dashboard/contractor" element={<ContractorDashboard />} />
        <Route path="/contractors/:id" element={<ContractorProfile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
