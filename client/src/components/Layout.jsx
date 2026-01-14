import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isFullPage = ['/auth', '/'].includes(location.pathname);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Navbar is fixed, so it sits on top. 
          For FullPages, we don't pad top, effectively floating nav over content or letting content start at top.
      */}
      <Navbar />
      
      <main className={isFullPage ? "w-full" : "container mx-auto px-4 pt-20"}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
