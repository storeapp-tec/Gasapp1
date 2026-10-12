import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, DollarSign, Calendar, Gauge } from 'lucide-react';
import { ServiceRecord } from '../types';
import { getTodayDateString, formatNumber } from '../utils/calculations';

interface CompleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceRecord | null;
  currentOdometer: number;
  onConfirm: (id: string, completionData: { cost?: number; completedDate: string; completedOdometer: number; notes?: string }) => void;
}

export const CompleteServiceModal: React.FC<CompleteServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  currentOdometer,
  onConfirm,
}) => {
  const [completedOdometer, setCompletedOdometer] = useState<string>(() => String(currentOdometer || ''));
  const [completedDate, setCompletedDate] = useState<string>(getTodayDateString());
  const [cost, setCost] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCompletedOdometer(currentOdometer > 0 ? String(currentOdometer) : '');
      setCompletedDate(getTodayDateString());
      setCost(service?.cost ? String(service.cost) : '');
      setNotes(service?.notes || '');
    }
  }, [isOpen, service, currentOdometer]);

  if (!isOpen || !service) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numOdo = parseInt(completedOdometer, 10) || currentOdometer;
    const numCost = cost ? parseFloat(cost) : undefined;

    onConfirm(service.id, {
      cost: numCost && !isNaN(numCost) ? numCost : undefined,
      completedDate: completedDate || getTodayDateString(),
      completedOdometer: numOdo,
      notes: notes.trim() ? (service.notes && !service.notes.includes(notes.trim()) ? `${service.notes} • ${notes.trim()}` : notes.trim()) : service.notes,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Marcar como Realizado
                </h2>
                <p className="text-xs text-slate-500 truncate max-w-[240px]">
                  {service.type}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs font-semibold">
            {/* Kilometraje Realizado */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-600 dark:text-slate-400">
                  Kilometraje en que se realizó (km)
                </label>
                <span className="text-[10px] text-slate-500 font-normal">
                  Actual: {formatNumber(currentOdometer)} km
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  required
                  value={completedOdometer}
                  onChange={(e) => setCompletedOdometer(e.target.value)}
                  placeholder={String(currentOdometer)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <Gauge className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            {/* Fecha y Costo alineados */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Fecha de realización
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={completedDate}
                    onChange={(e) => setCompletedDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <Calendar className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Costo total
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Ej: 850"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <DollarSign className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Aceite sintético 5W-30 y filtro de aire"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-emerald-600/20"
              >
                Guardar Realizado
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
