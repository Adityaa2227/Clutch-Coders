import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Sparkles, ShieldCheck, Zap } from 'lucide-react';
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
    <div className="min-h-[calc(100vh)] flex bg-[#0B0F14] overflow-hidden">
      
      {/* Left Panel: Hero Visuals */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0B0F14] items-center justify-center overflow-hidden border-r border-white/5">
         {/* Dynamic Background */}
         <div className="absolute inset-0 bg-blue-600/5" />
         <motion.div 
            animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0], 
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px]" 
         />
         <motion.div 
            animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px]" 
         />

         {/* Content */}
         <div className="relative z-10 px-16 max-w-2xl">
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
             >
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                     <Sparkles size={14} /> 
                     <span>The Next Gen Marketplace</span>
                 </div>
                 <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                     Unlock the Power of <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Micro-Services</span>
                 </h1>
                 <p className="text-lg text-slate-400 leading-relaxed mb-8">
                     Access premium AI tools, API endpoints, and creative assets with a unified pay-per-use wallet. No subscriptions, just freedom.
                 </p>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 gap-6"
             >
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                     <ShieldCheck className="text-green-400 mb-3" size={24} />
                     <h3 className="text-white font-bold mb-1">Secure Wallet</h3>
                     <p className="text-slate-500 text-sm">Military-grade encryption for your assets.</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                     <Zap className="text-yellow-400 mb-3" size={24} />
                     <h3 className="text-white font-bold mb-1">Instant Access</h3>
                     <p className="text-slate-500 text-sm">Real-time API provisioning.</p>
                 </div>
             </motion.div>
         </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative">
         <div className="w-full max-w-md space-y-8">
            <motion.div
                key={isLogin ? 'login-head' : 'reg-head'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center lg:text-left"
            >
                <h2 className="text-3xl font-bold text-white mb-2">
                    {isLogin ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-slate-400">
                    {isLogin ? 'Enter your details to access your workspace.' : 'Start your journey with FlexPass today.'}
                </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatePresence mode='wait'>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm"
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-4">
                    <AnimatePresence>
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                    <input 
                                        type="text"
                                        placeholder="Full Name" 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-white"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        required={!isLogin}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                        <input 
                            type="email" 
                            placeholder="Email Address"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-white"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 text-white"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-slate-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
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

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-[#0B0F14] text-slate-500">Or continue with</span>
                    </div>
                </div>

                <div className="flex justify-center">
                     <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                const { credential } = credentialResponse;
                                const res = await api.post('/auth/google', { credential });
                                localStorage.setItem('token', res.data.token);
                                window.location.href = '/dashboard';
                            } catch (err) {
                                console.error(err);
                                setError('Google Login Failed');
                            }
                        }}
                        onError={() => setError('Google Login Failed')}
                        theme="filled_black"
                        shape="pill"
                        width="400"
                    />
                </div>
            </form>

            <p className="text-center text-slate-500 text-sm mt-8">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                    onClick={toggleMode}
                    className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-all"
                >
                    {isLogin ? 'Sign up for free' : 'Log in'}
                </button>
            </p>
         </div>
         
         {/* Mobile Background Blob */}
         <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
             <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[80px]" />
             <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[80px]" />
         </div>
      </div>
    </div>
  );
};

export default Auth;
