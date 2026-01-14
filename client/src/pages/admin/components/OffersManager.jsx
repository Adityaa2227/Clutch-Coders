import React, { useState, useEffect } from 'react';
import api from '../../../api';
import { Tag, Plus, Power, Trash2, Save, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

const OffersManager = () => {
    const [offers, setOffers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newOffer, setNewOffer] = useState({ name: '', percentage: 5, maxCap: 5 });

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await api.get('/rewards/offers');
            setOffers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleOffer = async (id) => {
        try {
            await api.put(`/rewards/offers/${id}`);
            fetchOffers();
        } catch (err) {
            console.error(err);
        }
    };

    const createOffer = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rewards/offers', { ...newOffer, type: 'cashback' });
            setIsCreating(false);
            fetchOffers();
            setNewOffer({ name: '', percentage: 5, maxCap: 5 });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-surface/30 backdrop-blur-md rounded-2xl border border-white/5 p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Tag className="text-pink-400" size={24} />
                    Active Offers
                </h2>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    onSubmit={createOffer}
                    className="bg-black/40 p-4 rounded-xl mb-4 border border-white/10 space-y-4"
                >
                    <input 
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                        placeholder="Offer Name (e.g. Launch Bonus)"
                        value={newOffer.name}
                        onChange={e => setNewOffer({...newOffer, name: e.target.value})}
                        required
                    />
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs text-slate-400">Cashback %</label>
                            <input 
                                type="number"
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                                value={newOffer.percentage}
                                onChange={e => setNewOffer({...newOffer, percentage: e.target.value})}
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-slate-400">Max Cap (₹)</label>
                            <input 
                                type="number"
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white" 
                                value={newOffer.maxCap}
                                onChange={e => setNewOffer({...newOffer, maxCap: e.target.value})}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-green-600/80 hover:bg-green-600 py-2 rounded text-sm font-bold flex items-center justify-center gap-2">
                        <Save size={16} /> Save Offer
                    </button>
                </motion.form>
            )}

            {/* List */}
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {offers.map(offer => (
                    <div key={offer._id} className={`p-4 rounded-xl border ${offer.isActive ? 'border-pink-500/30 bg-pink-500/5' : 'border-white/5 bg-white/5'} flex justify-between items-center group`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white">{offer.name}</h3>
                                {offer.isActive && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">ACTIVE</span>}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                <Percent size={12} /> {offer.percentage}% Cashback (Max ₹{offer.maxCap})
                            </p>
                        </div>
                        <button 
                            onClick={() => toggleOffer(offer._id)}
                            className={`p-2 rounded-lg transition-colors ${offer.isActive ? 'text-green-400 hover:bg-red-500/20 hover:text-red-400' : 'text-slate-500 hover:text-green-400'}`}
                            title={offer.isActive ? "Disable" : "Enable"}
                        >
                            <Power size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OffersManager;
