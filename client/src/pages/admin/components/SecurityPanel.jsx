import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { Shield, AlertTriangle, Lock, CheckCircle, XCircle, Search, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const SecurityPanel = () => {
    const socket = useSocket();
    const [logs, setLogs] = useState([]);
    const [isLive, setIsLive] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!socket) return;
        
        const handleLog = (log) => {
            if (!isLive) return;
            setLogs(prev => [log, ...prev].slice(0, 50)); // Keep last 50 logs
        };

        socket.on('access_log', handleLog);
        return () => socket.off('access_log', handleLog);
    }, [socket, isLive]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Shield className="text-red-400 w-8 h-8" />
                    <div>
                        <h2 className="text-2xl font-bold">Security & Access Monitor</h2>
                        <p className="text-text-muted text-sm">Real-time stream of all authentication and usage attempts</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                         onClick={() => setIsLive(!isLive)}
                         className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isLive ? 'bg-red-500/20 text-red-400 pulse-animation' : 'bg-slate-700 text-slate-400'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                        {isLive ? 'LIVE FEED ON' : 'FEED PAUSED'}
                    </button>
                    <div className="bg-surface border border-white/10 rounded-lg flex items-center px-3 py-2">
                        <Search size={16} className="text-slate-500 mr-2" />
                        <input type="text" placeholder="Filter IP / User..." className="bg-transparent text-sm outline-none w-48" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Feed */}
                <div className="lg:col-span-2 glass-card bg-surface border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <span className="font-bold text-sm uppercase tracking-wider text-slate-400">Access Stream</span>
                        <span className="text-xs text-slate-500">{logs.length} events buffered</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 relative" ref={scrollRef}>
                        <AnimatePresence initial={false}>
                            {logs.map((log, index) => (
                                <motion.div 
                                    key={log.timestamp + index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`p-3 rounded-xl border flex items-center justify-between group hover:bg-white/5 ${
                                        log.status === 'success' 
                                            ? 'bg-green-500/5 border-green-500/10' 
                                            : 'bg-red-500/5 border-red-500/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {log.status === 'success' ? (
                                            <CheckCircle size={18} className="text-green-500" />
                                        ) : (
                                            <AlertTriangle size={18} className="text-red-500" />
                                        )}
                                        <div>
                                            <div className="text-sm font-medium">
                                                <span className="text-white">{log.serviceName || 'Unknown Service'}</span>
                                                <span className="text-slate-500 mx-2">•</span>
                                                <span className="text-blue-400 font-mono">{log.userId?.substring(0,8)}...</span>
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                {new Date(log.timestamp).toLocaleTimeString()} • IP: {log.ip || '::1'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {log.status === 'failed' && (
                                        <div className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20 font-bold uppercase">
                                            {log.reason}
                                        </div>
                                    )}
                                    
                                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all">
                                        Block User
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {logs.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                                <Activity size={48} className="mb-4 opacity-20" />
                                <p>Waiting for events...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Threat Analysis */}
                <div className="space-y-6">
                    <div className="glass-card bg-surface border border-white/5 rounded-2xl p-6">
                         <h3 className="font-bold mb-4 flex items-center gap-2"> <Lock size={18} className="text-purple-400"/> Threat Level</h3>
                         <div className="w-full bg-slate-800 rounded-full h-4 mb-2 overflow-hidden">
                             <div className="bg-gradient-to-r from-green-500 to-yellow-500 w-[15%] h-full rounded-full" />
                         </div>
                         <div className="flex justify-between text-xs text-text-muted">
                             <span>Low</span>
                             <span>Elevated</span>
                             <span>Critical</span>
                         </div>
                         <div className="mt-6 space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-400">Failed Rate (1h)</span>
                                 <span className="text-green-400 font-bold">0.4%</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-400">Blacklisted IPs</span>
                                 <span className="text-white font-bold">12</span>
                             </div>
                         </div>
                    </div>

                    <div className="glass-card bg-surface border border-white/5 rounded-2xl p-6">
                        <h3 className="font-bold mb-4 text-red-400">Recent Alerts</h3>
                         <div className="text-sm text-slate-500 text-center py-8">
                             No critical alerts in last 24h.
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityPanel;
