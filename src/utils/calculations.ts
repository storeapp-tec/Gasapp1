import { FuelRecord, ComputedFuelRecord, ServiceStatus, AppData } from '../types';

export const MESES_NOMBRES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const MESES_COMPLETOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('es-MX').format(num);
}

export function formatCurrency(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '$0.00';
  return '$' + new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = MESES_NOMBRES[monthIdx] || parts[1];
    return `${parts[2]}-${monthName}-${parts[0].substring(2)}`;
  }
  return dateStr;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateContinuousConsumption(
  chronoFuels: FuelRecord[],
  tankThreshold: number = 38
): ComputedFuelRecord[] {
  if (!chronoFuels || chronoFuels.length === 0) return [];

  return chronoFuels.map((fuel, index) => {
    const isFullTank = fuel.liters >= tankThreshold;

    if (index === 0) {
      return {
        ...fuel,
        calculatedConsumption: null,
        kmDiff: 0,
        isFullTank
      };
    }

    const kmDiff = fuel.odometer - chronoFuels[index - 1].odometer;
    const totalKmFromStart = fuel.odometer - chronoFuels[0].odometer;

    let totalLitersToThisPoint = 0;
    for (let i = 0; i < index; i++) {
      totalLitersToThisPoint += chronoFuels[i].liters;
    }

    let calculatedConsumption: number | null = null;
    if (totalKmFromStart > 0 && totalLitersToThisPoint > 0) {
      calculatedConsumption = totalKmFromStart / totalLitersToThisPoint;
    }

    return {
      ...fuel,
      kmDiff,
      calculatedConsumption,
      isFullTank
    };
  });
}

export function getStatusProps(val: number | null) {
  if (val === null || val === undefined) {
    return {
      class: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
      badgeClass: 'badge-none',
      icon: '🔵',
      label: 'Inicial'
    };
  }
  if (val >= 10.0) {
    return {
      class: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      badgeClass: 'badge-good',
      icon: '🟢',
      label: 'Excelente'
    };
  }
  if (val >= 8.5) {
    return {
      class: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      badgeClass: 'badge-warn',
      icon: '🔸',
      label: 'Regular'
    };
  }
  return {
    class: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    badgeClass: 'badge-bad',
    icon: '🔴',
    label: 'Alto consumo'
  };
}

export function getServiceStatus(serviceOdometer: number, currentOdometer: number): ServiceStatus {
  const diff = serviceOdometer - currentOdometer;

  if (diff > 1000) {
    return {
      color: 'green',
      emoji: '🟢',
      message: `A ${formatNumber(diff)} km`,
      status: 'ok',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800',
      remaining: diff
    };
  } else if (diff > 500) {
    return {
      color: 'yellow',
      emoji: '🟡',
      message: `¡A ${formatNumber(diff)} km! Agenda ya`,
      status: 'warning',
      badgeClass: 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800',
      remaining: diff
    };
  } else {
    const msg = diff > 0 ? `¡A ${formatNumber(diff)} km! URGENTE` : '¡VENCIDO!';
    return {
      color: 'red',
      emoji: '🔴',
      message: msg,
      status: 'danger',
      badgeClass: 'bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800',
      remaining: diff
    };
  }
}

