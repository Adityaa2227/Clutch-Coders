import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

import Toast from '../components/Toast';

const Marketplace = () => {
    const { user, updateWallet } = useAuth();
    const [services, setServices] = useState([]);
    
    // Toast State
    const [toast, setToast] = useState({ message: null, type: 'success' });

    // Modal State
    const [selectedService, setSelectedService] = useState(null);
    const [amount, setAmount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        api.get('/services').then(res => setServices(res.data));
    }, []);

    const openPurchaseModal = (service) => {
        if (!user) {
            showToast("Please login first to purchase passes", "error"); 
            return;
        }
        setSelectedService(service);
        setAmount(1); // Default to 1 unit for everything
        setStatusMsg(null);
        setModalOpen(true);
    };

    const handleConfirmPurchase = async () => {
        setLoading(true);
        setStatusMsg(null);
        try {
            const res = await api.post('/passes/buy', { serviceId: selectedService._id, amount });
            updateWallet(res.data.walletBalance);
            setStatusMsg({ type: 'success', text: 'Purchase Successful! Added to Dashboard.' });
            setTimeout(() => {
                setModalOpen(false);
                setStatusMsg(null);
            }, 1000);
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.response?.data?.msg || 'Purchase Failed' });
        } finally {
            setLoading(false);
        }
    };

    const totalCost = selectedService ? amount * selectedService.costPerUnit : 0;

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 mt-10 space-y-8">
           <Toast 
               message={toast.message} 
               type={toast.type} 
               onClose={() => setToast({ ...toast, message: null })} 
           />
           {/* Purchase Modal */}
           <Modal 
              isOpen={modalOpen} 
              onClose={() => setModalOpen(false)} 
              title={`Buy ${selectedService?.name}`}
           >
              {selectedService && (
                <div className="space-y-4">
                    <div className="flex justify-between text-sm text-text-muted">
                        <span>Rate:</span>
                        <span>₹{selectedService.costPerUnit} / {selectedService.unitName}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                           Quantity ({selectedService.unitName})
                        </label>
                        <input 
                            type="number" 
                            min="1"
                            className="w-full bg-surface border border-border rounded-xl p-3 focus:border-primary outline-none transition-all text-white"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </div>

                    <div className="bg-surface/50 p-4 rounded-xl border border-border flex justify-between items-center text-lg font-bold">
                        <span>Total Cost:</span>
                        <span className="text-blue-400">₹{totalCost}</span>
                    </div>

                    {user.walletBalance < totalCost && (
                         <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-500/10">
                             <AlertCircle size={16} /> Insufficient Balance (₹{user.walletBalance})
                         </div>
                    )}

                    {statusMsg && (
                        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                            {statusMsg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                            {statusMsg.text}
                        </div>
                    )}

                    <div className="pt-2">
                        <button 
                            onClick={handleConfirmPurchase}
                            disabled={loading || user.walletBalance < totalCost}
                            className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg
                                ${user.walletBalance >= totalCost 
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/20' 
                                    : 'bg-surface border border-white/10 text-slate-500 cursor-not-allowed'}`}
                        >
                            {loading ? 'Processing...' : `Confirm Payment`}
                        </button>
                    </div>
                </div>
              )}
           </Modal>

           {/* Header */}
           <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-12">
                <div>
                     <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                        <ShoppingCart className="text-teal-400" size={40} /> Marketplace
                     </h1>
                     <p className="text-slate-400 mt-2 text-lg">Discover and subscribe to premium micro-services.</p>
                </div>
           </div>

           {/* Services Grid */}
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {services.map((service, idx) => (
                   <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={service._id} 
                        className="glass-card p-0 flex flex-col group overflow-hidden border border-white/5 hover:border-teal-500/30 transition-all duration-300 relative"
                    >
                       {/* Hover Glow */}
                       <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                       <div className="p-8 flex flex-col h-full relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 p-4 rounded-2xl text-teal-400 shadow-inner border border-white/5">
                                    <Star className="w-6 h-6" fill="currentColor" fillOpacity={0.2} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${service.type === 'usage' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : 'border-orange-500/30 text-orange-400 bg-orange-500/10'}`}>
                                    {service.type}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">{service.name}</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed flex-grow">{service.description || "No description provided."}</p>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Price per unit</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-white">₹{service.costPerUnit}</span>
                                        <span className="text-xs text-slate-500 ml-1">/ {service.unitName}</span>
                                    </div>
                                </div>
                                
                                <button 
                                        onClick={() => openPurchaseModal(service)}
                                        className="w-full py-3 bg-white/5 hover:bg-teal-500 hover:text-white border border-white/10 hover:border-teal-500/50 rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-teal-500/20"
                                    >
                                    <ShoppingCart size={18} /> Buy Pass
                                </button>
                            </div>
                       </div>
                   </motion.div>
               ))}
           </div>
        </div>
    );
};

export default Marketplace;
