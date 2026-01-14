import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    className={`fixed bottom-10 left-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md min-w-[300px] ${
                        type === 'success' 
                            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                >
                    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium text-sm flex-1">{message}</span>
                    <button onClick={onClose} className="hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
