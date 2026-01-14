import React, { useState, useEffect } from 'react';
import api from '../../../api';
import { Plus, Trash2, Eye, EyeOff, Edit, Box, AlertCircle, CheckCircle } from 'lucide-react';

const ServicesManager = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState(null);
    
    // New Service State
    const [newService, setNewService] = useState({
        name: '', description: '', type: 'usage', costPerUnit: '', unitName: ''
    });
    const [creating, setCreating] = useState(false);

    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        setStatusMsg(null);
        try {
            if (editingId) {
                // Update Existing
                const res = await api.put(`/services/${editingId}`, newService);
                setServices(services.map(s => s._id === editingId ? res.data : s));
                setStatusMsg({ type: 'success', text: 'Service Updated Successfully!' });
                setEditingId(null);
            } else {
                // Create New
                const res = await api.post('/services', newService);
                setServices([...services, res.data]);
                setStatusMsg({ type: 'success', text: 'Service Deployed Successfully!' });
            }
            setNewService({ name: '', description: '', type: 'usage', costPerUnit: '', unitName: '' });
        } catch (err) {
            console.error(err);
            setStatusMsg({ type: 'error', text: editingId ? 'Update Failed' : 'Deployment Failed' });
        } finally {
            setCreating(false);
        }
    };

    const handleEditClick = (service) => {
        setNewService({
            name: service.name,
            description: service.description || '',
            type: service.type,
            costPerUnit: service.costPerUnit,
            unitName: service.unitName
        });
        setEditingId(service._id);
        setStatusMsg(null);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewService({ name: '', description: '', type: 'usage', costPerUnit: '', unitName: '' });
        setStatusMsg(null);
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure you want to delete this service? This action cannot be undone.")) return;
        
        try {
            await api.delete(`/services/${id}`);
            setServices(services.filter(s => s._id !== id));
            setStatusMsg({ type: 'success', text: 'Service deleted' });
            if (editingId === id) cancelEdit();
        } catch (err) {
            console.error(err);
            setStatusMsg({ type: 'error', text: 'Delete failed' });
        }
    };

    const handleToggleActive = async (service) => {
        try {
            const res = await api.put(`/services/${service._id}`, { active: !service.active });
            setServices(services.map(s => s._id === service._id ? res.data : s));
        } catch (err) {
            console.error(err);
            setStatusMsg({ type: 'error', text: 'Update failed' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Box className="text-blue-400" /> Service Management
                    </h2>
                    <p className="text-text-muted text-sm">Deploy new services or manage existing inventory</p>
                </div>
            </div>

            {statusMsg && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {statusMsg.text}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Create/Edit Form */}
                <div className={`glass-card p-6 bg-surface border border-white/5 rounded-2xl h-fit transition-all ${editingId ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : ''}`}>
                    <h3 className="font-bold mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                             {editingId ? <Edit size={18} className="text-blue-400" /> : <Plus size={18} className="text-green-400" />}
                             {editingId ? 'Edit Service' : 'Deploy New Service'}
                        </span>
                        {editingId && (
                            <button onClick={cancelEdit} className="text-xs text-red-400 hover:underline">Cancel</button>
                        )}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Name</label>
                            <input 
                                type="text" 
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all"
                                placeholder="e.g. GPT-4 API"
                                value={newService.name}
                                onChange={e => setNewService({...newService, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Description</label>
                            <textarea 
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none h-20"
                                placeholder="Service description..."
                                value={newService.description}
                                onChange={e => setNewService({...newService, description: e.target.value})}
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Type</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none disabled:opacity-50"
                                    value={newService.type}
                                    onChange={e => setNewService({...newService, type: e.target.value})}
                                    disabled={!!editingId} // Type usually shouldn't change for data integrity
                                >
                                    <option value="usage">Per Usage</option>
                                    <option value="time">Time Based</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Unit Cost (₹)</label>
                                <input 
                                    type="number" 
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none"
                                    placeholder="10"
                                    value={newService.costPerUnit}
                                    onChange={e => setNewService({...newService, costPerUnit: e.target.value})}
                                />
                             </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted mb-1 uppercase">Unit Name</label>
                            <input 
                                type="text" 
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm outline-none"
                                placeholder="e.g. requests"
                                value={newService.unitName}
                                onChange={e => setNewService({...newService, unitName: e.target.value})}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={creating}
                            className={`w-full py-3 font-bold rounded-xl transition-colors disabled:opacity-50 ${editingId ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                            {creating ? (editingId ? 'Updating...' : 'Deploying...') : (editingId ? 'Update Agent' : 'Deploy Service')}
                        </button>
                    </form>
                </div>

                {/* Services List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading services...</div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 bg-surface/50 rounded-2xl border border-dashed border-slate-700">
                            No services active. Deploy one to get started.
                        </div>
                    ) : (
                        services.map(service => (
                            <div key={service._id} className={`p-4 rounded-xl bg-surface border ${service.active ? 'border-white/5' : 'border-red-500/20 bg-red-500/5'} flex justify-between items-center group hover:border-blue-500/30 transition-all ${editingId === service._id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${service.active ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/50 text-slate-500'}`}>
                                        <Box size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-bold ${!service.active && 'text-slate-500 decoration-slate-600 line-through'}`}>{service.name}</h3>
                                            {!service.active && <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Unavailable</span>}
                                        </div>
                                        <p className="text-sm text-text-muted mt-0.5">{service.description}</p>
                                        <div className="mt-2 flex gap-3 text-xs font-mono text-slate-500">
                                            <span>TYPE: {service.type.toUpperCase()}</span>
                                            <span>COST: ₹{service.costPerUnit}/{service.unitName}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleEditClick(service)}
                                        disabled={!!editingId && editingId !== service._id}
                                        className={`p-2 rounded-lg transition-colors hover:bg-white/10 text-blue-400 ${editingId && editingId !== service._id ? 'opacity-20' : ''}`}
                                        title="Edit Service"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleActive(service)}
                                        className={`p-2 rounded-lg transition-colors ${service.active ? 'hover:bg-red-500/10 hover:text-red-400 text-slate-400' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                        title={service.active ? "Disable Service" : "Enable Service"}
                                    >
                                        {service.active ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(service._id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-400 transition-colors"
                                        title="Delete Service"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServicesManager;
