
import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Save, Shield } from 'lucide-react';
import Toast from '../components/Toast';

const Profile = () => {
    const { user: authUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
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
            // We fetch fresh data from server instead of relying solely on context
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
            const res = await api.put('/auth/profile', formData);
            showToast('Profile updated successfully!', 'success');
            // Optionally update context if needed, but for now we trust the refresh on next load or manual
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.msg || 'Update failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-text-muted">Loading Profile...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, message: null })} 
            />

            <div className="flex items-center gap-3 mb-8">
                <Shield className="text-blue-500 w-8 h-8" />
                <h1 className="text-3xl font-bold">My Profile</h1>
            </div>

            <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center text-3xl font-bold text-blue-400 border border-blue-500/30">
                        {formData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{formData.name}</h2>
                        <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded border border-purple-500/20 uppercase font-bold tracking-wider">
                            {authUser?.role} Account
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-text-muted mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-text-muted" size={18} />
                            <input
                                type="text"
                                required
                                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:border-blue-500 outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-text-muted mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-text-muted" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 focus:border-blue-500 outline-none transition-all"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary w-full py-3 flex justify-center items-center gap-2 text-lg"
                        >
                            {saving ? 'Saving...' : (
                                <>
                                    <Save size={20} /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
