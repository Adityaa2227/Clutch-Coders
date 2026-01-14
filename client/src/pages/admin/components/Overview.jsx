import React, { useEffect, useState } from 'react';
import api from '../../../api';
import { useSocket } from '../../../context/SocketContext';
import { DollarSign, Users, Ticket, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Overview = ({ onViewAll }) => {
    const socket = useSocket();
    const [stats, setStats] = useState({
        revenue: 0,
        activeUsers: 0,
        activePasses: 0,
        liveServices: 0,
        failedTransactions: 0
    });
    const [recentTx, setRecentTx] = useState([]);
    
    // Graph State
    const [graphData, setGraphData] = useState([]);
    const [activeRange, setActiveRange] = useState('24h');

    useEffect(() => {
        fetchStats(activeRange);
    }, [activeRange]);

    useEffect(() => {
        if (!socket) return;
        socket.on('payment_success', (tx) => {
            setStats(prev => ({ ...prev, revenue: prev.revenue + tx.amount }));
            setRecentTx(prev => [tx, ...prev.slice(0, 4)]);
            // Live graph update is complex with buckets, trigger refetch for simplicity
            fetchStats(activeRange); 
        });
        socket.on('payment_failed', () => {
            setStats(prev => ({ ...prev, failedTransactions: prev.failedTransactions + 1 }));
        });
        return () => {
            socket.off('payment_success');
            socket.off('payment_failed');
        };
    }, [socket, activeRange]);

    const fetchStats = async (range) => {
        try {
            const res = await api.get(`/admin/stats?range=${range}`);
            setStats({
                revenue: res.data.revenue || 0,
                activeUsers: res.data.activeUsers || 0,
                activePasses: res.data.activePasses || 0,
                liveServices: res.data.liveServices || 0,
                failedTransactions: res.data.failedTransactions || 0
            });
            setRecentTx(res.data.recentTransactions || []);
            if (res.data.revenueTrend) {
                setGraphData(res.data.revenueTrend);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Revenue" 
                    value={`₹${stats.revenue.toLocaleString()}`} 
                    icon={DollarSign} 
                    color="green"
                    trend="+12.5% vs yesterday"
                />
                <StatCard 
                    title="Active Users" 
                    value={stats.activeUsers} 
                    icon={Users} 
                    color="blue"
                    trend="+5 new today"
                />
                <StatCard 
                    title="Active Passes" 
                    value={stats.activePasses} 
                    icon={Ticket} 
                    color="purple"
                    trend="85% utilization"
                />
                 <StatCard 
                    title="Failed Payments" 
                    value={stats.failedTransactions} 
                    icon={Activity} 
                    color="red"
                     trend="Requires Attention"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Chart */}
                <div className="lg:col-span-2 glass-card p-6 bg-surface border border-white/5 rounded-2xl flex flex-col">
                    <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                        <span>Revenue Trends (Live)</span>
                        <div className="flex gap-2">
                             {['1h', '24h', '7d'].map(range => (
                                 <button 
                                    key={range}
                                    onClick={() => setActiveRange(range)}
                                    className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-colors ${activeRange === range ? 'bg-blue-500 text-white' : 'bg-white/5 hover:bg-white/10'}`}
                                 >
                                    {range}
                                 </button>
                             ))}
                        </div>
                    </h3>
                    <div style={{ height: 300, width: '100%', minHeight: 300 }}>
                        {graphData && graphData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Recent Transactions Feed */}
                <div className="glass-card p-6 bg-surface border border-white/5 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6">Recent Transactions</h3>
                    <div className="space-y-4">
                        {recentTx.length === 0 ? (
                            <div className="text-center text-text-muted py-10">No transactions</div>
                        ) : (
                            recentTx.slice(0, 5).map(tx => {
                                const isPositive = tx.type === 'deposit' && tx.status === 'success';
                                
                                return (
                                <div key={tx._id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            <DollarSign size={14} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">{tx.userId?.name || 'User'}</div>
                                            <div className="text-[10px] text-slate-400">
                                                <span className="uppercase font-bold mr-1 opacity-75">{tx.type}</span>
                                                {new Date(tx.createdAt).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                            {isPositive ? '+' : '-'}₹{tx.amount}
                                        </div>
                                        <div className="text-[10px] text-slate-500 capitalize">{tx.status}</div>
                                    </div>
                                </div>
                            )})
                        )}
                    </div>
                    <button 
                        onClick={onViewAll}
                        className="w-full mt-4 py-3 text-sm text-center text-blue-400 hover:text-blue-300 border border-blue-500/20 rounded-xl hover:bg-blue-500/10 transition-all"
                    >
                        View All Log
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const colors = {
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    return (
        <div className="glass-card p-6 bg-surface border border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/10 transition-all">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500`}>
                <Icon size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon size={20} />
                </div>
                <span className="text-text-muted text-sm font-medium">{title}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{value}</div>
            {trend && (
                <div className="text-xs text-text-muted flex items-center gap-1">
                    {trend.includes('Requires') ? <TrendingDown size={12} className="text-red-400" /> : <TrendingUp size={12} className="text-green-400" />}
                    {trend}
                </div>
            )}
        </div>
    );
};

export default Overview;
