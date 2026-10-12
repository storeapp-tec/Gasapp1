import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gauge } from 'lucide-react';
import { formatNumber } from '../utils/calculations';

interface OdometerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOdometer: number;
  onSave: (newOdometer: number) => void;
}

export const OdometerModal: React.FC<OdometerModalProps> = ({
  isOpen,
  onClose,
  currentOdometer,
  onSave,
}) => {
  const [odometer, setOdometer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOdometer(currentOdometer > 0 ? String(currentOdometer) : '');
      setError('');
    }
  }, [isOpen, currentOdometer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(odometer, 10);
    if (isNaN(val) || val <= 0) {
      setError('Por favor ingresa un kilometraje válido');
      return;
    }
    onSave(val);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Ajustar Odómetro
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Kilometraje Actual (km)
              </label>
              <input
                type="number"
                step="1"
                required
                value={odometer}
                onChange={(e) => {
                  setOdometer(e.target.value);
                  setError('');
                }}
                placeholder="Ej: 125000"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                El odómetro se actualiza automáticamente con cada carga, pero puedes ajustarlo manualmente aquí.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-indigo-600/20"
              >
                Guardar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
