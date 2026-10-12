import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Fuel, Trash2, Calendar, DollarSign, Gauge, Droplet, Sparkles } from 'lucide-react';
import { FuelRecord } from '../types';
import { formatNumber, formatCurrency, getTodayDateString } from '../utils/calculations';

interface FuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fuel: Omit<FuelRecord, 'id' | 'totalCost'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  editingFuel?: FuelRecord | null;
  currentOdometer: number;
  lastPricePerLiter?: number;
  tankThreshold?: number;
}

export const FuelModal: React.FC<FuelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingFuel,
  currentOdometer,
  lastPricePerLiter,
  tankThreshold = 38,
}) => {
  const [odometer, setOdometer] = useState<string>('');
  const [liters, setLiters] = useState<string>('');
  const [pricePerLiter, setPricePerLiter] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editingFuel) {
        setOdometer(String(editingFuel.odometer));
        setLiters(String(editingFuel.liters));
        setPricePerLiter(String(editingFuel.pricePerLiter));
        setDate(editingFuel.date || getTodayDateString());
        setNotes(editingFuel.notes || '');
        setError('');
      } else {
        setOdometer(currentOdometer > 0 ? String(currentOdometer) : '');
        setLiters('');
        setPricePerLiter(lastPricePerLiter && lastPricePerLiter > 0 ? String(lastPricePerLiter) : '');
        setDate(getTodayDateString());
        setNotes('');
        setError('');
      }
    }
  }, [isOpen, editingFuel, currentOdometer, lastPricePerLiter]);

  if (!isOpen) return null;

  const numLiters = parseFloat(liters) || 0;
  const numPrice = parseFloat(pricePerLiter) || 0;
  const liveTotal = numLiters * numPrice;
  const isFullTank = numLiters >= tankThreshold;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numOdo = parseInt(odometer, 10);

    if (isNaN(numOdo) || numOdo <= 0) {
      setError('Por favor ingresa un kilometraje válido');
      return;
    }
    if (isNaN(numLiters) || numLiters <= 0) {
      setError('Por favor ingresa los litros cargados');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Por favor ingresa el precio por litro');
      return;
    }
    if (!date) {
      setError('Por favor selecciona una fecha');
      return;
    }

    onSave({
      id: editingFuel ? editingFuel.id : undefined,
      odometer: numOdo,
      liters: numLiters,
      pricePerLiter: numPrice,
      date,
      notes: notes.trim() || undefined
    });
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
          {/* Title */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Fuel className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingFuel ? 'Editar Carga' : 'Nueva Carga de Combustible'}
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
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {/* Odometer */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Kilometraje Actual (km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  required
                  value={odometer}
                  onChange={(e) => {
                    setOdometer(e.target.value);
                    setError('');
                  }}
                  placeholder={currentOdometer > 0 ? `Ej: ${currentOdometer + 350}` : 'Ej: 85400'}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Gauge className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            {/* Liters & Price Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Litros (L)
                  </label>
                  {numLiters > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isFullTank
                          ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {isFullTank ? '⛽ Lleno' : '💧 Parcial'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={liters}
                    onChange={(e) => {
                      setLiters(e.target.value);
                      setError('');
                    }}
                    placeholder="Ej: 35.5"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <Droplet className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Precio/Litro ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pricePerLiter}
                    onChange={(e) => {
                      setPricePerLiter(e.target.value);
                      setError('');
                    }}
                    placeholder="Ej: 24.50"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">$</span>
                </div>
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Live Total Box */}
            <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 flex justify-between items-center">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Total a pagar:
                {numLiters > 0 && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    {isFullTank ? `Tanque lleno (≥${tankThreshold} L)` : `Carga parcial (<${tankThreshold} L)`}
                  </div>
                )}
              </div>
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(liveTotal)}
              </div>
            </div>

            {/* Action Buttons */}
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
                {editingFuel ? 'Actualizar' : 'Guardar Carga'}
              </button>
            </div>

            {/* Delete button when editing */}
            {editingFuel && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(editingFuel.id)}
                className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar este registro</span>
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
