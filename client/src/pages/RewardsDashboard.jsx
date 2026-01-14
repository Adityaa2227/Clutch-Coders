import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion } from 'framer-motion';
import { Gift, Copy, Share2, Wallet, Award, ArrowRight, CheckCircle } from 'lucide-react';

const RewardsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [referralCodeInput, setReferralCodeInput] = useState('');
    const [referralStatus, setReferralStatus] = useState(null);

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            const res = await api.get('/rewards/my-rewards');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(stats?.referralCode);
        // Show toast (simplified alert for now)
        alert('Referral Code Copied!');
    };

    const claimReferral = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/rewards/claim-referral', { code: referralCodeInput });
            setReferralStatus({ success: true, msg: res.data.msg });
            fetchRewards();
        } catch (err) {
            setReferralStatus({ success: false, msg: err.response?.data?.msg || 'Invalid Code' });
        }
    };

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8 mt-20">
            {/* Header */}
            <div className="mb-8">
                 <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                    <Gift className="text-pink-500" size={32} /> Rewards & Referrals
                 </h1>
                 <p className="text-slate-400 mt-2">Earn cashback on passes and invite friends to get bonuses.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-green-500/10 to-transparent"
                >
                    <div className="p-3 bg-green-500/20 rounded-xl w-fit mb-4 text-green-400">
                        <Wallet size={24} />
                    </div>
                    <div className="text-slate-400 text-sm font-medium">Wallet Balance</div>
                    <div className="text-3xl font-bold text-white mt-1">₹{stats?.walletBalance || 0}</div>
                </motion.div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-pink-500/10 to-transparent"
                >
                    <div className="p-3 bg-pink-500/20 rounded-xl w-fit mb-4 text-pink-400">
                        <Award size={24} />
                    </div>
                    <div className="text-slate-400 text-sm font-medium">Total Cashback</div>
                    <div className="text-3xl font-bold text-white mt-1">₹{stats?.totalCashback || 0}</div>
                </motion.div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent"
                >
                    <div className="p-3 bg-purple-500/20 rounded-xl w-fit mb-4 text-purple-400">
                        <Share2 size={24} />
                    </div>
                    <div className="text-slate-400 text-sm font-medium">Referral Earnings</div>
                    <div className="text-3xl font-bold text-white mt-1">₹{stats?.totalReferralRewards || 0}</div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Referral Code Section */}
                <div className="glass-card p-8 rounded-2xl border border-white/10 relative overflow-hidden">
                     {/* Decor */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[50px] pointer-events-none" />

                     <h2 className="text-xl font-bold text-white mb-4">Your Referral Code</h2>
                     <p className="text-slate-400 text-sm mb-6">
                        Share this code with friends. They get access to exclusive passes, and you get <span className="text-white font-bold">₹5</span> after their first purchase!
                     </p>

                     <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/10 border-dashed">
                        <div className="flex-1 text-center font-mono text-2xl font-bold text-purple-400 tracking-widest">
                            {stats?.referralCode || '----'}
                        </div>
                        <button 
                             onClick={copyCode}
                             className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Copy size={18} /> <span className="hidden sm:inline">Copy</span>
                        </button>
                     </div>
                </div>

                {/* Claim Referral Section */}
                <div className="glass-card p-8 rounded-2xl border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-4">Have a Code?</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        Enter a friend's referral code to link your accounts.
                    </p>

                    <form onSubmit={claimReferral} className="relative">
                        <input 
                            type="text"
                            placeholder="Enter Code (e.g. A1B2)"
                            className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-purple-500/50 outline-none text-white transition-all uppercase placeholder:normal-case"
                            value={referralCodeInput}
                            onChange={e => setReferralCodeInput(e.target.value)}
                        />
                         <button 
                             type="submit"
                             className="absolute right-2 top-2 bottom-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </form>
                    {referralStatus && (
                        <div className={`mt-4 text-sm flex items-center gap-2 ${referralStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                            {referralStatus.success ? <CheckCircle size={16} /> : null} 
                            {referralStatus.msg}
                        </div>
                    )}
                </div>
            </div>

            {/* Referrals List */}
            {stats?.referrals?.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-white mb-4">Your Referrals</h3>
                    <div className="bg-surface/30 rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/5 text-slate-300">
                                <tr>
                                    <th className="p-4 font-medium">User</th>
                                    <th className="p-4 font-medium">Date Joined</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Reward</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.referrals.map(ref => (
                                    <tr key={ref._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-white font-medium">{ref.refereeId?.name}</td>
                                        <td className="p-4">{new Date(ref.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                ref.status === 'completed' 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {ref.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-white">
                                            {ref.status === 'completed' ? `+₹${ref.rewardAmount}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reward History List */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-4">Cashback & Reward History</h3>
                {stats?.rewardHistory?.length > 0 ? (
                    <div className="bg-surface/30 rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/5 text-slate-300">
                                <tr>
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Description</th>
                                    <th className="p-4 font-medium">Type</th>
                                    <th className="p-4 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.rewardHistory.map(tx => (
                                    <tr key={tx._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="p-4">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</td>
                                        <td className="p-4 text-white font-medium">{tx.description}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs capitalize ${
                                                tx.type === 'cashback' 
                                                ? 'bg-pink-500/20 text-pink-400' 
                                                : 'bg-purple-500/20 text-purple-400'
                                            }`}>
                                                {tx.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono text-green-400 font-bold">
                                            +₹{tx.amount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 bg-surface/30 rounded-xl border border-white/5 text-slate-500">
                        No rewards earned yet. Buy a pass to get started!
                    </div>
                )}
            </div>
        </div>
    );
};

export default RewardsDashboard;
