import React, { useState, useEffect } from 'react';
import api from '../../../api';
import { 
    Shield, Lock, AlertTriangle, Eye, Activity, Key, CreditCard, 
    FileText, UserX, Server, Mail, RefreshCw, Ban, Search, CheckCircle, Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';

const SecurityPanel = () => {
    const [stats, setStats] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [blockList, setBlockList] = useState([]);
    const [authData, setAuthData] = useState([]);
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
            const [statsRes, logsRes, blockRes, authRes] = await Promise.all([
                api.get('/security/stats'),
                api.get('/security/audit-logs'),
                api.get('/security/blocklist'),
                api.get('/security/auth-monitoring') // New endpoint usage
            ]);
            setStats(statsRes.data);
            setAuditLogs(logsRes.data);
            setBlockList(blockRes.data);
            setAuthData(authRes.data.recentOTPs || []);
            setLoading(false);
        } catch (err) {
            console.error("Security Data Error", err);
        }
    };

    const handleBlock = async (e) => {
        e.preventDefault();
        const type = e.target.type.value;
        const value = e.target.value.value;
        const reason = e.target.reason.value;
        try {
            await api.post('/security/block', { type, value, reason });
            e.target.reset();
            fetchData();
        } catch (err) { alert(err.response?.data?.msg || "Block Failed"); }
    };

    const handleWalletLock = async (userId) => {
        const reason = prompt("Reason for locking wallet:");
        if(!reason) return;
        try {
            await api.post('/security/wallet/lock', { userId, reason });
            alert("Wallet Locked");
            fetchData();
        } catch (err) { alert("Lock Failed"); }
    }

    const renderAuth = () => (
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                 <h3 className="font-bold mb-4 flex items-center gap-2"><Key className="text-yellow-400" size={18} /> OTP Activity Stream</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-white/40 border-b border-white/5">
                            <tr>
                                <th className="p-3">Time</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Attempts</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {authData.map(otp => (
                                <tr key={otp._id} className="hover:bg-white/5">
                                    <td className="p-3">{new Date(otp.createdAt).toLocaleTimeString()}</td>
                                    <td className="p-3">{otp.email}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${otp.attempts > 3 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {otp.attempts > 3 ? 'Flagged' : 'Normal'}
                                        </span>
                                    </td>
                                    <td className="p-3">{otp.attempts}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );

    const renderWallet = () => (
        <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><CreditCard className="text-blue-400" size={18} /> Wallet Security Controls</h3>
                <div className="flex gap-4 mb-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex-1">
                        <h4 className="font-bold text-red-400 mb-2">Emergency Wallet Lock</h4>
                        <p className="text-xs text-white/50 mb-3">Instantly freeze funds for suspicious user ID.</p>
                        <div className="flex gap-2">
                            <input id="lockUserId" type="text" placeholder="User ID..." className="bg-black/20 border border-white/10 rounded px-3 py-1 text-sm flex-1" />
                            <button 
                                onClick={() => handleWalletLock(document.getElementById('lockUserId').value)}
                                className="bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-sm font-bold"
                            >
                                LOCK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBlocklist = () => (
         <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Ban className="text-red-400" size={18} /> Add to Blocklist</h3>
                <form onSubmit={handleBlock} className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs text-white/50 mb-1">Type</label>
                        <select name="type" className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white">
                            <option value="IP">IP Address</option>
                            <option value="EMAIL">Email Address</option>
                            <option value="USER_ID">User ID</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-white/50 mb-1">Value</label>
                        <input name="value" type="text" placeholder="192.168.x.x or email@..." className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm" required />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-white/50 mb-1">Reason</label>
                        <input name="reason" type="text" placeholder="e.g. DDOS attempt" className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm" required />
                    </div>
                    <button type="submit" className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded text-sm font-bold h-[38px]">BLOCK</button>
                </form>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-white/50 uppercase text-xs">
                        <tr>
                            <th className="p-4">Type</th>
                            <th className="p-4">Value</th>
                            <th className="p-4">Reason</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {blockList.map(item => (
                            <tr key={item._id} className="hover:bg-white/5">
                                <td className="p-4"><span className="bg-white/10 px-2 py-1 rounded text-xs font-bold">{item.type}</span></td>
                                <td className="p-4 font-mono text-white/80">{item.value}</td>
                                <td className="p-4 text-white/60">{item.reason}</td>
                                <td className="p-4 text-white/40">{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <button onClick={() => api.delete(`/security/block/${item._id}`).then(fetchData)} className="text-red-400 hover:text-red-300 text-xs font-bold">UNBLOCK</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </div>
    );

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header / Nav */}
            <div className="flex flex-wrap gap-2 pb-4 border-b border-white/10">
                <NavBtn active={activeSection === 'overview'} onClick={() => setActiveSection('overview')} icon={Shield} label="Overview" />
                <NavBtn active={activeSection === 'auth'} onClick={() => setActiveSection('auth')} icon={Key} label="Auth & OTP" />
                <NavBtn active={activeSection === 'wallet'} onClick={() => setActiveSection('wallet')} icon={CreditCard} label="Wallet Sec" />
                <NavBtn active={activeSection === 'logs'} onClick={() => setActiveSection('logs')} icon={FileText} label="Audit Logs" />
                <NavBtn active={activeSection === 'blocklist'} onClick={() => setActiveSection('blocklist')} icon={Ban} label="Blocklist" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {activeSection === 'overview' && renderOverview()}
                {activeSection === 'auth' && renderAuth()}
                {activeSection === 'wallet' && renderWallet()}
                {activeSection === 'blocklist' && renderBlocklist()}
                
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
