import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Plus, Zap, Activity, Clock, Shield, Users, DollarSign, Box } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

import Toast from '../components/Toast';

const Dashboard = () => {
    const { user, updateWallet } = useAuth();
    const socket = useSocket();
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Toast State
    const [toast, setToast] = useState({ message: null, type: 'success' });

    // Modal State
    const [topUpModalOpen, setTopUpModalOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(500);
    const [topUpLoading, setTopUpLoading] = useState(false);

    // Withdraw State
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState(100);
    const [upiId, setUpiId] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    // Admin State
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({
        name: '', description: '', type: 'usage', costPerUnit: '', unitName: ''
    });
    const [creatingService, setCreatingService] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    // Countdown Timer Component
    const CountdownTimer = ({ expiryDate }) => {
        const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

        function calculateTimeLeft() {
            const difference = Date.parse(expiryDate) - Date.now();
            let timeLeft = {};

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return timeLeft;
        }

        useEffect(() => {
            const timer = setInterval(() => {
                setTimeLeft(calculateTimeLeft());
            }, 1000);
            return () => clearInterval(timer);
        }, [expiryDate]);

        const timerComponents = [];

        Object.keys(timeLeft).forEach(interval => {
            if (!timeLeft[interval] && timeLeft[interval] !== 0) return;
            
            timerComponents.push(
                <div key={interval} className="flex flex-col items-center bg-blue-500/10 rounded-lg p-2 min-w-[50px]">
                    <span className="text-lg font-bold font-mono text-blue-300">{timeLeft[interval]}</span>
                    <span className="text-[10px] uppercase text-text-muted">{interval}</span>
                </div>
            );
        });

        return (
            <div className="flex gap-2 justify-center py-2">
                {timerComponents.length ? timerComponents : <span className="text-red-400 font-bold">Expired</span>}
            </div>
        );
    };

    const fetchPasses = async () => {
        try {
            const res = await api.get('/passes/my-passes');
            setPasses(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchServices();
        } else {
            fetchPasses();
        }
    }, [user]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('usage_update', (data) => {
            setPasses(prev => prev.map(p => 
                p._id === data.passId ? { ...p, remainingAmount: data.remainingAmount, status: data.status } : p
            ));
        });

        return () => socket.off('usage_update');
    }, [socket]);

    const handleTopUpConfirm = async () => {
        setTopUpLoading(true); 
        try {
            // 1. Create Order
            const { data: order } = await api.post('/wallet/create-order', { amount: topUpAmount });
            
            // 2. Open Razorpay
            const options = {
                key: order.key_id, // Get Key from backend response
                amount: order.amount,
                currency: order.currency,
                name: "FlexPass",
                description: "Wallet Top-up",
                order_id: order.id,
                handler: async function (response) {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await api.post('/wallet/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: topUpAmount // Amount to add to wallet
                        });
                        
                        updateWallet(verifyRes.data.walletBalance);
                        setTopUpModalOpen(false);
                        showToast("Payment Successful! Wallet Updated.", 'success');
                    } catch (err) {
                        console.error(err);
                        showToast("Payment Verification Failed", 'error');
                    }
                },
                prefill: {
                    name: user?.name,
                    email: user?.email,
                },
                theme: {
                    color: "#3B82F6"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', async function (response){
                showToast("Payment Failed: " + response.error.description, 'error');
                try {
                    await api.post('/payment-failed', { 
                        razorpay_order_id: response.error.metadata.order_id,
                        reason: response.error.description 
                    });
                } catch (e) {
                    console.error("Failed to log failure", e);
                }
            });
            rzp.open();
            
        } catch (err) {
            console.error(err);
            showToast('Order Creation failed. Check console.', 'error');
        } finally {
            setTopUpLoading(false);
        }
    };


    // Withdraw State - Handler
    const handleWithdrawConfirm = async () => {
        if (withdrawAmount > user.walletBalance) {
            showToast("Insufficient Balance", 'error');
            return;
        }
        setWithdrawLoading(true);
        try {
            const res = await api.post('/wallet/withdraw', { amount: withdrawAmount, upiId });
            updateWallet(res.data.walletBalance);
            setWithdrawModalOpen(false);
            showToast("Withdrawal Successful!", 'success');
            setWithdrawAmount(100);
            setUpiId('');
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.msg || "Withdrawal Failed", 'error'); 
        } finally {
            setWithdrawLoading(false);
        }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        setCreatingService(true);
        try {
            const res = await api.post('/services', newService);
            setServices([...services, res.data]);
            setNewService({ name: '', description: '', type: 'usage', costPerUnit: '', unitName: '' });
            showToast('Service Deployed Successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to deploy service.', 'error');
        } finally {
            setCreatingService(false);
        }
    };

    if (loading && user?.role !== 'admin') {
        return <div className="text-center py-20 text-text-muted">Loading Dashboard...</div>;
    }

    // --- ADMIN REDIRECT ---
    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }



    // --- USER DASHBOARD ---
    return (
        <div className="container mx-auto max-w-5xl px-4 py-8 mt-10 space-y-8">
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, message: null })} 
            />
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                 <div>
                     <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Activity className="text-blue-500" size={40} /> Dashboard
                     </h1>
                     <p className="text-slate-400 mt-2 text-lg">Manage your wallet and active subscriptions.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                         onClick={() => setTopUpModalOpen(true)}
                         className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <Plus size={20} /> Add Funds
                    </button>
                    <button 
                         onClick={() => setWithdrawModalOpen(true)}
                         className="px-6 py-3 rounded-xl bg-surface border border-white/10 hover:bg-white/5 text-slate-300 font-bold transition-all flex items-center gap-2"
                    >
                        <DollarSign size={20} /> Withdraw
                    </button>
                </div>
            </div>

            {/* Stats Grid - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Wallet Card */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-card p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none -mr-16 -mt-16" />
                    
                    <div className="p-3 bg-blue-500/20 rounded-xl w-fit mb-4 text-blue-400">
                        <DollarSign size={24} />
                    </div>
                    <div className="text-slate-400 text-sm font-medium mb-1">Wallet Balance</div>
                    <div className="text-4xl font-bold text-white font-mono tracking-tight">₹{user?.walletBalance}</div>
                </motion.div>

                {/* Subscriptions Card */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent relative overflow-hidden"
                >
                     <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none -mr-16 -mt-16" />
                    
                    <div className="p-3 bg-purple-500/20 rounded-xl w-fit mb-4 text-purple-400">
                        <Zap size={24} />
                    </div>
                    <div className="text-slate-400 text-sm font-medium mb-1">Active Passes</div>
                    <div className="text-4xl font-bold text-white font-mono tracking-tight">
                        {passes.filter(p => p.status === 'active').length}
                    </div>
                </motion.div>

                {/* Total Usage Card (Mock/Calculated) */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-8 rounded-2xl border border-white/5 bg-gradient-to-br from-green-500/10 to-transparent relative overflow-hidden"
                >
                     <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-[60px] pointer-events-none -mr-16 -mt-16" />

                    <div className="p-3 bg-green-500/20 rounded-xl w-fit mb-4 text-green-400">
                        <Activity size={24} />
                    </div>
                    <div className="text-slate-400 text-sm font-medium mb-1">Total Services Used</div>
                    <div className="text-4xl font-bold text-white font-mono tracking-tight">
                        {passes.length}
                    </div>
                </motion.div>
            </div>

            {/* Passes Section */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Box className="text-purple-400" /> Your Active Passes
                </h2>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading passes...</div>
                ) : passes.length === 0 ? (
                    <div className="text-center py-20 bg-surface/30 rounded-2xl border border-white/5 border-dashed">
                        <div className="text-slate-500 text-lg mb-4">No active passes found.</div>
                        <Link to="/services" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-bold">
                            Visit Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {passes.map((pass, idx) => (
                            <motion.div 
                                key={pass._id} 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`glass-card p-0 overflow-hidden group hover:border-blue-500/30 transition-all duration-300 ${pass.status === 'expired' ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="p-6 relative">
                                    {/* Background Decor */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />

                                    <div className="flex justify-between items-start mb-6 relative">
                                        <div className="bg-surface/50 p-3 rounded-xl border border-white/5">
                                            {pass.serviceId?.type === 'time' ? <Clock size={20} className="text-orange-400"/> : <Zap size={20} className="text-blue-400"/>}
                                        </div>
                                        <span className={`px-3 py-1 text-xs rounded-full uppercase font-bold tracking-wider border ${pass.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {pass.status}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-1 relative">{pass.serviceId?.name}</h3>
                                    <p className="text-xs text-blue-400 font-mono mb-6 uppercase tracking-wider relative">
                                        {pass.serviceId?.type} BASED
                                    </p>

                                    <div className="bg-black/20 rounded-xl p-4 border border-white/5 relative">
                                        {pass.serviceId?.type === 'usage' ? (
                                            <div>
                                                <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">
                                                    <span>Usage</span>
                                                    <span>{pass.remainingAmount} / {pass.totalLimit}</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(pass.remainingAmount / pass.totalLimit) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-400 uppercase font-bold">Expires</span>
                                                    <span className="text-orange-400 text-sm font-bold">{new Date(pass.expiresAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="pt-2 border-t border-white/5">
                                                     <CountdownTimer expiryDate={pass.expiresAt} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {pass.status === 'active' && (
                                    <Link 
                                        to={`/demo/${pass.serviceId?._id}`} 
                                        className="block w-full py-4 bg-white/5 hover:bg-blue-600 text-center font-bold text-slate-300 hover:text-white transition-all text-sm tracking-widest border-t border-white/5"
                                    >
                                        LAUNCH DEPLOYMENT
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Modal Logic Remains Same */}
            {/* Withdrawal Modal */}
            <Modal
                isOpen={withdrawModalOpen}
                onClose={() => setWithdrawModalOpen(false)}
                title="Withdraw Funds"
            >
                <div className="space-y-6">
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 flex justify-between items-center">
                        <span className="text-sm text-blue-300 font-medium">Available Balance</span>
                        <span className="text-xl font-bold text-blue-400 font-mono">₹{user?.walletBalance}</span>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Amount</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-2xl font-bold text-slate-500 group-focus-within:text-white transition-colors">₹</span>
                            <input 
                                type="number" 
                                min="100"
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-3xl font-bold font-mono text-white focus:border-blue-500 focus:bg-blue-500/5 outline-none transition-all placeholder:text-slate-700"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        {/* Quick Select Pills */}
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            {[100, 500, 1000, 2000].map(amt => (
                                <button 
                                    key={amt}
                                    onClick={() => setWithdrawAmount(amt)}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors whitespace-nowrap"
                                >
                                    ₹{amt}
                                </button>
                            ))}
                            <button 
                                onClick={() => setWithdrawAmount(user?.walletBalance)}
                                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-400 transition-colors whitespace-nowrap"
                            >
                                Max
                            </button>
                        </div>
                    </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">UPI ID</label>
                        <input 
                            type="text" 
                            className="w-full bg-surface border border-border rounded-xl p-3 focus:border-purple-500 outline-none transition-all text-white font-mono"
                            placeholder="username@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500 mt-2">Funds will be transferred to this UPI ID instantly.</p>
                    </div>

                    <button 
                        onClick={handleWithdrawConfirm}
                        disabled={withdrawLoading || !upiId || withdrawAmount > user?.walletBalance}
                        className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95 ${
                            withdrawLoading || !upiId || withdrawAmount > user?.walletBalance 
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/20 border border-white/10'
                        }`}
                    >
                        {withdrawLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Withdrawal'}
                    </button>
                    {withdrawAmount > user?.walletBalance && (
                        <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                            Insufficient wallet balance
                        </p>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={topUpModalOpen}
                onClose={() => setTopUpModalOpen(false)}
                title="Add Funds"
            >
                <div className="space-y-6">
                    <p className="text-slate-400 text-sm">
                        Use <strong>Razorpay Test Mode</strong> to add funds instantly.
                    </p>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Amount to Add</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-4 text-2xl font-bold text-slate-500 group-focus-within:text-white transition-colors">₹</span>
                            <input 
                                type="number" 
                                min="100"
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-3xl font-bold font-mono text-white focus:border-green-500 focus:bg-green-500/5 outline-none transition-all placeholder:text-slate-700"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="0"
                            />
                        </div>
                        {/* Quick Select Pills */}
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                            {[100, 500, 1000, 2000, 5000].map(amt => (
                                <button 
                                    key={amt}
                                    onClick={() => setTopUpAmount(amt)}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors whitespace-nowrap"
                                >
                                    +₹{amt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleTopUpConfirm}
                        disabled={topUpLoading}
                        className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95 ${
                            topUpLoading 
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-500/20 border border-white/10'
                        }`}
                    >
                        {topUpLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            <>
                                <Zap size={20} className="fill-current" /> Proceed to Pay
                            </>
                        )}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
                        <Shield size={12} /> Secure Payment by Razorpay
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;
