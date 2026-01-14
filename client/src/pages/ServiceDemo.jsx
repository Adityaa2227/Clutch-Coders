import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const ServiceDemo = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    
    // For realtime balance updates
    const socket = useSocket();
    const [timeLeft, setTimeLeft] = useState(null);
    const [currentBalance, setCurrentBalance] = useState(null);

    useEffect(() => {
        // Fetch Service Metadata
        api.get(`/services/${id}`).then(res => setService(res.data));
        
        // Fetch Initial Balance / Active Pass
        api.get('/passes/my-passes').then(res => {
            const myPasses = res.data;
            const activePass = myPasses.find(p => (p.serviceId._id || p.serviceId) === id && p.status === 'active');
            
            if (activePass) {
                // Determine logic based on service type
                const type = activePass.serviceId.type || 'usage';

                if (type === 'time') {
                     // TIME BASED: Calculate Difference
                     const expiry = new Date(activePass.expiresAt);
                     const updateTimer = () => {
                         const now = new Date();
                         const diff = expiry - now;
                         if (diff <= 0) {
                             setCurrentBalance("Expired");
                             setTimeLeft(0);
                             setError("Pass expired. Please renew.");
                         } else {
                             const hours = Math.floor(diff / (1000 * 60 * 60));
                             const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                             const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                             setCurrentBalance(`${hours}h ${minutes}m ${seconds}s`);
                             setTimeLeft(diff);
                         }
                     };
                     updateTimer(); // Initial run
                     const interval = setInterval(updateTimer, 1000);
                     return () => clearInterval(interval);
                } else {
                     // USAGE BASED
                     setCurrentBalance(activePass.remainingAmount);
                }

            } else {
                setCurrentBalance(0);
                setError("No active pass found. Please buy one from Marketplace.");
            }
        });
    }, [id]);

    useEffect(() => {
        if (!socket || !service || service.type === 'time') return; // Sockets only for usage updates
        
        socket.on('usage_update', (data) => {
            if (data.serviceId === id) {
                setCurrentBalance(data.remainingAmount);
                if (data.remainingAmount <= 0) {
                     setError("Pass exhausted. Please top up.");
                }
            }
        });
        return () => socket && socket.off('usage_update');
    }, [id, socket, service]);

    const handleExecute = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Send empty object body to ensure Content-Type application/json is set
            const res = await api.post(`/access/${id}`, {});
            // Simulate network delay for effect
            setTimeout(() => {
                setResult(res.data);
                if (res.data.remainingAmount !== undefined) {
                    setCurrentBalance(res.data.remainingAmount);
                }
                setLoading(false);
            }, 800);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.msg || "Access Denied");
        }
    };

    if (!service) return <div className="p-10 text-center">Loading Service...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="glass-card p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                
                <h1 className="text-3xl font-bold mb-2">{service.name} Demo</h1>
                <p className="text-slate-400 mb-8">{service.description}</p>

                <div className="bg-slate-900/50 p-4 rounded-lg inline-block mb-8 border border-slate-700">
                     <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                        {service.type === 'time' ? 'Time Remaining' : 'Your Balance'}
                     </div>
                     <div className="text-3xl font-mono font-bold text-white">
                         {currentBalance !== null ? currentBalance : '---'} <span className="text-sm text-slate-500">{service.type === 'usage' ? service.unitName : ''}</span>
                     </div>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={handleExecute}
                        disabled={loading || (service.type === 'time' && timeLeft <= 0)}
                        className={`w-full py-4 text-xl font-bold rounded-xl flex items-center justify-center gap-3 transition-all ${
                            loading || (service.type === 'time' && timeLeft <= 0) ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] shadow-lg shadow-purple-500/20'
                        }`}
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <><Zap /> {service.type === 'time' ? 'LAUNCH SESSION' : 'CONSUME API'}</>
                        )}
                    </button>

                    <AnimatePresence>
                        {result && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-left"
                            >
                                <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                                    <CheckCircle size={18} /> Success
                                </div>
                                <pre className="text-xs bg-slate-950 p-3 rounded overflow-auto font-mono text-slate-300">
                                    {JSON.stringify(result.data, null, 2)}
                                </pre>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 flex items-center gap-2"
                            >
                                <AlertCircle size={20} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ServiceDemo;
