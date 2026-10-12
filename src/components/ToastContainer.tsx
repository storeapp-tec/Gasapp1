import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center pointer-events-none px-4 gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const isDanger = t.type === 'danger';
          const isWarning = t.type === 'warning';
          const isSuccess = t.type === 'success';

          const bgClass = isDanger
            ? 'bg-rose-600 text-white shadow-rose-900/30'
            : isWarning
            ? 'bg-amber-600 text-white shadow-amber-900/30'
            : isSuccess
            ? 'bg-emerald-600 text-white shadow-emerald-900/30'
            : 'bg-indigo-600 text-white shadow-indigo-900/30';

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg w-full max-w-md ${bgClass}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isDanger && <AlertCircle className="w-5 h-5 shrink-0" />}
                {isWarning && <AlertTriangle className="w-5 h-5 shrink-0" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                {!isDanger && !isWarning && !isSuccess && <Info className="w-5 h-5 shrink-0" />}
                
                <div className="text-sm">
                  {t.title && <div className="font-bold leading-tight">{t.title}</div>}
                  <div className="text-xs opacity-95 leading-normal">{t.message}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="text-white/80 hover:text-white p-1 transition-colors shrink-0"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
