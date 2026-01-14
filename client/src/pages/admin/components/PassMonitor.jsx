import React, { useEffect, useState } from 'react';
import api from '../../../api';
import { useSocket } from '../../../context/SocketContext';
import { Ticket, MoreVertical, RefreshCw } from 'lucide-react';

const PassMonitor = () => {
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    useEffect(() => {
        fetchPasses();
    }, []);
    
    // Listen for live usage updates
    useEffect(() => {
        if (!socket) return;
        
        socket.on('usage_logged', (data) => {
            // Update local state if the pass exists in our list
            setPasses(prev => prev.map(pass => {
                if(pass._id === data.passId) {
                    return { ...pass, remainingAmount: pass.remainingAmount - data.amountUsed };
                }
                return pass;
            }));
        });
        
        return () => socket.off('usage_logged');
    }, [socket]);

    const fetchPasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/passes');
            setPasses(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleRevokePass = async (id) => {
        if(!window.confirm("Are you sure you want to revoke this pass?")) return;
        try {
            await api.delete(`/admin/passes/${id}`);
            setPasses(passes.filter(p => p._id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to revoke pass");
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Ticket className="text-blue-400 w-8 h-8" />
                    <div>
                        <h2 className="text-xl font-bold">Live Pass Registry</h2>
                        <p className="text-text-muted text-sm">Monitor all active subscriptions and usage limits</p>
                    </div>
                </div>
                <button onClick={fetchPasses} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="glass-card bg-surface border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5 text-xs uppercase tracking-wider text-slate-400 font-bold">
                            <th className="p-4">User</th>
                            <th className="p-4">Service</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Usage / Expiry</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading registry...</td></tr>
                        ) : passes.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">No active passes found.</td></tr>
                        ) : (
                            passes.map(pass => (
                                <tr key={pass._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold">
                                        <div>{pass.userId?.name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">{pass.userId?.email}</div>
                                    </td>
                                    <td className="p-4 text-slate-300">{pass.serviceId?.name || 'Deleted Service'}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-800 rounded text-xs capitalize">{pass.serviceId?.type || 'N/A'}</span>
                                    </td>
                                    <td className="p-4 font-mono text-sm">
                                        {pass.serviceId?.type === 'usage' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-blue-500" 
                                                        style={{ width: `${(pass.remainingAmount / pass.totalLimit) * 100}%` }}
                                                    />
                                                </div>
                                                <span>{pass.remainingAmount} / {pass.totalLimit}</span>
                                            </div>
                                        ) : (
                                            <span className="text-yellow-400">Exp: {new Date(pass.expiresAt).toLocaleDateString()}</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${pass.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {pass.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleRevokePass(pass._id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors text-xs font-bold border border-red-500/20"
                                        >
                                            Revoke
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PassMonitor;
