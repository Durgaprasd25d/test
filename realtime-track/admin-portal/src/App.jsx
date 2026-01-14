import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Technicians from './pages/Technicians';
import Withdrawals from './pages/Withdrawals';
import KYCCenter from './pages/KYCCenter';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import LiveMap from './pages/LiveMap';

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
          <Route path="map" element={<LiveMap />} />
          <Route path="services" element={<Services />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
