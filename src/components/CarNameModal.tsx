import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Car, Fuel, Info } from 'lucide-react';

interface CarNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentTankCapacity?: number;
  onSave: (newName: string, newTankCapacity?: number) => void;
}

export const CarNameModal: React.FC<CarNameModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentTankCapacity = 38,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [tankCapacity, setTankCapacity] = useState<number>(38);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setTankCapacity(currentTankCapacity || 38);
    }
  }, [isOpen, currentName, currentTankCapacity]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), Number(tankCapacity) || 38);
      onClose();
    }
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
                <Car className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Datos del Vehículo
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-semibold">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre o Modelo del Auto
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Nissan March"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Capacidad de Tanque */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                  Capacidad del Tanque (Litros)
                </label>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {tankCapacity} L
                </span>
              </div>
              <input
                type="number"
                min="10"
                max="200"
                step="1"
                required
                value={tankCapacity || ''}
                onChange={(e) => setTankCapacity(Math.max(1, parseFloat(e.target.value) || 0))}
                placeholder="38"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />

              {/* Quick presets */}
              <div className="flex gap-1.5 mt-2">
                {[
                  { label: '38 L (March)', val: 38 },
                  { label: '45 L', val: 45 },
                  { label: '50 L', val: 50 },
                  { label: '55 L', val: 55 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setTankCapacity(item.val)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      tankCapacity === item.val
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-300'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-1.5 mt-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  El <strong>Nissan March</strong> cuenta con un tanque oficial de <strong>38 Litros</strong>. Este valor se usa para los cálculos de tanque lleno y en la calculadora de viaje.
                </span>
              </div>
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
