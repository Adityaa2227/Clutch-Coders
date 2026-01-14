/**
 * @fileoverview User Support Portal
 * @description Main support interface for users to browse FAQs, manage tickets, and chat with support.
 * @path client/src/pages/Support.jsx
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';
import { Search, Plus, MessageSquare, ChevronRight, ChevronDown, Send, ArrowLeft, Info, CheckCircle, Clock } from 'lucide-react';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const Support = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [activeTab, setActiveTab] = useState('faq');
    const [faqs, setFaqs] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [toast, setToast] = useState({ message: null, type: 'success' });
    
    // Create Ticket State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', category: 'Other', description: '' });

    // Chat State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (socket && selectedTicket) {
            socket.emit('join_ticket', selectedTicket._id);
            
            socket.on('receive_message', (msg) => {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
            });

            socket.on('ticket_status_change', ({ status }) => {
                setSelectedTicket(prev => ({ ...prev, status }));
                setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, status } : t));
            });

            return () => {
                socket.off('receive_message');
                socket.off('ticket_status_change');
            };
        }
    }, [socket, selectedTicket]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchData = async () => {
        try {
            const [faqRes, ticketRes] = await Promise.all([
                api.get('/support/faqs'),
                api.get('/support/tickets')
            ]);
            setFaqs(faqRes.data);
            setTickets(ticketRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/support/tickets', newTicket);
            setTickets([res.data, ...tickets]);
            setIsCreateOpen(false);
            setNewTicket({ subject: '', category: 'Other', description: '' });
            setToast({ message: 'Ticket created successfully!', type: 'success' });
        } catch (err) {
            setToast({ message: 'Failed to create ticket', type: 'error' });
        }
    };

    const handleSelectTicket = async (ticket) => {
        setSelectedTicket(ticket);
        try {
            const res = await api.get(`/support/tickets/${ticket._id}`);
            setMessages(res.data.messages);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            // Optimistic update? No, wait for server response to ensure order
            const res = await api.post(`/support/tickets/${selectedTicket._id}/messages`, { text: newMessage });
            // Socket handles the update, but we can append own message immediately for speed if we prevent dupe
            // For now, let's rely on the socket response or API response
            // The API response returns the message. 
            // If we also listen to socket, we might duplicate. 
            // Usually sender doesn't need to listen to their own echo if API returns it.
            // But if we use 'emit to room', the sender gets it too? No, usually `broadcast.to` excludes sender.
            // My backend uses `io.to(room).emit`. This includes EVERYONE in the room.
            // So I should NOT append manually, just clear input.
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'open': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'in_progress': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'resolved': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'closed': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    };

    if (loading) return <div className="flex justify-center pt-20 text-slate-400">Loading Support...</div>;

    // Chat View
    if (selectedTicket) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-8 mt-4 h-[calc(100vh-100px)] flex flex-col">
                 <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4">
                    <ArrowLeft size={18} /> Back to Support
                 </button>

                 <div className="flex-1 glass-card flex flex-col overflow-hidden border border-white/10">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-3">
                                {selectedTicket.subject}
                                <span className={`text-xs px-2 py-0.5 rounded border uppercase ${getStatusColor(selectedTicket.status)}`}>
                                    {selectedTicket.status}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Ticket ID: {selectedTicket._id}</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                        {/* Initial Description as a pseudo-message */}
                        <div className="flex justify-end">
                            <div className="max-w-[80%] bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-sm p-3">
                                <p className="text-white text-sm">{selectedTicket.description}</p>
                                <div className="text-[10px] text-blue-200/50 mt-1 text-right">
                                    {new Date(selectedTicket.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>

                        {messages.map((msg, idx) => {
                            const isMe = msg.sender._id === user._id;
                            const isSystem = msg.sender.role === 'admin'; // Or check sender ID
                            
                            return (
                                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                                        : 'bg-white/10 text-slate-200 rounded-tl-sm'
                                    }`}>
                                        <p>{msg.text}</p>
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                                            {/* {msg.sender.name} •  */}
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    {selectedTicket.status !== 'closed' ? (
                        <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                            />
                            <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">
                                <Send size={20} />
                            </button>
                        </form>
                    ) : (
                        <div className="p-4 bg-white/5 border-t border-white/10 text-center text-slate-500 text-sm">
                            This ticket is closed. You can no longer reply.
                        </div>
                    )}
                 </div>
            </div>
        );
    }

    // Main Support Landing
    return (
        <div className="container mx-auto max-w-5xl px-4 py-8 mt-10">
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, message: null })} 
            />

            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Open Support Ticket">
                <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Subject</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                            value={newTicket.subject}
                            onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Category</label>
                        <select
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                            value={newTicket.category}
                            onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                        >
                            <option value="Payment">Payment & Billing</option>
                            <option value="Pass">Pass & Access</option>
                            <option value="Account">Account Issue</option>
                            <option value="Technical">Technical Bug</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1">Description</label>
                        <textarea
                            required
                            rows={4}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none resize-none"
                            value={newTicket.description}
                            onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold">
                            Submit Ticket
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Support Center</h1>
                <p className="text-slate-400">How can we help you today?</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-white/10 mb-8">
                <button 
                    onClick={() => setActiveTab('faq')}
                    className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'faq' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
                >
                    Frequently Asked Questions
                    {activeTab === 'faq' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />}
                </button>
                 <button 
                    onClick={() => setActiveTab('tickets')}
                    className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'tickets' ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
                >
                    My Tickets
                    {activeTab === 'tickets' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />}
                </button>
            </div>

            {activeTab === 'faq' ? (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all focus:bg-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-4">
                        {filteredFaqs.map((faq) => (
                            <div key={faq._id} className="glass-card p-6 hover:border-blue-500/30 transition-colors cursor-pointer group">
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors flex justify-between">
                                    {faq.question}
                                    <ChevronDown className="text-slate-500 group-hover:text-blue-400" size={20} />
                                </h3>
                                <p className="text-slate-400 leading-relaxed text-sm">
                                    {faq.answer}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-500/20 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Still need help?</h3>
                        <p className="text-slate-400 mb-6">Our support team is available 24/7 to assist you.</p>
                        <button 
                            onClick={() => { setActiveTab('tickets'); setIsCreateOpen(true); }}
                            className="bg-white text-black hover:bg-blue-50 px-6 py-3 rounded-xl font-bold transition-colors"
                        >
                            Open a Ticket
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                     <div className="flex justify-between items-center mb-6">
                         <h2 className="text-xl font-bold text-white">Your Tickets</h2>
                         <button 
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg shadow-blue-500/20"
                         >
                            <Plus size={18} /> New Ticket
                         </button>
                     </div>

                     <div className="space-y-3">
                        {tickets.length === 0 ? (
                            <div className="text-center py-20 text-slate-500">
                                <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No tickets found. Need help?</p>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div 
                                    key={ticket._id} 
                                    onClick={() => handleSelectTicket(ticket)}
                                    className="glass-card p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-2 h-12 rounded-full ${
                                            ticket.status === 'resolved' ? 'bg-blue-500' : 
                                            ticket.status === 'open' ? 'bg-green-500' : 'bg-slate-500'
                                        }`} />
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{ticket.subject}</h3>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{ticket.category}</span>
                                                <span>• ID: {ticket._id.slice(-6).toUpperCase()}</span>
                                                <span className="flex items-center gap-1"><Clock size={10} /> {new Date(ticket.lastMessageAt).toLocaleDateString()}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                        <ChevronRight className="text-slate-600 group-hover:text-white" />
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                </div>
            )}
        </div>
    );
};

export default Support;
