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
           <div className="glass-card px-2 py-2 md:px-6 md:py-3 flex justify-between items-center bg-[#0B0F14]/80 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-2xl">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 pl-2 group">
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300">
                    F
                </div>
                <span className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors hidden sm:block">
                  FlexPass
                </span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                {isAuthenticated && user && (
                    <>
                        <NavLink to="/services" icon={Store}>Apps</NavLink>
                        <NavLink to="/rewards" icon={Gift}>Rewards</NavLink>
                        <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                        <NavLink to="/history" icon={Clock}>History</NavLink>
                    </>
                )}
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-4 pr-2">
                {loading ? (
                  <Loader2 className="animate-spin text-blue-500" />
                ) : isAuthenticated && user ? (
                  <>
                    <div className="hidden md:flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner group cursor-default">
                       <div className="p-1 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
                           <Wallet className="w-4 h-4 text-green-400" />
                       </div>
                       <span className="font-mono font-bold text-green-400 text-sm tracking-wide">₹{user.walletBalance}</span>
                    </div>

                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                         <Link to="/profile" className="flex items-center gap-3 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors">
                            <div className="text-right">
                                <div className="text-xs font-bold text-white">{user.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{user.role}</div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                         </Link>
                         
                        <button 
                            onClick={handleLogout} 
                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                            title="Logout"
                        >
                          <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                  </>
                ) : (
                  <Link 
                    to="/auth" 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    Login
                  </Link>
                )}

                {/* Mobile Menu Toggle */}
                <button 
                    className="md:hidden p-2 text-slate-300 hover:text-white bg-white/5 rounded-lg border border-white/5"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
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
