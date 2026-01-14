import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen pb-10">
      <Navbar />
      <main className="container mx-auto px-4 pt-32">
        {children}
      </main>
    </div>
  );
};

export default Layout;
