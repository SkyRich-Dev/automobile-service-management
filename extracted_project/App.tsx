
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { MOCK_USERS } from './mockData';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ServiceOperationsPage from './pages/ServiceOperationsPage';
import JobCardDetailPage from './pages/JobCardDetailPage';
import InventoryPage from './pages/InventoryPage';
import CRMPage from './pages/CRMPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SettingsPage from './pages/SettingsPage';
import AccountsPage from './pages/AccountsPage';
import HRMSPage from './pages/HRMSPage';
import AppointmentPage from './pages/AppointmentPage';
import NewJobCardPage from './pages/NewJobCardPage';
import VehicleSalesPage from './pages/VehicleSalesPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import BranchManagementPage from './pages/BranchManagementPage';

// Components
import Layout from './components/Layout';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('autoserv_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (role: UserRole) => {
    const foundUser = MOCK_USERS.find(u => u.role === role) || MOCK_USERS[0];
    setUser(foundUser);
    localStorage.setItem('autoserv_user', JSON.stringify(foundUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('autoserv_user');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        {/* Customer Portal (Unauthenticated / Public link simulation) */}
        <Route path="/portal/:customerId" element={<CustomerPortalPage />} />

        {user ? (
          <Route element={<Layout user={user} onLogout={handleLogout} />}>
            <Route path="/" element={<DashboardPage user={user} />} />
            <Route path="/appointments" element={<AppointmentPage user={user} />} />
            <Route path="/sales" element={<VehicleSalesPage user={user} />} />
            <Route path="/service" element={<ServiceOperationsPage user={user} />} />
            <Route path="/service/new" element={<NewJobCardPage user={user} />} />
            <Route path="/service/job/:id" element={<JobCardDetailPage user={user} />} />
            <Route path="/inventory" element={<InventoryPage user={user} />} />
            <Route path="/crm" element={<CRMPage user={user} />} />
            <Route path="/crm/customer/:id" element={<CustomerDetailPage user={user} />} />
            <Route path="/accounts" element={<AccountsPage user={user} />} />
            <Route path="/hrms" element={<HRMSPage user={user} />} />
            <Route path="/settings" element={<SettingsPage user={user} />} />
            <Route path="/settings/branches" element={<BranchManagementPage user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;
