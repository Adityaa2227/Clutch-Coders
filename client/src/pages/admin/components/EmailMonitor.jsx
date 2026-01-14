import React, { useState, useEffect } from 'react';
import api from '../../../../api';
import { Mail, RefreshCw, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const EmailMonitor = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/emails');
      setEmails(res.data);
    } catch (err) {
      console.error("Failed to load emails", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    // Auto-refresh every 10 seconds for demo "live" feel
    const interval = setInterval(fetchEmails, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          System Email Outbox (Live)
        </h2>
        <button 
          onClick={fetchEmails} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-white/70 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Email List */}
        <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${selectedEmail ? 'hidden md:block' : 'block'}`}>
          {emails.length === 0 ? (
            <div className="text-center text-white/50 py-10">No emails logged yet.</div>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => (
                <div 
                  key={email._id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedEmail?._id === email._id 
                      ? 'bg-blue-500/20 border-blue-500/50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      email.status === 'SENT' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {email.status}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(email.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-white font-medium truncate">{email.subject}</h4>
                  <p className="text-sm text-white/60 truncate">To: {email.recipient}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Detail View */}
        <div className={`flex-[1.5] bg-black/20 rounded-xl border border-white/10 flex flex-col overflow-hidden ${selectedEmail ? 'block' : 'hidden md:flex'}`}>
          {selectedEmail ? (
            <>
              <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{selectedEmail.subject}</h3>
                        <p className="text-sm text-white/60">To: <span className="text-white">{selectedEmail.recipient}</span></p>
                        <p className="text-xs text-white/40 mt-1">ID: {selectedEmail._id}</p>
                    </div>
                    <button onClick={() => setSelectedEmail(null)} className="md:hidden text-white/60 hover:text-white">
                        Close
                    </button>
                </div>
                {selectedEmail.errorMessage && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        smtp error: {selectedEmail.errorMessage.substring(0, 100)}...
                    </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white rounded-b-xl border-t-0">
                 {/* Provide a safe iframe-like render for HTML content */}
                 <div 
                    className="prose prose-sm max-w-none text-black"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body || '<i>No content stored</i>' }} 
                 />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30">
              <Mail className="w-12 h-12 mb-2 opacity-50" />
              <p>Select an email to view content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailMonitor;
