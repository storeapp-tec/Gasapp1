import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calculator, ArrowRightLeft, Users, Fuel, DollarSign, Sparkles, Navigation, Settings } from 'lucide-react';
import { formatNumber, formatCurrency } from '../utils/calculations';

interface TripCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  avgEfficiency: number | null;
  lastFuelPrice: number;
  tankCapacity: number;
  onUpdateTankCapacity?: (newCapacity: number) => void;
}

export const TripCalculatorModal: React.FC<TripCalculatorModalProps> = ({
  isOpen,
  onClose,
  avgEfficiency,
  lastFuelPrice,
  tankCapacity = 38,
  onUpdateTankCapacity,
}) => {
  const [distanceKm, setDistanceKm] = useState<string>('150');
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [efficiency, setEfficiency] = useState<string>(avgEfficiency && avgEfficiency > 0 ? avgEfficiency.toFixed(1) : '11.5');
  const [fuelPrice, setFuelPrice] = useState<string>(lastFuelPrice > 0 ? String(lastFuelPrice) : '24.50');
  const [passengers, setPassengers] = useState<number>(1);
  const [customTankCapacity, setCustomTankCapacity] = useState<string>(String(tankCapacity || 38));

  // Sync default values when modal opens
  useEffect(() => {
    if (isOpen) {
      if (avgEfficiency && avgEfficiency > 0) {
        setEfficiency(avgEfficiency.toFixed(1));
      }
      if (lastFuelPrice > 0) {
        setFuelPrice(String(lastFuelPrice));
      }
      setCustomTankCapacity(String(tankCapacity || 38));
    }
  }, [isOpen, avgEfficiency, lastFuelPrice, tankCapacity]);

  if (!isOpen) return null;

  const parsedDist = parseFloat(distanceKm);
  const numDistance = isNaN(parsedDist) ? 0 : Math.max(0, parsedDist);
  const totalEffectiveDistance = isRoundTrip ? numDistance * 2 : numDistance;

  const parsedEff = parseFloat(efficiency);
  const safeEfficiency = !isNaN(parsedEff) && parsedEff > 0 ? parsedEff : 10;

  const parsedPrice = parseFloat(fuelPrice);
  const safePrice = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : 24;

  const safePassengers = passengers >= 1 ? passengers : 1;

  const parsedTank = parseFloat(customTankCapacity);
  const activeTankCap = !isNaN(parsedTank) && parsedTank > 0 ? parsedTank : 38;

  const litersNeeded = safeEfficiency > 0 ? totalEffectiveDistance / safeEfficiency : 0;
  const totalCost = litersNeeded * safePrice;
  const costPerPerson = totalCost / safePassengers;
  const tanksNeeded = activeTankCap > 0 ? litersNeeded / activeTankCap : 0;

  const handleTankChange = (val: number) => {
    const safeVal = Math.max(5, val);
    setCustomTankCapacity(String(safeVal));
    if (onUpdateTankCapacity) {
      onUpdateTankCapacity(safeVal);
    }
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
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Calculadora de Viaje
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Capacidad de tanque configurada: <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeTankCap} L</span>
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

          {/* Form */}
          <div className="mt-4 space-y-3.5 text-xs font-semibold">
            {/* Distancia */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-600 dark:text-slate-400">
                  Distancia del trayecto (km)
                </label>
                <button
                  type="button"
                  onClick={() => setIsRoundTrip(!isRoundTrip)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition-colors ${
                    isRoundTrip
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  {isRoundTrip ? 'Ida y Vuelta (x2)' : 'Solo Ida'}
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="Ej: 150"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-3 top-3 text-slate-400 font-bold">km</span>
              </div>

              {/* Quick Distance Presets */}
              <div className="flex gap-1.5 mt-1.5">
                {[50, 100, 150, 250, 500].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDistanceKm(String(d))}
                    className={`flex-1 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      distanceKm === String(d)
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {d} km
                  </button>
                ))}
              </div>
            </div>

            {/* Rendimiento & Precio Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Rendimiento (km/L)
                </label>
                <input
                  type="number"
                  step="any"
                  value={efficiency}
                  onChange={(e) => setEfficiency(e.target.value)}
                  placeholder="11.5"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-300">
                  {avgEfficiency ? `Promedio actual: ${avgEfficiency.toFixed(1)}` : 'Estimado'}
                </span>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Precio Gasolina ($/L)
                </label>
                <input
                  type="number"
                  step="any"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  placeholder="24.50"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-600 dark:text-slate-300">Último costo registrado</span>
              </div>
            </div>

            {/* Capacidad del Tanque de tu Auto */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                  Capacidad de Tanque del Auto
                </label>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {activeTankCap} Litros
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="150"
                  step="any"
                  value={customTankCapacity}
                  onChange={(e) => {
                    setCustomTankCapacity(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0 && onUpdateTankCapacity) {
                      onUpdateTankCapacity(val);
                    }
                  }}
                  className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
                />
                <div className="flex gap-1 flex-1">
                  {[
                    { label: '38 L (March)', val: 38 },
                    { label: '45 L', val: 45 },
                    { label: '50 L', val: 50 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleTankChange(preset.val)}
                      className={`flex-1 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                        activeTankCap === preset.val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pasajeros (Split Cost) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  Dividir gasto entre pasajeros
                </label>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {safePassengers} {safePassengers === 1 ? 'persona' : 'personas'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPassengers(p)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      passengers === p
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {p} {p === 1 ? '👤' : '👥'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="mt-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
              Gasto Total Estimado ({formatNumber(totalEffectiveDistance)} km)
            </div>

            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatCurrency(totalCost)}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 text-left">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-indigo-100/50 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase">Litros</div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {litersNeeded.toFixed(1)} L
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-indigo-100/50 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase">Tanques ({activeTankCap}L)</div>
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {tanksNeeded.toFixed(2)}
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-xl border border-indigo-100/50 dark:border-slate-800 text-center">
                <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase">Por persona</div>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(costPerPerson)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar Calculadora
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
