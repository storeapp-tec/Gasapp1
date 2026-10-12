import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ComputedFuelRecord } from '../types';
import { formatNumber, formatCurrency, formatDateShort, getStatusProps, MESES_NOMBRES } from '../utils/calculations';
import { Calendar, Filter, Download, Plus, Fuel, TrendingUp } from 'lucide-react';

interface TabHistorialProps {
  computedChronoFuels: ComputedFuelRecord[];
  computedViewFuels: ComputedFuelRecord[];
  tankCapacityThreshold: number;
  onSelectFuel: (fuel: ComputedFuelRecord) => void;
  onAddFuel: () => void;
  onExportCSV: () => void;
}

export const TabHistorial: React.FC<TabHistorialProps> = ({
  computedChronoFuels,
  computedViewFuels,
  tankCapacityThreshold,
  onSelectFuel,
  onAddFuel,
  onExportCSV,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');

  // Build unique list of months
  const monthSets = new Set<string>();
  computedChronoFuels.forEach((f) => {
    const p = f.date.split('-');
    if (p.length === 3) monthSets.add(`${p[0]}-${p[1]}`);
  });
  const availableMonths = Array.from(monthSets).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Filtered views
  const filteredView = selectedMonth === 'todos'
    ? computedViewFuels
    : computedViewFuels.filter((f) => f.date.startsWith(selectedMonth));

  const filteredChrono = selectedMonth === 'todos'
    ? computedChronoFuels
    : computedChronoFuels.filter((f) => f.date.startsWith(selectedMonth));

  // Calculations for summary cards
  let totalKmPeriodo = 0;
  const totalSpentPeriodo = filteredChrono.reduce((sum, f) => sum + f.totalCost, 0);
  const totalLitersPeriodo = filteredChrono.reduce((sum, f) => sum + f.liters, 0);
  let rendimientoPeriodo = '- -';

  if (filteredChrono.length > 0) {
    totalKmPeriodo = filteredChrono.reduce((sum, f) => sum + f.kmDiff, 0);

    if (selectedMonth === 'todos' && computedChronoFuels.length > 1) {
      totalKmPeriodo = computedChronoFuels[computedChronoFuels.length - 1].odometer - computedChronoFuels[0].odometer;
      const litrosMenosUltimo = computedChronoFuels.slice(0, -1).reduce((sum, f) => sum + f.liters, 0);
      rendimientoPeriodo = litrosMenosUltimo > 0 ? (totalKmPeriodo / litrosMenosUltimo).toFixed(1) + ' km/L' : '- -';
    } else {
      rendimientoPeriodo = totalLitersPeriodo > 0 ? (totalKmPeriodo / totalLitersPeriodo).toFixed(1) + ' km/L' : '- -';
    }
  }

  const getMonthLabel = (mStr: string) => {
    const p = mStr.split('-');
    if (p.length === 2) {
      const idx = parseInt(p[1], 10) - 1;
      return `${MESES_NOMBRES[idx]} ${p[0]}`;
    }
    return mStr;
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Month Selector Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
          >
            <option value="todos">📅 Todos los meses ({computedChronoFuels.length} cargas)</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                📅 {getMonthLabel(m)}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 tracking-wider">
            Km Recorridos
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
            {formatNumber(totalKmPeriodo)} km
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 tracking-wider">
            Gastos Totales
          </span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
            {formatCurrency(totalSpentPeriodo)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 tracking-wider">
            Litros Cargados
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
            {totalLitersPeriodo.toFixed(1)} L
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 tracking-wider">
            Rendimiento Medio
          </span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
            {rendimientoPeriodo}
          </span>
        </div>
      </div>

      {/* History List Header */}
      <div className="flex justify-between items-center px-1 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Registros de Carga ({filteredView.length})
        </h3>
        <span className="text-[11px] text-slate-600 dark:text-slate-300">
          Toca para editar
        </span>
      </div>

      {/* List */}
      {filteredView.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            No hay registros para este período seleccionado.
          </p>
          <button
            type="button"
            onClick={onAddFuel}
            className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Carga</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredView.map((f) => {
            const status = getStatusProps(f.calculatedConsumption);
            const disp = f.calculatedConsumption ? `${f.calculatedConsumption.toFixed(1)} km/L` : 'Inicial';
            const isFull = f.liters >= tankCapacityThreshold;

            return (
              <motion.div
                key={f.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectFuel(f)}
                className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-xs border border-slate-200/70 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Row 1: Date & Odometer + km Diff */}
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      📅 {formatDateShort(f.date)}
                    </span>
                    {/* Auto Full Tank / Partial tag as requested */}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isFull
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isFull ? 'Tanque lleno' : 'Carga parcial'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{formatNumber(f.odometer)} km</span>
                    {f.kmDiff > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                        (+{formatNumber(f.kmDiff)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Liters, Badge, and Cost */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      ⛽ {f.liters.toFixed(1)} L (${f.pricePerLiter.toFixed(2)}/L)
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 ${status.class}`}>
                      <span>{status.icon}</span>
                      <span>{disp}</span>
                    </span>
                  </div>

                  <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(f.totalCost)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