export function exportDataToCSV(fuels: FuelRecord[], carName: string): string {
  const headers = ['Fecha', 'Odometro_km', 'Litros', 'Precio_por_Litro', 'Costo_Total', 'Tipo_Carga'];
  const rows = fuels.map(f => [
    f.date,
    f.odometer,
    f.liters,
    f.pricePerLiter,
    f.totalCost.toFixed(2),
    f.liters >= 38 ? 'Tanque Lleno' : 'Carga Parcial'
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csvContent;
}

export const NISSAN_MARCH_BACKUP: AppData = {
  carName: 'Nissan March',
  manualOdometer: null,
  tankCapacityThreshold: 38,
  fuels: [
    { date: '2026-05-01', odometer: 175687, liters: 28.77, pricePerLiter: 23.85, totalCost: 686.16, id: '1' },
    { date: '2026-05-05', odometer: 176098, liters: 38, pricePerLiter: 23.95, totalCost: 910.10, id: '2' },
    { date: '2026-05-11', odometer: 176518, liters: 38, pricePerLiter: 23.20, totalCost: 881.60, id: '3' },
    { date: '2026-05-16', odometer: 176715, liters: 17.73, pricePerLiter: 23.49, totalCost: 416.48, id: '4' },
    { date: '2026-05-22', odometer: 177120, liters: 35, pricePerLiter: 23.66, totalCost: 828.10, id: '5' },
    { date: '2026-05-30', odometer: 177485, liters: 38, pricePerLiter: 23.95, totalCost: 910.10, id: '6' },
    { date: '2026-06-05', odometer: 177897, liters: 38, pricePerLiter: 23.85, totalCost: 906.30, id: '7' },
    { date: '2026-06-10', odometer: 178284, liters: 38, pricePerLiter: 23.65, totalCost: 898.70, id: '8' },
    { date: '2026-06-18', odometer: 178678, liters: 38, pricePerLiter: 23.29, totalCost: 885.02, id: '9' },
    { date: '2026-06-23', odometer: 178922, liters: 35, pricePerLiter: 23.29, totalCost: 815.15, id: '10' },
    { date: '2026-06-28', odometer: 179308, liters: 38, pricePerLiter: 23.66, totalCost: 899.08, id: '11' },
    { date: '2026-07-06', odometer: 179652, liters: 15, pricePerLiter: 23.66, totalCost: 354.90, id: '12' },
    { date: '2026-07-09', odometer: 179787, liters: 30, pricePerLiter: 23.66, totalCost: 709.80, id: '13' },
    { date: '2026-07-13', odometer: 180042, liters: 34, pricePerLiter: 23.45, totalCost: 797.30, id: 'f_1783954589010' },
    { date: '2026-07-19', odometer: 180473, liters: 38, pricePerLiter: 23.66, totalCost: 899.08, id: 'f_1784439786560' },
    { date: '2026-07-25', odometer: 180876, liters: 38, pricePerLiter: 23.09, totalCost: 877.42, id: 'f_1784989028542' },
    { date: '2026-07-30', odometer: 181234, liters: 38, pricePerLiter: 23.29, totalCost: 885.02, id: 'f_1785420343769' },
    { date: '2026-07-30', odometer: 181709, liters: 38, pricePerLiter: 23.99, totalCost: 911.62, id: 'f_1785475586171' },
    { date: '2026-08-02', odometer: 181922, liters: 25, pricePerLiter: 22.99, totalCost: 574.75, id: 'f_1785692359734' },
    { date: '2026-08-03', odometer: 182408, liters: 20, pricePerLiter: 23.69, totalCost: 473.80, id: 'f_1785946697523' },
  ],
  services: [
    { id: 's_1784934918792', type: 'Cambio de aceite', serviceOdometer: 181510, date: '2026-05-11' },
  ],
};

export function normalizeAppData(parsed: any): AppData {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('El formato del JSON no es válido.');
  }

  const carName = typeof parsed.carName === 'string' && parsed.carName.trim() ? parsed.carName : 'Nissan March';
  const manualOdometer = typeof parsed.manualOdometer === 'number' ? parsed.manualOdometer : null;
  const tankCapacityThreshold = typeof parsed.tankCapacityThreshold === 'number' ? parsed.tankCapacityThreshold : 38;

  const fuels = Array.isArray(parsed.fuels)
    ? parsed.fuels.map((f: any, idx: number) => {
        const liters = Number(f.liters || 0);
        const pricePerLiter = Number(f.pricePerLiter || 0);
        const totalCost = Number(f.totalCost || (liters * pricePerLiter));
        return {
          id: String(f.id ?? `f_${Date.now()}_${idx}`),
          date: String(f.date || getTodayDateString()),
          odometer: Number(f.odometer || 0),
          liters,
          pricePerLiter,
          totalCost: Number(totalCost.toFixed(2)),
          notes: f.notes ? String(f.notes) : undefined,
          gasStation: f.gasStation ? String(f.gasStation) : undefined,
        };
      })
    : [];

  const services = Array.isArray(parsed.services)
    ? parsed.services.map((s: any, idx: number) => ({
        id: String(s.id ?? `s_${Date.now()}_${idx}`),
        type: String(s.type || 'Mantenimiento'),
        serviceOdometer: Number(s.serviceOdometer || 0),
        date: String(s.date || getTodayDateString()),
        cost: s.cost !== undefined ? Number(s.cost) : undefined,
        notes: s.notes ? String(s.notes) : undefined,
        completed: Boolean(s.completed),
        completedDate: s.completedDate ? String(s.completedDate) : undefined,
        completedOdometer: s.completedOdometer !== undefined ? Number(s.completedOdometer) : undefined,
      }))
    : [];

  return {
    carName,
    manualOdometer,
    tankCapacityThreshold,
    fuels,
    services,
  };
}
