import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import Withdrawals from './pages/Withdrawals';
import KYCCenter from './pages/KYCCenter';
import Login from './pages/Login';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="kyc" element={<KYCCenter />} />
          <Route path="payouts" element={<Withdrawals />} />
          <Route path="map" element={<div className="p-4">Live Tracking Map (Coming Soon)</div>} />
          <Route path="settings" element={<div className="p-4">System Settings (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
