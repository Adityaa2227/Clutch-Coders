import React, { useState, useEffect } from 'react';
import api from '../../../api';
import { 
    Search, 
    User, 
    Shield, 
    Clock, 
    CheckCircle, 
    XCircle,
    Mail
} from 'lucide-react';

const UserMonitor = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, active

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = 
            filter === 'all' ? true :
            filter === 'active' ? user.isActive :
            filter === 'admin' ? user.role === 'admin' : true;

        return matchesSearch && matchesFilter;
    });

    const activeCount = users.filter(u => u.isActive).length;

    const [selectedUserId, setSelectedUserId] = useState(null);

    return (
        <div className="space-y-6 relative">
            {/* Header & Filter Section... (kept same structure implicitly by wrapping) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        User Management
                    </h2>
                    <p className="text-text-muted text-sm mt-1">
                        Total Users: <span className="text-white font-bold">{users.length}</span> | 
                        Currently Active: <span className="text-green-400 font-bold">{activeCount}</span>
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={fetchUsers}
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
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                </div>
                <div className="flex gap-2 text-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'active' ? 'bg-green-600/30 text-green-400 border border-green-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Active Now
                    </button>
                    <button
                        onClick={() => setFilter('admin')}
                        className={`px-4 py-2 rounded-lg transition-colors ${filter === 'admin' ? 'bg-purple-600/30 text-purple-400 border border-purple-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                        Admins
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <div 
                        key={user._id} 
                        onClick={() => setSelectedUserId(user._id)}
                        className="glass-card p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 cursor-pointer transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-4 relative">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                    user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{user.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className={`px-2 py-0.5 rounded-full border ${
                                            user.role === 'admin' ? 'border-purple-500/30 bg-purple-500/10 text-purple-300' : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                                        }`}>
                                            {user.role}
                                        </span>
                                        {user.isActive && (
                                            <span className="flex items-center gap-1 text-green-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                Online
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm text-slate-400 relative">
                            <div className="flex items-center gap-3">
                                <Mail size={16} />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock size={16} />
                                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield size={16} />
                                <span>Balance: ₹{user.walletBalance || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedUserId && (
                <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
            )}
        </div>
    );
};

const UserDetailModal = ({ userId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/admin/users/${userId}`);
            setData(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSuspend = async () => {
        if (!confirm(`Are you sure you want to ${data.user.status === 'suspended' ? 'activate' : 'suspend'} this user?`)) return;
        try {
            await api.put(`/admin/users/${userId}/suspend`);
            fetchData(); // Refresh data
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const calculateTimeLeft = (expiresAt) => {
        if (!expiresAt) return 'Lifetime';
        const diff = new Date(expiresAt) - new Date();
        if (diff <= 0) return 'Expired';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 30) return `${Math.floor(days / 30)}mo ${days % 30}d left`;
        if (days > 0) return `${days}d ${hours}h left`;
        return `${hours}h ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))}m left`;
    };

    if (!userId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {loading ? (
                    <div className="p-10 text-center">Loading User Data...</div>
                ) : !data ? (
                    <div className="p-10 text-center text-red-500">Failed to load data</div>
                ) : (
                    <div className="p-8 space-y-8">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                    {data.user.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        {data.user.name}
                                        {data.user.status === 'suspended' && (
                                            <span className="px-2 py-0.5 rounded text-xs bg-red-500 text-white uppercase font-bold tracking-wider">Suspended</span>
                                        )}
                                    </h2>
                                    <div className="text-slate-400 text-sm flex gap-3">
                                        <span>{data.user.email}</span>
                                        <span>•</span>
                                        <span className="capitalize">{data.user.role}</span>
                                    </div>
                                    <div className="mt-2 text-xl font-mono text-green-400 font-bold">
                                        Balance: ₹{data.user.walletBalance}
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XCircle size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Active Passes */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Shield size={20} className="text-purple-400" />
                                    Active Passes ({data.activePasses.length})
                                </h3>
                                {data.activePasses.length === 0 ? (
                                    <div className="p-4 bg-white/5 rounded-xl text-center text-slate-500 text-sm">No active passes</div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.activePasses.map(pass => {
                                            const isUsageBased = pass.serviceId?.type === 'usage';
                                            return (
                                                <div key={pass._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold text-sm text-white">{pass.serviceId?.name}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {pass.expiresAt 
                                                                ? `Expires: ${new Date(pass.expiresAt).toLocaleDateString()}`
                                                                : 'Lifetime Access'
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-mono text-purple-300">
                                                            {isUsageBased 
                                                                ? `${pass.remainingAmount}/${pass.totalLimit} ${pass.serviceId?.unitName || ''}` 
                                                                : calculateTimeLeft(pass.expiresAt)
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Recent Transactions */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Clock size={20} className="text-blue-400" />
                                    Recent Transactions
                                </h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {data.transactions.length === 0 ? (
                                        <div className="p-4 bg-white/5 rounded-xl text-center text-slate-500 text-sm">No transactions found</div>
                                    ) : (
                                        data.transactions.map(tx => (
                                            <div key={tx._id} className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 text-sm transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${tx.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className="capitalize text-slate-300">{tx.type}</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <span className={`font-mono ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {tx.type === 'deposit' ? '+' : '-'}₹{Math.abs(tx.amount)}
                                                    </span>
                                                    <span className="text-slate-500 text-xs w-20 text-right">{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
                            <button 
                                onClick={handleSuspend}
                                className={`px-4 py-2 border rounded-lg text-sm font-bold transition-colors ${
                                    data.user.status === 'suspended' 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                }`}
                            >
                                {data.user.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                            </button>
                            <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 text-sm font-bold">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMonitor;
