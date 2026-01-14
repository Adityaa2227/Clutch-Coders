import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ServiceDemo = () => {
    const { id } = useParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    
    // For realtime balance updates
    const socket = useSocket();
    const [timeLeft, setTimeLeft] = useState(null);
    const [currentBalance, setCurrentBalance] = useState(null);

    // Chat State
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMsg.trim()) return;

        const userText = inputMsg;
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setInputMsg('');
        setLoading(true);
        setError(null);

        try {
            // Deduct Logic: Hit the endpoint with PROMPT
            const res = await api.post(`/access/${id}`, { prompt: userText, amount: 1 });
            
            const aiResponseText = res.data.data?.response || `Core API Response: Processed request successfully. \n(Usage Deducted: 1 ${service.unitName})`;
            
            setMessages(prev => [...prev, { role: 'ai', text: aiResponseText }]);
            
            if (res.data.remainingAmount !== undefined && service.type !== 'time') {
                setCurrentBalance(res.data.remainingAmount);
            }
            setLoading(false);

        } catch (err) {
            console.error(err);
            setLoading(false);
            setError(err.response?.data?.msg || "Insufficient balance or network error");
            setMessages(prev => [...prev, { role: 'ai', text: "Error: Could not process request. Please check your balance." }]);
        }
    };

    useEffect(() => {
        // Fetch Service Metadata
        api.get(`/services/${id}`).then(res => setService(res.data));
        
        // Fetch Initial Balance / Active Pass
        api.get('/passes/my-passes').then(res => {
            const myPasses = res.data;
            const activePass = myPasses.find(p => (p.serviceId._id || p.serviceId) === id && p.status === 'active');
            
            if (activePass) {
                // Determine logic based on service type
                const type = activePass.serviceId.type || 'usage';

                if (type === 'time') {
                     // TIME BASED: Calculate Difference
                     const expiry = new Date(activePass.expiresAt);
                     const updateTimer = () => {
                         const now = new Date();
                         const diff = expiry - now;
                         if (diff <= 0) {
                             setCurrentBalance("Expired");
                             setTimeLeft(0);
                             setError("Pass expired. Please renew.");
                         } else {
                             const hours = Math.floor(diff / (1000 * 60 * 60));
                             const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                             const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                             setCurrentBalance(`${hours}h ${minutes}m ${seconds}s`);
                             setTimeLeft(diff);
                         }
                     };
                     updateTimer(); // Initial run
                     const interval = setInterval(updateTimer, 1000);
                     return () => clearInterval(interval);
                } else {
                     // USAGE BASED
                     setCurrentBalance(activePass.remainingAmount);
                }

            } else {
                setCurrentBalance(0);
                setError("No active pass found. Please buy one from Marketplace.");
            }
        });
    }, [id]);

    useEffect(() => {
        if (!socket || !service || service.type === 'time') return; // Sockets only for usage updates
        
        socket.on('usage_update', (data) => {
            if (data.serviceId === id) {
                setCurrentBalance(data.remainingAmount);
                if (data.remainingAmount <= 0) {
                     setError("Pass exhausted. Please top up.");
                }
            }
        });
        return () => socket && socket.off('usage_update');
    }, [id, socket, service]);

    const handleExecute = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Send empty object body to ensure Content-Type application/json is set
            const res = await api.post(`/access/${id}`, {});
            // Simulate network delay for effect
            setTimeout(() => {
                setResult(res.data);
                if (res.data.remainingAmount !== undefined && service.type !== 'time') {
                    setCurrentBalance(res.data.remainingAmount);
                }
                setLoading(false);
            }, 800);
        } catch (err) {
            setLoading(false);
            setError(err.response?.data?.msg || "Access Denied");
        }
    };

    if (!service) return <div className="p-10 text-center">Loading Service...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="glass-card p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                
                <h1 className="text-3xl font-bold mb-2">{service.name} Demo</h1>
                <p className="text-slate-400 mb-8">{service.description}</p>

                <div className="bg-slate-900/50 p-4 rounded-lg inline-block mb-8 border border-slate-700">
                     <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                        {service.type === 'time' ? 'Time Remaining' : 'Your Balance'}
                     </div>
                     <div className="text-3xl font-mono font-bold text-white">
                         {currentBalance !== null ? currentBalance : '---'} <span className="text-sm text-slate-500">{service.type === 'usage' ? service.unitName : ''}</span>
                     </div>
                </div>

                {/* Conditional Interface: Chat vs Generic */}
                {(service.name.toLowerCase().includes('ai') || service.name.toLowerCase().includes('gpt')) ? (
                    <div className="h-[500px] flex flex-col bg-slate-950/50 rounded-2xl border border-white/10 overflow-hidden text-left">
                        {/* Chat Window */}
                        <div className="flex-grow p-6 space-y-4 overflow-y-auto custom-scrollbar">
                           {messages.length === 0 && (
                               <div className="text-center text-slate-500 mt-20">
                                   <Zap size={32} className="mx-auto mb-2 opacity-50" />
                                   <p>Start a conversation with {service.name}</p>
                                   <p className="text-xs opacity-70">Variable cost: 1 {service.unitName} / message</p>
                               </div>
                           )}
                           {messages.map((msg, idx) => (
                               <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx} 
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                               >
                                   <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'} shadow-lg`}>
                                       {msg.role === 'user' ? msg.text : (
                                           <div className="markdown-content">
                                               <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                   {msg.text}
                                               </ReactMarkdown>
                                           </div>
                                       )}
                                   </div>
                               </motion.div>
                           ))}
                           {loading && (
                               <div className="flex justify-start">
                                   <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100" />
                                       <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200" />
                                   </div>
                               </div>
                           )}
                           <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-900 border-t border-white/5">
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <input 
                                    type="text" 
                                    value={inputMsg}
                                    onChange={e => setInputMsg(e.target.value)}
                                    placeholder={currentBalance <= 0 ? "Insufficient balance to chat" : "Type your message..."}
                                    disabled={loading || currentBalance <= 0}
                                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <button 
                                    type="submit"
                                    disabled={loading || !inputMsg.trim() || currentBalance <= 0}
                                    className="p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowLeft size={20} className="rotate-180" /> {/* Send Icon equivalent */}
                                </button>
                            </form>
                            {error && <div className="text-red-400 text-xs mt-2 text-center">{error}</div>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={handleExecute}
                            disabled={loading || (service.type === 'time' && timeLeft <= 0)}
                            className={`w-full py-4 text-xl font-bold rounded-xl flex items-center justify-center gap-3 transition-all ${
                                loading || (service.type === 'time' && timeLeft <= 0) ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] shadow-lg shadow-purple-500/20'
                            }`}
                        >
                            {loading ? (
                                <>Processing...</>
                            ) : (
                                <><Zap /> {service.type === 'time' ? 'LAUNCH SESSION' : 'CONSUME API'}</>
                            )}
                        </button>

                        <AnimatePresence>
                            {result && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                                        <CheckCircle size={18} /> Success
                                    </div>
                                    <pre className="text-xs bg-slate-950 p-3 rounded overflow-auto font-mono text-slate-300">
                                        {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 flex items-center gap-2"
                                >
                                    <AlertCircle size={20} />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceDemo;
