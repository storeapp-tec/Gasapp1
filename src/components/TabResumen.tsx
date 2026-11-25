import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Fuel, Edit3, TrendingUp, DollarSign, Calculator, ChevronRight, Droplet, Sparkles, Plus, X } from 'lucide-react';
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
    <div className="space-y-1.5 pb-1">
      {/* Car & Odometer Compact Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl px-3 py-2 shadow-xs border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        {/* Top Row: Car Name */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <button
            type="button"
            onClick={onEditCarName}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group cursor-pointer min-w-0"
          >
            <span className="shrink-0">🚗</span>
            <span className="max-w-[200px] truncate">{carName}</span>
            <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
          </button>
        </div>

        {/* Compact Odometer Display */}
        <div
          onClick={onEditOdometer}
          className="cursor-pointer group flex items-baseline justify-center gap-1.5 py-0.5 select-none"
        >
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-mono tabular-nums leading-none">
            {formatNumber(odometer)}
          </span>
          <span className="text-base font-bold text-slate-600 dark:text-slate-300 leading-none">km</span>
        </div>

        {/* Compact Quick Summary Bar */}
        {latestFuel && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-1.5 text-left">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Último Rendimiento</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-base leading-none">{latestStatus.icon}</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight truncate">
                  {latestConsumption ? `${latestConsumption.toFixed(1)} km/L` : 'Inicial'}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[13px] font-bold text-slate-600 dark:text-slate-300 leading-tight">Última Carga</div>
              <div className="mt-0.5">
                <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums leading-tight block truncate">
                  {latestFuel.liters.toFixed(1)} L · {formatCurrency(latestFuel.totalCost)}
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
          className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-1.5 flex items-center justify-between cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all group shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/20 shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                Calculadora de Viaje
              </div>
              <div className="text-[13px] text-slate-600 dark:text-slate-300 font-medium leading-tight truncate">
                Calcula litros y costo para tu viaje
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={handleDismissBanner}
              title="Ocultar aviso"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      )}

      {/* Recent Loads List */}
      <div>
        <div className="flex justify-between items-center px-1 mb-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Últimas Cargas
          </h3>
          <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
            {recentFuels.length} registros
          </span>
        </div>

        {recentFuels.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 text-center border border-dashed border-slate-300 dark:border-slate-800">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-2 text-2xl">
              ⛽
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No hay cargas registradas</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
              Presiona el botón + para registrar tu primera carga de gasolina.
            </p>
            <button
              type="button"
              onClick={onAddFuel}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Carga</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentFuels.slice(0, 5).map((f) => {
              const status = getStatusProps(f.calculatedConsumption);
              const disp = f.calculatedConsumption ? `${f.calculatedConsumption.toFixed(1)} km/L` : 'Inicial';

              return (
                <div
                  key={f.id}
                  onClick={() => onSelectFuel(f)}
                  className="bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 active:scale-[0.99] transition-all"
                >
                  {/* Gas icon spanning both lines */}
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0">
                    ⛽
                  </div>

                  {/* Two lines content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Line 1: Date (left), Odometer (center), Cost (right) */}
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap truncate">
                        {formatDateShort(f.date)}
                      </span>
                      <span className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums whitespace-nowrap text-center leading-tight">
                        {formatNumber(f.odometer)} km
                      </span>
                      <span className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white font-mono tabular-nums whitespace-nowrap text-right leading-tight">
                        {formatCurrency(f.totalCost)}
                      </span>
                    </div>

                    {/* Line 2: Liters (left), Average (center) */}
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap truncate leading-tight">
                        {f.liters.toFixed(1)} L
                      </span>
                      <div className="flex justify-center">
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 tabular-nums leading-none whitespace-nowrap ${status.class}`}>
                          <span>{status.icon}</span>
                          <span>{disp}</span>
                        </span>
                      </div>
                      <span />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
