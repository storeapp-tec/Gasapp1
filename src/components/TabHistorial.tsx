import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ComputedFuelRecord } from '../types';
import { formatNumber, formatCurrency, formatDateShort, MESES_NOMBRES } from '../utils/calculations';
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
    <div className="space-y-1.5 pb-1">
      {/* Month Selector Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-[15px] font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
          >
            <option value="todos">📅 Todos los meses ({computedChronoFuels.length} cargas)</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                📅 {getMonthLabel(m)}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-2 pointer-events-none text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards in 2x2 Grid (Centered & Compact Numbers) */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-tight">
            Km Recorridos
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono tabular-nums leading-tight mt-0.5">
            {formatNumber(totalKmPeriodo)} km
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-tight">
            Gastos Totales
          </span>
          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 font-mono tabular-nums leading-tight mt-0.5">
            {formatCurrency(totalSpentPeriodo)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-tight">
            Litros Cargados
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono tabular-nums leading-tight mt-0.5">
            {totalLitersPeriodo.toFixed(1)} L
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-tight">
            Rendimiento Medio
          </span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums leading-tight mt-0.5">
            {rendimientoPeriodo}
          </span>
        </div>
      </div>

      {/* History List Header */}
      <div className="flex justify-between items-center px-1 pt-0.5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Registros ({filteredView.length})
        </h3>
        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
          Toca para editar
        </span>
      </div>

      {/* List */}
      {filteredView.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 text-center border border-dashed border-slate-300 dark:border-slate-800">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
            No hay registros para este período seleccionado.
          </p>
          <button
            type="button"
            onClick={onAddFuel}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Carga</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredView.map((f) => {
            const isFull = f.liters >= tankCapacityThreshold;

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
                  {/* Row 1: Date (left), Odometer (center), km Diff (right) */}
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap truncate">
                      {formatDateShort(f.date)}
                    </span>

                    <span className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums whitespace-nowrap text-center leading-tight">
                      {formatNumber(f.odometer)} km
                    </span>

                    <div className="text-right whitespace-nowrap">
                      {f.kmDiff > 0 && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          (+{formatNumber(f.kmDiff)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Liters + Parcial/Lleno (left) and Cost (right) */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap leading-tight">
                        {f.liters.toFixed(1)} L
                      </span>
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md leading-none whitespace-nowrap ${
                          isFull
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {isFull ? 'Lleno' : 'Parcial'}
                      </span>
                    </div>

                    <span className="text-[15px] sm:text-base font-extrabold text-slate-900 dark:text-white font-mono tabular-nums shrink-0 leading-tight">
                      {formatCurrency(f.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
