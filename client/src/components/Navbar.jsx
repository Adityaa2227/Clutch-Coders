import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, LogOut, Loader2, Menu, X, User as UserIcon, Store, LayoutDashboard, Clock, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const NavLink = ({ to, children, icon: Icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
          isActive 
            ? 'bg-blue-500/20 text-blue-400' 
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {Icon && <Icon size={16} />}
        {children}
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="container mx-auto max-w-6xl">
           <div className="glass-card px-6 py-3 flex justify-between items-center bg-surface/60 backdrop-blur-xl border-border/50">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                    F
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:block">
                  FlexPass
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated && user && (
                    <>
                        <NavLink to="/services" icon={Store}>Marketplace</NavLink>
                        <NavLink to="/rewards" icon={Gift}>Rewards</NavLink>
                        <NavLink to="/history" icon={Clock}>History</NavLink>
                        <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                        <NavLink to="/profile" icon={UserIcon}>Profile</NavLink>
                    </>
                )}
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-4">
                {loading ? (
                  <Loader2 className="animate-spin text-blue-500" />
                ) : isAuthenticated && user ? (
                  <>
                    <div className="hidden md:flex items-center gap-2 bg-obsidian/50 px-3 py-1.5 rounded-full border border-border shadow-inner">
                       <div className="p-1 bg-green-500/20 rounded-full">
                           <Wallet className="w-3.5 h-3.5 text-green-400" />
                       </div>
                       <span className="font-mono font-bold text-green-400 text-sm">₹{user.walletBalance}</span>
                    </div>

                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="hidden md:block text-right">
                            <div className="text-xs font-bold text-white">{user.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</div>
                        </div>
                        <button 
                            onClick={handleLogout} 
                            className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Logout"
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                  </>
                ) : (
                  <Link 
                    to="/auth" 
                    className="bg-white text-obsidian px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
                  >
                    Login
                  </Link>
                )}

                {/* Mobile Menu Toggle */}
                <button 
                    className="md:hidden text-slate-400 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
              </div>
           </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-x-4 top-24 z-40 md:hidden"
            >
                <div className="glass-card p-4 flex flex-col gap-2 bg-surface/90 backdrop-blur-xl border-border">
                    {isAuthenticated && user ? (
                        <>
                            <div className="flex justify-between items-center bg-surface p-3 rounded-lg mb-2 border border-border">
                                <span className="text-sm font-bold">{user.name}</span>
                                <span className="font-mono font-bold text-green-400 text-sm">₹{user.walletBalance}</span>
                            </div>
                            <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/5 rounded-lg flex items-center gap-3">
                                <Store size={18} className="text-slate-400" /> Marketplace
                            </Link>
                            <Link to="/history" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/5 rounded-lg flex items-center gap-3">
                                <Clock size={18} className="text-slate-400" /> History
                            </Link>
                            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/5 rounded-lg flex items-center gap-3">
                                <LayoutDashboard size={18} className="text-slate-400" /> Dashboard
                            </Link>
                            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="p-3 hover:bg-white/5 rounded-lg flex items-center gap-3">
                                <UserIcon size={18} className="text-slate-400" /> Profile
                            </Link>
                        </>
                    ) : (
                         <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-blue-600 rounded-lg text-center font-bold">
                            Login / Sign Up
                         </Link>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
