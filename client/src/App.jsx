import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import ServiceDemo from './pages/ServiceDemo';

import Landing from './pages/Landing';

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
              <Route path="/services" element={<Marketplace />} />
              <Route path="/demo/:id" element={<ServiceDemo />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
