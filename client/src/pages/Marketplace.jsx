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

    const [purchaseResult, setPurchaseResult] = useState(null);

    const handleConfirmPurchase = async () => {
        setLoading(true);
        setStatusMsg(null);
        try {
            const res = await api.post('/passes/buy', { serviceId: selectedService._id, amount });
            updateWallet(res.data.walletBalance);
            // Don't close modal, show summary instead
            setPurchaseResult(res.data);
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.response?.data?.msg || 'Purchase Failed' });
        } finally {
            setLoading(false);
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              service.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || service.type === filterType;
        return matchesSearch && matchesType;
    });

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
              onClose={() => { setModalOpen(false); setPurchaseResult(null); }} 
              title={purchaseResult ? "Purchase Complete" : `Buy ${selectedService?.name}`}
           >
              {!purchaseResult ? (
                  // PURCHASE FORM
                  selectedService && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="p-3 rounded-lg bg-teal-500/20 text-teal-400">
                                 <Star size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg">{selectedService.name}</h4>
                                <div className="text-sm text-slate-400">Rate: ₹{selectedService.costPerUnit} / {selectedService.unitName}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                               Quantity ({selectedService.unitName})
                            </label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-xl font-mono focus:border-teal-500 outline-none transition-all text-white placeholder-slate-700"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 p-6 rounded-2xl border border-white/10 flex justify-between items-center">
                            <span className="text-slate-400 font-medium">Total Cost</span>
                            <span className="text-3xl font-bold font-mono text-teal-400">₹{Number(totalCost).toFixed(2)}</span>
                        </div>

                        {user.walletBalance < totalCost && (
                             <div className="flex items-center gap-3 text-red-400 text-sm bg-red-950/30 p-4 rounded-xl border border-red-500/20">
                                 <AlertCircle size={20} /> 
                                 <div>
                                     <div className="font-bold">Insufficient Balance</div>
                                     <div className="opacity-75">Available: ₹{Number(user.walletBalance).toFixed(2)}</div>
                                 </div>
                             </div>
                        )}

                        {statusMsg && (
                            <div className={`flex items-center gap-3 text-sm p-4 rounded-xl border ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {statusMsg.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                                {statusMsg.text}
                            </div>
                        )}

                        <button 
                            onClick={handleConfirmPurchase}
                            disabled={loading || user.walletBalance < totalCost}
                            className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg text-lg
                                ${user.walletBalance >= totalCost 
                                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white shadow-teal-500/20 hover:scale-[1.02]' 
                                    : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'}`}
                        >
                            {loading ? 'Processing...' : `Confirm Payment`}
                        </button>
                    </div>
                  )
              ) : (
                  // SUCCESS SUMMARY
                  <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                          <CheckCircle size={40} className="text-green-400" />
                      </div>
                      
                      <div>
                          <h3 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h3>
                          <p className="text-slate-400">Your pass for <span className="text-teal-400 font-bold">{selectedService?.name}</span> is active.</p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/10">
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Amount Paid</span>
                              <span className="font-mono font-bold text-white">₹{Number(totalCost).toFixed(2)}</span>
                          </div>
                          
                          {purchaseResult.cashbackEarned > 0 && (
                              <div className="flex justify-between items-center text-sm bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                  <span className="text-yellow-400 font-bold flex items-center gap-2">
                                      <Star size={14} fill="currentColor" /> Cashback Earned
                                  </span>
                                  <span className="font-mono font-bold text-yellow-400 text-lg">+₹{Number(purchaseResult.cashbackEarned).toFixed(2)}</span>
                              </div>
                          )}

                          <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                              <span className="text-slate-400">New Balance</span>
                              <span className="font-mono font-bold text-blue-400 text-lg">₹{Number(purchaseResult.walletBalance).toFixed(2)}</span>
                          </div>
                      </div>

                      <button 
                          onClick={() => { setModalOpen(false); setPurchaseResult(null); }}
                          className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-all"
                      >
                          Close
                      </button>
                  </div>
              )}
           </Modal>

           {/* Header & Controls */}
           <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                <div>
                     <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                        <ShoppingCart className="text-teal-400" size={40} /> Marketplace
                     </h1>
                     <p className="text-slate-400 mt-2 text-lg">Discover and subscribe to premium micro-services.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                         </div>
                         <input 
                            type="text" 
                            placeholder="Search services..." 
                            className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 w-full md:w-64 focus:bg-white/10 focus:border-teal-500/50 outline-none transition-all text-sm text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                         />
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
                        {['all', 'usage', 'time'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterType(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${filterType === f ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
           </div>

           {/* Services Grid */}
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredServices.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card border-dashed border-slate-700 bg-transparent">
                        <div className="text-slate-500 text-lg">No services found matching your criteria.</div>
                    </div>
               ) : (
                filteredServices.map((service, idx) => (
                   <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={service._id} 
                        className="glass-card p-0 flex flex-col group overflow-hidden border border-white/5 hover:border-teal-500/30 transition-all duration-300 relative h-full"
                    >
                       {/* Hover Glow */}
                       <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                       <div className="p-8 flex flex-col h-full relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 p-4 rounded-2xl text-teal-400 shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-300">
                                    <Star className="w-6 h-6" fill="currentColor" fillOpacity={0.2} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${service.type === 'usage' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' : 'border-orange-500/30 text-orange-400 bg-orange-500/10'}`}>
                                    {service.type}
                                </span>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1" title={service.name}>{service.name}</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed flex-grow line-clamp-3">{service.description || "No description provided."}</p>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="flex justify-between items-end mb-6">
                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Price per unit</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-white">₹{Number(service.costPerUnit).toFixed(2)}</span>
                                        <span className="text-xs text-slate-500 ml-1">/ {service.unitName}</span>
                                    </div>
                                </div>
                                
                                <button 
                                        onClick={() => openPurchaseModal(service)}
                                        className="w-full py-3 bg-white/5 hover:bg-teal-500 hover:text-white border border-white/10 hover:border-teal-500/50 rounded-xl transition-all duration-300 font-bold flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-teal-500/20 active:scale-95"
                                    >
                                    <ShoppingCart size={18} /> Buy Pass
                                </button>
                            </div>
                       </div>
                   </motion.div>
               ))
               )}
           </div>
        </div>
    );
};

export default Marketplace;
