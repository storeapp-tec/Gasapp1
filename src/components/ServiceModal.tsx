import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, Calendar, Gauge, AlertCircle } from 'lucide-react';
import { ServiceRecord } from '../types';
import { getTodayDateString } from '../utils/calculations';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<ServiceRecord, 'id'>) => void;
  currentOdometer: number;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentOdometer,
}) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [type, setType] = useState<string>('');
  const [serviceOdometer, setServiceOdometer] = useState<string>(() =>
    currentOdometer > 0 ? String(currentOdometer) : ''
  );
  const [date, setDate] = useState<string>(getTodayDateString());
  const [cost, setCost] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Sync / Pre-load current odometer whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      if (currentOdometer > 0) {
        setServiceOdometer(String(currentOdometer));
      }
      setDate(getTodayDateString());
      setError('');
    }
  }, [isOpen, currentOdometer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanType = type.trim();
    const numOdo = parseInt(serviceOdometer, 10);
    const numCost = cost ? parseFloat(cost) : undefined;

    if (!cleanType) {
      setError('Por favor escribe el tipo de servicio');
      return;
    }
    if (isNaN(numOdo) || numOdo <= 0) {
      setError('Por favor ingresa un kilometraje válido');
      return;
    }
    if (!isCompleted && numOdo < currentOdometer) {
      setError(`El kilometraje objetivo no puede ser menor al actual (${currentOdometer.toLocaleString()} km)`);
      return;
    }
    if (!date) {
      setError('Por favor selecciona una fecha');
      return;
    }

    onSave({
      type: cleanType,
      serviceOdometer: numOdo,
      date,
      cost: isCompleted && numCost && !isNaN(numCost) ? numCost : undefined,
      completed: isCompleted,
      completedDate: isCompleted ? date : undefined,
      completedOdometer: isCompleted ? numOdo : undefined,
    });

    // Reset & close
    setType('');
    setServiceOdometer(currentOdometer > 0 ? String(currentOdometer) : '');
    setCost('');
    setIsCompleted(false);
    setError('');
  };

  const handleAddKm = (kmToAdd: number) => {
    const base = parseInt(serviceOdometer, 10) || currentOdometer || 0;
    setServiceOdometer(String(base + kmToAdd));
    setError('');
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
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {isCompleted ? 'Registrar Servicio Realizado' : 'Programar Nuevo Servicio'}
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

          {/* Status selector */}
          <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setIsCompleted(false);
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                !isCompleted
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              ⏳ Pendiente (Programar)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCompleted(true);
                if (!serviceOdometer && currentOdometer > 0) {
                  setServiceOdometer(String(currentOdometer));
                }
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                isCompleted
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              ✓ Ya Realizado
            </button>
          </div>

          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5 text-xs font-semibold">
            {/* Service Type - purely manual input as requested */}
            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Mantenimiento
              </label>
              <input
                type="text"
                required
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setError('');
                }}
                placeholder="Ej: Cambio de aceite, balatas, afinación..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Kilometraje objetivo */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-600 dark:text-slate-400">
                  {isCompleted ? 'Kilometraje en que se realizó' : 'Kilometraje objetivo'}
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  required
                  value={serviceOdometer}
                  onChange={(e) => {
                    setServiceOdometer(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej: 185000"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <Gauge className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>

              {/* Quick add km buttons (for pending mode) */}
              {!isCompleted && (
                <div className="flex gap-1.5 mt-1.5">
                  {[3000, 5000, 10000].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleAddKm(k)}
                      className="flex-1 py-1 rounded-md text-[11px] bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      +{k.toLocaleString()} km
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date and optional Cost (cost shown only when marking as completed) */}
            {isCompleted ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Fecha
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <Calendar className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Costo total
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="Ej: 850"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Fecha estimada
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <Calendar className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Buttons */}
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
                className={`flex-1 py-2.5 text-white rounded-xl font-bold text-xs transition-colors shadow-md ${
                  isCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                }`}
              >
                {isCompleted ? 'Guardar Realizado' : 'Guardar Servicio'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

