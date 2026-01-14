import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Plus, Zap, Activity, Clock, Shield, Users, DollarSign, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

const Dashboard = () => {
    const { user, updateWallet } = useAuth();
    const socket = useSocket();
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [topUpModalOpen, setTopUpModalOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(500);

    // Admin State
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({
        name: '', description: '', type: 'usage', costPerUnit: '', unitName: ''
    });
    const [creatingService, setCreatingService] = useState(false);

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
        try {
            const res = await api.post('/wallet/topup', { amount: topUpAmount });
            updateWallet(res.data.walletBalance);
            setTopUpModalOpen(false);
            // Optional: Add toast notification here
        } catch (err) {
            alert('Topup failed');
        }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        setCreatingService(true);
        try {
            const res = await api.post('/services', newService);
            setServices([...services, res.data]);
            setNewService({ name: '', description: '', type: 'usage', costPerUnit: '', unitName: '' });
            alert('Service Deployed Successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to deploy service.');
        } finally {
            setCreatingService(false);
        }
    };

    if (loading && user?.role !== 'admin') {
        return <div className="text-center py-20 text-text-muted">Loading Dashboard...</div>;
    }

    // --- ADMIN DASHBOARD ---
    if (user?.role === 'admin') {
        return (
            <div className="space-y-8">
                <div className="flex items-center gap-3 mb-8">
                    <Shield className="text-blue-500 w-8 h-8" />
                    <h1 className="text-3xl font-bold">Admin Control Center</h1>
                </div>

                {/* Stats Row */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 bg-gradient-to-br from-blue-900/20 to-surface/20 border-blue-500/30">
                        <div className="flex items-center gap-3 text-text-muted mb-2">
                             <DollarSign size={18} /> Total Revenue (Mock)
                        </div>
                        <div className="text-4xl font-bold text-white">₹12,450</div>
                    </div>
                    <div className="glass-card p-6 bg-surface/40">
                         <div className="flex items-center gap-3 text-text-muted mb-2">
                             <Users size={18} /> Active Users
                        </div>
                        <div className="text-4xl font-bold text-white">1,204</div>
                    </div>
                    <div className="glass-card p-6 bg-surface/40">
                        <div className="flex items-center gap-3 text-text-muted mb-2">
                             <Box size={18} /> Live Services
                        </div>
                        <div className="text-4xl font-bold text-white">{services.length}</div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Create Service Form */}
                    <div className="glass-card p-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Plus className="text-green-400" /> Deploy New Service
                        </h2>
                        <form onSubmit={handleCreateService} className="space-y-5">
                            <div>
                                <label className="block text-sm text-text-muted mb-2">Service Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-surface border border-border rounded-xl p-3 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. GPT-4 Turbo API"
                                    value={newService.name}
                                    onChange={e => setNewService({...newService, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-muted mb-2">Description</label>
                                <textarea 
                                    required
                                    className="w-full bg-surface border border-border rounded-xl p-3 focus:border-blue-500 outline-none transition-all resize-none h-24"
                                    placeholder="Short description of the service..."
                                    value={newService.description}
                                    onChange={e => setNewService({...newService, description: e.target.value})}
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-text-muted mb-2">Pricing Model</label>
                                    <select 
                                        className="w-full bg-surface border border-border rounded-xl p-3 focus:border-blue-500 outline-none transition-all"
                                        value={newService.type}
                                        onChange={e => setNewService({...newService, type: e.target.value})}
                                    >
                                        <option value="usage">Per Usage (Call/Request)</option>
                                        <option value="time">Time Based (Hourly)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-text-muted mb-2">Cost (₹)</label>
                                    <input 
                                        type="number" 
                                        required
                                        className="w-full bg-surface border border-border rounded-xl p-3 focus:border-blue-500 outline-none transition-all"
                                        placeholder="10"
                                        value={newService.costPerUnit}
                                        onChange={e => setNewService({...newService, costPerUnit: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-text-muted mb-2">Unit Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-surface border border-border rounded-xl p-3 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. requests, hours, images"
                                    value={newService.unitName}
                                    onChange={e => setNewService({...newService, unitName: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={creatingService}
                                className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                            >
                                {creatingService ? 'Deploying...' : 'Deploy to Marketplace'}
                            </button>
                        </form>
                    </div>

                    {/* Service List */}
                    <div className="glass-card p-8">
                         <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Box className="text-purple-400" /> Active Inventory
                        </h2>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {services.map(service => (
                                <div key={service._id} className="p-4 rounded-xl bg-surface/50 border border-border flex justify-between items-center group hover:border-blue-500/30 transition-all">
                                    <div>
                                        <h3 className="font-bold">{service.name}</h3>
                                        <p className="text-xs text-text-muted uppercase tracking-wider">{service.type} • ₹{service.costPerUnit}/{service.unitName}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded">LIVE</div>
                                </div>
                            ))}
                            {services.length === 0 && <p className="text-text-muted text-center py-10">No services deployed yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- USER DASHBOARD ---
    return (
        <div className="space-y-8">
            <Modal
                isOpen={topUpModalOpen}
                onClose={() => setTopUpModalOpen(false)}
                title="Add Funds (Mock Payment)"
            >
                <div className="space-y-4">
                    <p className="text-text-muted text-sm">
                        Enter the amount you want to add to your wallet. In a production app, this would open a Razorpay/Stripe gateway.
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                         <input 
                            type="number" 
                            min="100"
                            className="w-full bg-surface border border-border rounded-xl p-3 focus:border-primary outline-none transition-all"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </div>
                    <button 
                        onClick={handleTopUpConfirm}
                        className="w-full btn-primary py-3"
                    >
                        Confirm Top Up
                    </button>
                </div>
            </Modal>

            {/* Header / Wallet Section */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="glass-card p-6 flex-1 bg-gradient-to-br from-blue-900/20 to-surface/20">
                    <h2 className="text-xl font-semibold mb-2 text-text-muted">Wallet Balance</h2>
                    <div className="text-4xl font-bold font-mono text-green-400">₹{user?.walletBalance}</div>
                    <button onClick={() => setTopUpModalOpen(true)} className="mt-4 btn-secondary flex items-center gap-2 text-sm">
                        <Plus size={16} /> Add Funds (Mock)
                    </button>
                </div>
                
                <div className="glass-card p-6 flex-1 flex flex-col justify-center items-center text-center">
                    <h2 className="text-xl font-semibold mb-2 text-text-muted">Active Subscriptions</h2>
                    <div className="text-4xl font-bold text-blue-400">
                        {passes.filter(p => p.status === 'active').length}
                    </div>
                </div>
            </div>

            {/* Passes List */}
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="text-purple-400" /> Your Passes
                </h2>

                {loading ? (
                    <div>Loading...</div>
                ) : passes.length === 0 ? (
                    <div className="text-text-muted">No active passes. Go to Marketplace to buy one!</div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {passes.map(pass => (
                            <motion.div 
                                key={pass._id} 
                                layout
                                className={`glass-card p-0 overflow-hidden border-2 ${pass.status === 'expired' ? 'border-red-500/30 opacity-70' : 'border-blue-500/30'}`}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold">{pass.serviceId?.name || "Unknown Service"}</h3>
                                        <span className={`px-2 py-1 text-xs rounded uppercase font-bold ${pass.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {pass.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm text-text-muted">
                                            <span>Type</span>
                                            <span className="text-text-main capitalize">{pass.serviceId?.type}</span>
                                        </div>

                                        {pass.serviceId?.type === 'usage' ? (
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Usage Remaining</span>
                                                    <span className="font-mono">{pass.remainingAmount} / {pass.totalLimit}</span>
                                                </div>
                                                <div className="h-2 bg-border rounded-full overflow-hidden">
                                                    <motion.div 
                                                        className="h-full bg-blue-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(pass.remainingAmount / pass.totalLimit) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <Clock size={16} />
                                                <span>Expires: {new Date(pass.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {pass.status === 'active' && (
                                    <Link 
                                        to={`/demo/${pass.serviceId?._id}`} 
                                        className="block w-full py-3 bg-blue-600/20 hover:bg-blue-600/40 text-center font-bold text-blue-300 transition-colors uppercase text-sm tracking-wider"
                                    >
                                        Use Service (Demo)
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
