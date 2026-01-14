import React, { useState, useEffect } from 'react';
import api from '../../../api';
import { 
    Search, 
    Filter, 
    Download, 
    ArrowUpRight, 
    ArrowDownLeft,
    CreditCard,
    AlertCircle,
    CheckCircle
} from 'lucide-react';

const TransactionMonitor = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/admin/transactions');
            setTransactions(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch transactions", err);
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = 
            tx._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filter === 'all' || tx.type === filter;

        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch(status) {
            case 'success': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getTypeIcon = (type) => {
        switch(type) {
            case 'deposit': return <ArrowDownLeft size={16} className="text-green-400" />;
            case 'purchase': return <ArrowUpRight size={16} className="text-blue-400" />; 
            case 'withdrawal': return <ArrowUpRight size={16} className="text-red-400" />;
            default: return <CreditCard size={16} className="text-slate-400" />;
        }
    };

    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) return;

        const headers = ["Transaction ID", "User Name", "Email", "Type", "Amount", "Status", "Date"];
        const rows = filteredTransactions.map(tx => [
            tx._id,
            tx.userId?.name || 'Unknown',
            tx.userId?.email || 'N/A',
            tx.type,
            tx.amount,
            tx.status,
            new Date(tx.createdAt).toLocaleString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `transactions_export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Transaction History
                    </h2>
                    <p className="text-text-muted text-sm mt-1">
                        Monitor all financial movements (Limited to last 500 records)
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors hover:border-white/20"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button 
                        onClick={fetchTransactions}
                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors"
                    >
                        <Search size={18} className="text-white" /> 
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search transaction ID, user name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                </div>
                <div className="flex gap-2 text-sm">
                    {['all', 'deposit', 'purchase', 'withdrawal'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                                filter === f 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Loading transactions...</td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No transactions found</td>
                                </tr>
                            ) : (
                                filteredTransactions.map(tx => (
                                    <tr key={tx._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 font-mono text-xs text-slate-500 select-all">
                                            {tx._id.substring(0, 8)}...
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-white">{tx.userId?.name || 'Unknown User'}</span>
                                                <span className="text-xs text-slate-500">{tx.userId?.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(tx.type)}
                                                <span className="capitalize text-sm">{tx.type}</span>
                                            </div>
                                        </td>
                                        <td className={`p-4 font-mono font-bold ${
                                            tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {tx.type === 'deposit' ? '+' : '-'}₹{Math.abs(tx.amount)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-sm text-slate-400">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionMonitor;
