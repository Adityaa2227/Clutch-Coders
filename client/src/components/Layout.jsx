import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
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
