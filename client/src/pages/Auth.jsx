import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
      setIsLogin(!isLogin);
      setError(null);
      setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex justify-center items-center relative overflow-hidden px-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />

      <motion.div 
        layout
        className="glass-card w-full max-w-lg relative z-10 overflow-hidden border border-white/10 shadow-2xl"
      >
        <div className="p-8 md:p-10">
          <motion.div 
             key={isLogin ? "login-header" : "signup-header"}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-text-muted bg-clip-text text-transparent mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-text-muted text-sm">
              {isLogin ? 'Enter your credentials to access your wallet.' : 'Start your pay-per-use journey today.'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
             <AnimatePresence mode='wait'>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-sm"
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}
             </AnimatePresence>

            <AnimatePresence>
                {!isLogin && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="relative group">
                            <User className="absolute left-3 top-3 text-text-muted group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input 
                                type="text"
                                placeholder="Full Name" 
                                className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted text-text-main"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required={!isLogin}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative group">
                <Mail className="absolute left-3 top-3 text-text-muted group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                    type="email" 
                    placeholder="Email Address"
                    className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted text-text-main"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

            <div className="relative group">
                <Lock className="absolute left-3 top-3 text-text-muted group-focus-within:text-blue-400 transition-colors" size={20} />
                <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-12 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted text-text-main"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-text-muted hover:text-white transition-colors"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-surface text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 mt-6"
            >
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} />
                    </>
                )}
            </button>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#0a0a0b] text-text-muted">Or continue with</span>
                </div>
            </div>

            <div className="flex justify-center">
                 <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                        try {
                            const { credential } = credentialResponse;
                            // Call our backend
                            const res = await api.post('/auth/google', { credential });
                             // Update Context (Assuming AuthContext handles this, but here we do it manually to mimic login)
                             localStorage.setItem('token', res.data.token);
                             // Force reload or use context method if available. 
                             // Ideally useAuth should export a method for this.
                             // For now, let's just use window.location.reload() or manually set user.
                             // Better: Modify useAuth to expose a `googleLogin` function or `setToken`.
                             // Let's assume standard flow:
                             window.location.href = '/dashboard';
                        } catch (err) {
                            console.error(err);
                            setError('Google Login Failed');
                        }
                    }}
                    onError={() => {
                        setError('Google Login Failed');
                    }}
                    theme="filled_black"
                    shape="pill"
                    width="300"
                />
            </div>

          </form>
        </div>
        
        <div className="bg-surface/50 p-6 text-center border-t border-border/50">
           <p className="text-text-muted text-sm">
             {isLogin ? "New to FlexPass? " : "Already have an account? "}
             <button 
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-all"
             >
               {isLogin ? 'Create Account' : 'Sign In'}
             </button>
           </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
