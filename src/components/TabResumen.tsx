import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Fuel, Edit3, Gauge, TrendingUp, DollarSign, Calculator, ChevronRight, Droplet, Sparkles, Plus, X } from 'lucide-react';
import { ComputedFuelRecord } from '../types';
import { formatNumber, formatCurrency, formatDateShort, getStatusProps } from '../utils/calculations';

interface TabResumenProps {
  carName: string;
  odometer: number;
  recentFuels: ComputedFuelRecord[];
  tankCapacityThreshold: number;
  onEditCarName: () => void;
  onEditOdometer: () => void;
  onSelectFuel: (fuel: ComputedFuelRecord) => void;
  onOpenTripCalculator: () => void;
  onAddFuel: () => void;
}

export const TabResumen: React.FC<TabResumenProps> = ({
  carName,
  odometer,
  recentFuels,
  tankCapacityThreshold,
  onEditCarName,
  onEditOdometer,
  onSelectFuel,
  onOpenTripCalculator,
  onAddFuel,
}) => {
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gasapp_dismiss_calc_banner') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBannerDismissed(true);
    try {
      localStorage.setItem('gasapp_dismiss_calc_banner', 'true');
    } catch (err) {
      console.error(err);
    }
  };

  const latestFuel = recentFuels.length > 0 ? recentFuels[0] : null;
  const latestConsumption = latestFuel?.calculatedConsumption;
  const latestStatus = getStatusProps(latestConsumption ?? null);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Car & Odometer Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Car Name Button */}
        <button
          type="button"
          onClick={onEditCarName}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group mb-2"
        >
          <span>🚗</span>
          <span className="max-w-[200px] truncate">{carName}</span>
          <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
        </button>

        {/* Odometer Display */}
        <div
          onClick={onEditOdometer}
          className="cursor-pointer group flex flex-col items-center justify-center my-1 select-none"
        >
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-mono">
              {formatNumber(odometer)}
            </span>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">km</span>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1 mt-1 group-hover:text-indigo-500">
            <Gauge className="w-3 h-3" />
            Toca para ajustar odómetro
          </span>
        </div>

        {/* Quick Summary Pill Bar */}
        {latestFuel && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-left">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">Último Rendimiento</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm">{latestStatus.icon}</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {latestConsumption ? `${latestConsumption.toFixed(1)} km/L` : 'Carga Inicial'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">Última Carga</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {latestFuel.liters.toFixed(1)} L • {formatCurrency(latestFuel.totalCost)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trip Calculator Quick Banner (Dismissible) */}
      {!isBannerDismissed && (
        <div
          onClick={onOpenTripCalculator}
          className="relative bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Calculadora de Viaje
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                Calcula litros y costo estimado para tu próximo recorrido
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDismissBanner}
              title="Ocultar aviso"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <ChevronRight className="w-5 h-5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* Recent Loads List */}
      <div>
        <div className="flex justify-between items-center px-1 mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Últimas Cargas Recientes
          </h3>
          <span className="text-[11px] text-slate-600 dark:text-slate-300">
            {recentFuels.length} registros
          </span>
        </div>

        {recentFuels.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 text-2xl">
              ⛽
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay cargas registradas</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
              Presiona el botón + para registrar tu primera carga de gasolina.
            </p>
            <button
              type="button"
              onClick={onAddFuel}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Carga</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentFuels.slice(0, 5).map((f) => {
              const status = getStatusProps(f.calculatedConsumption);
              const disp = f.calculatedConsumption ? `${f.calculatedConsumption.toFixed(1)} km/L` : 'Inicial';
              const isFull = f.liters >= tankCapacityThreshold;

              return (
                <motion.div
                  key={f.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectFuel(f)}
                  className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-xs border border-slate-200/70 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold shrink-0">
                      ⛽
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {formatDateShort(f.date)}
                        </span>
                        {/* Auto Full Tank / Partial tag as requested */}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${
                            isFull
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {isFull ? 'Lleno' : 'Parcial'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        {f.liters.toFixed(1)} L • {formatNumber(f.odometer)} km
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(f.totalCost)}
                    </div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 mt-0.5 ${status.class}`}>
                      <span>{status.icon}</span>
                      <span>{disp}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
