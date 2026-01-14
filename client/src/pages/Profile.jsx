
import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Save, Shield, Lock } from 'lucide-react';
import Toast from '../components/Toast';

import Modal from '../components/Modal';

const Profile = () => {
    const { user: authUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ message: null, type: 'success' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/user');
            setFormData({
                name: res.data.name,
                email: res.data.email
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            showToast('Failed to load profile', 'error');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/auth/profile', formData);
            showToast('Profile updated successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.msg || 'Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showToast("New passwords do not match", "error");
            return;
        }
        
        setSaving(true);
        try {
            await api.put('/auth/profile', {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            showToast('Password changed successfully!', 'success');
            setIsPasswordModalOpen(false);
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.msg || 'Password update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh] text-slate-500">Loading Profile...</div>;

    return (
        <div className="container mx-auto max-w-5xl px-4 py-8 mt-10 space-y-8">
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, message: null })} 
            />

            <Modal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)}
                title="Change Password"
            >
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input 
                                type="password"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                                value={passwords.current}
                                onChange={e => setPasswords({...passwords, current: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">New Password</label>
                        <div className="relative">
                             <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input 
                                type="password"
                                required
                                minLength={6}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                                value={passwords.new}
                                onChange={e => setPasswords({...passwords, new: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Confirm New Password</label>
                        <div className="relative">
                             <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input 
                                type="password"
                                required
                                minLength={6}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-purple-500 outline-none transition-colors"
                                value={passwords.confirm}
                                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={() => setIsPasswordModalOpen(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg shadow-purple-500/20"
                        >
                            {saving ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Header */}
            <div>
                 <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                    <User className="text-blue-500" size={40} /> Account Settings
                 </h1>
                 <p className="text-slate-400 mt-2 text-lg">Manage your personal information and security preferences.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Identity Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                        
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-4xl font-bold text-white mb-4 border border-white/10 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                            {formData.name.charAt(0).toUpperCase()}
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-1">{formData.name}</h2>
                        <p className="text-blue-400 text-sm font-mono mb-4">{formData.email}</p>

                        <div className="w-full pt-4 border-t border-white/5 space-y-3">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-400">Account Role</span>
                                 <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-bold uppercase border border-blue-500/20">{authUser?.role}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-400">Status</span>
                                 <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold uppercase border border-green-500/20">Active</span>
                             </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-purple-500">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                            <Shield size={18} className="text-purple-400"/> Security
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Your account is secured with standard encryption. 
                        </p>
                        <button 
                            onClick={() => setIsPasswordModalOpen(true)}
                            className="text-xs text-purple-400 font-bold uppercase tracking-wider hover:text-white transition-colors"
                        >
                            Change Password
                        </button>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="md:col-span-2">
                    <div className="glass-card p-8 bg-surface/40">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">Personal Details</h3>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:bg-blue-500/5 outline-none transition-all placeholder:text-slate-600"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                                        <input
                                            type="email"
                                            required
                                            disabled
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-400 cursor-not-allowed outline-none"
                                            value={formData.email}
                                            title="Email cannot be changed"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 text-right">To change email, contact support.</p>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>Updating...</>
                                    ) : (
                                        <>
                                            <Save size={18} /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
