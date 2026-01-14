import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
           initial={{ scale: 0.95, opacity: 0, y: 20 }}
           animate={{ scale: 1, opacity: 1, y: 0 }}
           exit={{ scale: 0.95, opacity: 0, y: 20 }}
           className="bg-surface border border-border rounded-2xl w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-border">
             <h3 className="text-xl font-bold text-white">{title}</h3>
             <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-white">
               <X size={20} />
             </button>
          </div>
          
          {/* Body */}
          <div className="p-6 text-text-main">
             {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;
