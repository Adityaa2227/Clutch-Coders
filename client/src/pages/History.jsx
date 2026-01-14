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
        <div className="space-y-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <Clock className="text-blue-400" /> History
            </h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10">
                <button 
                    onClick={() => { setActiveTab('transactions'); setLoading(true); }}
                    className={`pb-3 px-4 transition-all relative ${activeTab === 'transactions' ? 'text-blue-400 font-bold' : 'text-text-muted hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                         <DollarSign size={18} /> Transactions
                    </div>
                    {activeTab === 'transactions' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-1 bg-blue-400 rounded-t-full" />}
                </button>
                <button 
                    onClick={() => { setActiveTab('usage'); setLoading(true); }}
                    className={`pb-3 px-4 transition-all relative ${activeTab === 'usage' ? 'text-purple-400 font-bold' : 'text-text-muted hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                         <Activity size={18} /> Usage Logs
                    </div>
                    {activeTab === 'usage' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-1 bg-purple-400 rounded-t-full" />}
                </button>
            </div>

            {/* Content */}
            <div className="glass-card p-6 min-h-[400px]">
                {loading ? (
                    <div className="text-center py-20 text-text-muted">Loading records...</div>
                ) : (
                    <>
                        {activeTab === 'transactions' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-text-muted text-sm uppercase tracking-wider">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Description</th>
                                            <th className="p-4 text-right">Amount</th>
                                            <th className="p-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {transactions.map(tx => (
                                            <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-sm font-mono text-text-muted">
                                                    {new Date(tx.createdAt).toLocaleString()}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 
                                                        tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm">{tx.description || '-'}</td>
                                                <td className={`p-4 text-right font-mono font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {tx.type === 'deposit' ? '+' : '-'}{Math.abs(tx.amount)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`text-xs px-2 py-1 rounded border font-bold uppercase
                                                        ${tx.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                          tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                                        {tx.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center p-8 text-text-muted">No transactions found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'usage' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 text-text-muted text-sm uppercase tracking-wider">
                                            <th className="p-4">Timestamp</th>
                                            <th className="p-4">Service</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4 text-right">Usage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {usageLogs.map(log => (
                                            <tr key={log._id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-sm font-mono text-text-muted">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="p-4 font-bold">
                                                    {log.serviceId?.name || 'Unknown Service'}
                                                </td>
                                                <td className="p-4 text-sm text-text-muted capitalize">
                                                    {log.serviceId?.type}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-mono text-purple-400 font-bold">-{log.amountUsed}</span>
                                                    <span className="text-xs text-text-muted ml-1">{log.serviceId?.unitName}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {usageLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="text-center p-8 text-text-muted">No usage logs found.</td>
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
