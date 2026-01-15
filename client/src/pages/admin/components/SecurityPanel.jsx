import React, { useState, useEffect } from 'react';
import api from '../../../api';
import { 
    Shield, Lock, AlertTriangle, Eye, Activity, Key, CreditCard, 
    FileText, UserX, Server, Mail, RefreshCw, Ban, Search, CheckCircle, Termianl
} from 'lucide-react';
import { motion } from 'framer-motion';

const SecurityPanel = () => {
    const [stats, setStats] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [blockList, setBlockList] = useState([]);
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);

    // Fetch Initial Data
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Live refresh
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, logsRes, blockRes] = await Promise.all([
                api.get('/security/stats'),
                api.get('/security/audit-logs'),
                api.get('/security/blocklist')
            ]);
            setStats(statsRes.data);
            setAuditLogs(logsRes.data);
            setBlockList(blockRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Security Data Error", err);
        }
    };

    const handleAction = async (action, payload) => {
        try {
            if (action === 'BLOCK_IP') {
                await api.post('/security/block', { type: 'IP', value: payload, reason: 'Manual Admin Block' });
            }
            if (action === 'KILL_SESSION') {
                await api.post('/security/session/kill', { userId: payload });
            }
            fetchData();
        } catch (err) {
            alert("Action Failed: " + err.message);
        }
    };

    const renderOverview = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={AlertTriangle} label="Failed Logins (1h)" value={stats?.failedLoginAttempts || 0} color="text-red-400" />
                <MetricCard icon={Key} label="OTP Spikes (1h)" value={stats?.otpRequestsLastHour || 0} color="text-yellow-400" />
                <MetricCard icon={Activity} label="Active Sessions" value={stats?.activeUserSessions || 0} color="text-blue-400" />
                <MetricCard icon={UserX} label="Flagged Users" value={stats?.flaggedUsersCount || 0} color="text-orange-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Recent Audit Logs */}
                 <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                     <h3 className="font-bold mb-4 flex items-center gap-2"> <FileText size={18} /> Recent Audit Logs</h3>
                     <div className="space-y-2 h-64 overflow-y-auto custom-scrollbar">
                         {auditLogs.slice(0, 10).map(log => (
                             <div key={log._id} className="text-xs p-2 bg-white/5 rounded border border-white/5 flex justify-between">
                                 <div>
                                     <span className="font-bold text-blue-300">{log.action}</span>
                                     <span className="text-white/50 ml-2">on {log.targetEntity}</span>
                                 </div>
                                 <span className="text-white/30">{new Date(log.createdAt).toLocaleTimeString()}</span>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Blocklist Preview */}
                 <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                     <h3 className="font-bold mb-4 flex items-center gap-2"> <Ban size={18} /> Active Blocks</h3>
                     <div className="space-y-2">
                        {blockList.length === 0 && <div className="text-white/30">No active blocks</div>}
                        {blockList.slice(0, 5).map(item => (
                            <div key={item._id} className="flex justify-between items-center bg-red-500/10 p-2 rounded">
                                <span className="text-red-300 text-sm font-mono">{item.value} ({item.type})</span>
                                <button className="text-xs text-white/50 hover:text-white" onClick={() => api.delete(`/security/block/${item._id}`).then(fetchData)}>Unblock</button>
                            </div>
                        ))}
                     </div>
                 </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header / Nav */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10">
                <NavBtn active={activeSection === 'overview'} onClick={() => setActiveSection('overview')} icon={Shield} label="Overview" />
                <NavBtn active={activeSection === 'auth'} onClick={() => setActiveSection('auth')} icon={Key} label="Auth & OTP" />
                <NavBtn active={activeSection === 'sessions'} onClick={() => setActiveSection('sessions')} icon={Activity} label="Sessions" />
                <NavBtn active={activeSection === 'wallet'} onClick={() => setActiveSection('wallet')} icon={CreditCard} label="Wallet Sec" />
                <NavBtn active={activeSection === 'api'} onClick={() => setActiveSection('api')} icon={Server} label="API Health" />
                <NavBtn active={activeSection === 'logs'} onClick={() => setActiveSection('logs')} icon={FileText} label="Audit Logs" />
                <NavBtn active={activeSection === 'blocklist'} onClick={() => setActiveSection('blocklist')} icon={Ban} label="Blocklist" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeSection === 'overview' && renderOverview()}
                
                {activeSection === 'logs' && (
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-white/50 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Admin</th>
                                    <th className="p-4">Action</th>
                                    <th className="p-4">Target</th>
                                    <th className="p-4">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {auditLogs.map(log => (
                                    <tr key={log._id} className="hover:bg-white/5">
                                        <td className="p-4 text-white/60">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="p-4">{log.adminId?.name || 'Unknown'}</td>
                                        <td className="p-4 font-bold text-blue-300">{log.action}</td>
                                        <td className="p-4">{log.targetEntity}: {log.targetId}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                log.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 
                                                log.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                                            }`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Placeholder for other sections (Extensible) */}
                {['auth', 'sessions', 'wallet', 'api', 'blocklist'].includes(activeSection) && (
                    <div className="flex flex-col items-center justify-center h-64 text-white/30 border border-white/10 rounded-xl bg-white/5 border-dashed">
                        <Lock className="w-12 h-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-bold">Secure Zone</h3>
                        <p>This module is monitored. (Placeholder for UI - Backend Ready)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-white/5 ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
        </div>
    </div>
);

const NavBtn = ({ active, onClick, icon: Icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            active ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-white/60'
        }`}
    >
        <Icon size={16} />
        {label}
    </button>
);

export default SecurityPanel;
