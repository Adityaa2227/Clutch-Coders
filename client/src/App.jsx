import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Marketplace from './pages/Marketplace';
import ServiceDemo from './pages/ServiceDemo';
import AdminDashboard from './pages/admin/AdminDashboard';

import Landing from './pages/Landing';
import Profile from './pages/Profile';
import RewardsDashboard from './pages/RewardsDashboard';
import Support from './pages/Support';

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<History />} />
              <Route path="/services" element={<Marketplace />} />
              <Route path="/demo/:id" element={<ServiceDemo />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/rewards" element={<RewardsDashboard />} />
              <Route path="/support" element={<Support />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
