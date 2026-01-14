import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

const Marketplace = () => {
    const { user, updateWallet } = useAuth();
    const [services, setServices] = useState([]);
    
    // Modal State
    const [selectedService, setSelectedService] = useState(null);
    const [amount, setAmount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    useEffect(() => {
        api.get('/services').then(res => setServices(res.data));
    }, []);

    const openPurchaseModal = (service) => {
        if (!user) {
            // In a real app, redirect to login or show login modal
            alert("Please login first"); 
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
        <div>
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
                            className="w-full bg-surface border border-border rounded-xl p-3 focus:border-primary outline-none transition-all"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                    </div>

                    <div className="bg-surface/50 p-4 rounded-xl border border-border flex justify-between items-center text-lg font-bold">
                        <span>Total Cost:</span>
                        <span className="text-blue-400">₹{totalCost}</span>
                    </div>

                    {user.walletBalance < totalCost && (
                         <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                             <AlertCircle size={16} /> Insufficient Balance (₹{user.walletBalance})
                         </div>
                    )}

                    {statusMsg && (
                        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {statusMsg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                            {statusMsg.text}
                        </div>
                    )}

                    <div className="pt-2">
                        <button 
                            onClick={handleConfirmPurchase}
                            disabled={loading || user.walletBalance < totalCost}
                            className="w-full btn-primary flex justify-center items-center gap-2 py-3"
                        >
                            {loading ? 'Processing...' : `Confirm Payment`}
                        </button>
                    </div>
                </div>
              )}
           </Modal>

           <div className="flex justify-between items-end mb-8">
                <div>
                     <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">Marketplace</h1>
                     <p className="text-text-muted mt-2">Discover and subscribe to micro-services.</p>
                </div>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {services.map((service, idx) => (
                   <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={service._id} 
                        className="glass-card p-6 flex flex-col"
                    >
                       <div className="flex justify-between items-start mb-4">
                           <div className="bg-blue-500/10 p-3 rounded-lg text-blue-400">
                               <Star className="w-6 h-6" />
                           </div>
                           <span className="text-xs font-bold uppercase tracking-wider bg-surface px-2 py-1 rounded text-text-muted border border-border">{service.type}</span>
                       </div>

                       <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                       <p className="text-text-muted text-sm mb-6 flex-grow">{service.description || "No description provided."}</p>

                       <div className="mt-auto">
                           <div className="flex justify-between items-center mb-4">
                               <span className="text-text-muted text-sm">Price per {service.unitName}</span>
                               <span className="text-2xl font-bold text-white">₹{service.costPerUnit}</span>
                           </div>
                           
                           <button 
                                onClick={() => openPurchaseModal(service)}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                               <ShoppingCart size={18} /> Buy Pass
                           </button>
                       </div>
                   </motion.div>
               ))}
           </div>
        </div>
    );
};

export default Marketplace;
