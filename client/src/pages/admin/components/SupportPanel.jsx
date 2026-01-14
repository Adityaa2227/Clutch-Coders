import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api';
import { useSocket } from '../../../context/SocketContext';
import { Search, Filter, MessageSquare, CheckCircle, XCircle, Send, Clock, User, AlertCircle } from 'lucide-react';
import Toast from '../../../components/Toast';

const SupportPanel = () => {
    const socket = useSocket();
    const [tickets, setTickets] = useState([]);
    const [filter, setFilter] = useState('open'); // open, resolved, all
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: null, type: 'success' });
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTickets();
        
        if (socket) {
             socket.emit('join_admin_notifications');
             
             socket.on('new_ticket', ({ ticket }) => {
                 setTickets(prev => [ticket, ...prev]);
                 playNotificationSound();
             });

             socket.on('receive_message', (msg) => {
                 // Update message list if looking at this ticket
                 // OR update "unread" status logic (complex, skip for now)
                 if (selectedTicket && msg.ticket === selectedTicket._id) {
                     setMessages(prev => [...prev, msg]);
                     scrollToBottom();
                 }
                 // If not selected, maybe highlight the ticket in list (future)
             });

             return () => {
                 socket.off('new_ticket');
                 socket.off('receive_message');
             };
        }
    }, [socket, selectedTicket]);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket._id);
            if (socket) socket.emit('join_ticket', selectedTicket._id);
        }
    }, [selectedTicket]);

    const playNotificationSound = () => {
        // Simple beep
        // const audio = new Audio('/notification.mp3');
        // audio.play().catch(e => console.log(e));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTickets = async () => {
        try {
            const res = await api.get('/support/tickets?status=' + (filter === 'all' ? '' : filter));
            setTickets(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    // Re-fetch when filter changes
    useEffect(() => {
        setLoading(true);
        fetchTickets(); 
    }, [filter]);

    const fetchMessages = async (ticketId) => {
        try {
            const res = await api.get(`/support/tickets/${ticketId}`);
            setMessages(res.data.messages);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if(!reply.trim()) return;

        try {
             await api.post(`/support/tickets/${selectedTicket._id}/messages`, { text: reply });
             setReply('');
             // Socket update handles UI
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusChange = async (status) => {
        try {
            const res = await api.put(`/support/tickets/${selectedTicket._id}/status`, { status });
            setToast({ message: `Ticket marked as ${status}`, type: 'success' });
            setSelectedTicket(prev => ({ ...prev, status }));
            setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, status } : t));
        } catch (err) {
            setToast({ message: 'Failed to update status', type: 'error' });
        }
    };

    const getPriorityColor = (p) => {
        switch(p) {
            case 'high': return 'text-red-400 border-red-500/30 bg-red-500/10';
            case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
            default: return 'text-slate-400 border-white/10 bg-white/5';
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({...toast, message: null})} />

            {/* Ticket List */}
            <div className="w-1/3 flex flex-col glass-card border-none bg-surface/50">
                <div className="p-4 border-b border-white/5 flex gap-2 overflow-x-auto">
                    {['open', 'in_progress', 'resolved', 'closed', 'all'].map(f => (
                         <button
                            key={f}
                            onClick={() => { setFilter(f); setSelectedTicket(null); }}
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors whitespace-nowrap ${
                                filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                         >
                            {f.replace('_', ' ')}
                         </button>
                    ))}
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? <div className="text-center p-4 text-slate-500">Loading...</div> : 
                     tickets.length === 0 ? <div className="text-center p-8 text-slate-500">No tickets found</div> : (
                        tickets.map(ticket => (
                            <div 
                                key={ticket._id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                    selectedTicket?._id === ticket._id 
                                    ? 'bg-blue-600/10 border-blue-500/50' 
                                    : 'bg-black/20 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{new Date(ticket.lastMessageAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className={`font-bold text-sm mb-1 line-clamp-1 ${selectedTicket?._id === ticket._id ? 'text-blue-400' : 'text-white'}`}>
                                    {ticket.subject}
                                </h4>
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>{ticket.user.name}</span>
                                    <span>{ticket.category}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-card border-none bg-surface/50 flex flex-col relative overflow-hidden">
                {selectedTicket ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <div>
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    {selectedTicket.subject}
                                    <span className={`text-xs px-2 py-0.5 rounded border uppercase ${
                                        selectedTicket.status === 'open' ? 'text-green-400 border-green-500/30' : 'text-slate-400 border-white/10'
                                    }`}>{selectedTicket.status}</span>
                                </h3>
                                <p className="text-sm text-slate-400 flex items-center gap-2">
                                    <User size={12} /> {selectedTicket.user.name} ({selectedTicket.user.email})
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                                    <button 
                                        onClick={() => handleStatusChange('resolved')}
                                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-green-500/30 transition-colors"
                                    >
                                        <CheckCircle size={16} /> Mark Resolved
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleStatusChange('closed')}
                                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-500/30 transition-colors"
                                >
                                    <XCircle size={16} /> Close
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10">
                            <div className="flex justify-start">
                                <div className="max-w-[80%] bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl rounded-tl-none">
                                    <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-xs uppercase">
                                        <AlertCircle size={12} /> Initial Request
                                    </div>
                                    <p className="text-slate-200 text-sm">{selectedTicket.description}</p>
                                </div>
                            </div>
                            
                            {messages.map((msg, idx) => {
                                const isAdmin = msg.sender.role === 'admin';
                                return (
                                    <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                                            isAdmin 
                                            ? 'bg-purple-600 text-white rounded-tr-sm shadow-lg shadow-purple-500/10' 
                                            : 'bg-surface border border-white/10 text-slate-200 rounded-tl-sm'
                                        }`}>
                                            <p>{msg.text}</p>
                                            <div className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-purple-200' : 'text-slate-500'}`}>
                                                 {new Date(msg.createdAt).toLocaleTimeString()} {isAdmin && '• You'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleReply} className="p-4 border-t border-white/5 bg-surface flex gap-2">
                             <input
                                type="text"
                                placeholder="Type a reply..."
                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-purple-500 outline-none"
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                             />
                             <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-xl transition-colors">
                                 <Send size={20} />
                             </button>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <MessageSquare size={64} className="opacity-20 mb-4" />
                        <p>Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportPanel;
