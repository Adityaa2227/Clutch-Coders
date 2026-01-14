import React, { useEffect, useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Clock, DollarSign, Activity, FileText } from 'lucide-react';

const History = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('transactions');
    const [transactions, setTransactions] = useState([]);
    const [usageLogs, setUsageLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (activeTab === 'transactions') {
                    const res = await api.get('/wallet/transactions');
                    setTransactions(res.data);
                } else {
                    const res = await api.get('/passes/usage');
                    setUsageLogs(res.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8 mt-10 space-y-8">
            {/* Header */}
            <div>
                 <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Clock className="text-blue-500" size={40} /> Transaction History
                 </h1>
                 <p className="text-slate-400 mt-2 text-lg">Track your financial movements and service usage.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-surface/50 border border-white/5 rounded-xl w-fit backdrop-blur-md">
                <button 
                    onClick={() => { setActiveTab('transactions'); setLoading(true); }}
                    className={`px-6 py-2.5 rounded-lg transition-all font-bold text-sm flex items-center gap-2 ${
                        activeTab === 'transactions' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                     <DollarSign size={16} /> Transactions
                </button>
                <button 
                    onClick={() => { setActiveTab('usage'); setLoading(true); }}
                    className={`px-6 py-2.5 rounded-lg transition-all font-bold text-sm flex items-center gap-2 ${
                        activeTab === 'usage' 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                     <Activity size={16} /> Usage Logs
                </button>
            </div>

            {/* Content */}
            <div className="glass-card p-0 overflow-hidden min-h-[500px] border border-white/5 bg-gradient-to-b from-surface/60 to-surface/40">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 gap-4">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p>Loading records...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'transactions' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {transactions.map(tx => (
                                            <tr key={tx._id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-6 text-sm font-mono text-slate-400 group-hover:text-white transition-colors">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                    <span className="ml-2 text-xs text-slate-600">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                                        tx.type === 'deposit' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                        tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-sm text-slate-300 font-medium">{tx.description || '-'}</td>
                                                <td className={`p-6 text-right font-mono font-bold text-lg ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {tx.type === 'deposit' ? '+' : '-'}₹{Math.abs(tx.amount)}
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                                        tx.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                        tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    }`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center p-20 text-slate-500">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="p-4 bg-white/5 rounded-full">
                                                            <FileText size={32} />
                                                        </div>
                                                        <p>No transactions found.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'usage' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Service</th>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                            <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Usage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {usageLogs.map(log => (
                                            <tr key={log._id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-6 text-sm font-mono text-slate-400 group-hover:text-white transition-colors">
                                                    {new Date(log.timestamp).toLocaleDateString()}
                                                    <span className="ml-2 text-xs text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                </td>
                                                <td className="p-6 font-bold text-white group-hover:text-blue-400 transition-colors">
                                                    {log.serviceId?.name || 'Unknown Service'}
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-xs uppercase font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">
                                                        {log.serviceId?.type}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className="font-mono text-purple-400 font-bold text-lg">-{log.amountUsed}</span>
                                                    <span className="text-xs text-slate-500 ml-1 uppercase font-bold">{log.serviceId?.unitName}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {usageLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center p-20 text-slate-500">
                                                     <div className="flex flex-col items-center gap-4">
                                                        <div className="p-4 bg-white/5 rounded-full">
                                                            <Activity size={32} />
                                                        </div>
                                                        <p>No usage logs found.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default History;
