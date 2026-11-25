import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { AppData, FuelRecord, ComputedFuelRecord, ServiceRecord, ToastMessage } from './types';
import {
  calculateContinuousConsumption,
  exportDataToCSV,
  normalizeAppData,
  getTodayDateString,
  NISSAN_MARCH_BACKUP,
} from './utils/calculations';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { TabResumen } from './components/TabResumen';
import { TabHistorial } from './components/TabHistorial';
import { TabServicios } from './components/TabServicios';
import { FuelModal } from './components/FuelModal';
import { ServiceModal } from './components/ServiceModal';
import { CarNameModal } from './components/CarNameModal';
import { OdometerModal } from './components/OdometerModal';
import { TripCalculatorModal } from './components/TripCalculatorModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AppearanceModal } from './components/AppearanceModal';
import { ConfirmDialogModal } from './components/ConfirmDialogModal';
import { ToastContainer } from './components/ToastContainer';
import { Plus } from 'lucide-react';
import { TextSizeOption, FontFamilyOption } from './types';

const TAB_ORDER = ['inicio', 'historial', 'servicios'] as const;

const tabSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 56 : -56,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -56 : 56,
    opacity: 0,
  }),
};

const STORAGE_KEY = 'gas_app_data';
const THEME_KEY = 'gas_app_theme';
const TEXT_SIZE_KEY = 'gas_app_text_size';
const FONT_FAMILY_KEY = 'gas_app_font_family';

const INITIAL_DATA: AppData = NISSAN_MARCH_BACKUP;

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Text size & Font Family states (defaulting to 'md' = comfortable and 'default' / 'lexend')
  const [textSize, setTextSize] = useState<TextSizeOption>(() => {
    try {
      const saved = localStorage.getItem(TEXT_SIZE_KEY) as TextSizeOption | null;
      if (saved && ['sm', 'md', 'lg', 'xl'].includes(saved)) return saved;
    } catch {}
    return 'md'; // 'md' is more comfortable and readable for everyone!
  });

  const [fontFamily, setFontFamily] = useState<FontFamilyOption>(() => {
    try {
      const saved = localStorage.getItem(FONT_FAMILY_KEY) as FontFamilyOption | null;
      if (saved && ['default', 'lexend', 'atkinson', 'system'].includes(saved)) return saved;
    } catch {}
    return 'default';
  });

  // App data state
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = normalizeAppData(parsed);
        if (normalized.fuels && normalized.fuels.length > 0) {
          return normalized;
        }
      }
    } catch (e) {
      console.error('Error al cargar datos locales', e);
    }
    return INITIAL_DATA;
  });

  // Navigation tab: 'inicio' | 'historial' | 'servicios'
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const currentTabRef = useRef<string>(currentTab);
  currentTabRef.current = currentTab;

  const mainRef = useRef<HTMLElement>(null);
  const dragX = useMotionValue(0);
  const suppressClickRef = useRef<boolean>(false);

  const navigateCircular = (dir: 1 | -1) => {
    const idx = TAB_ORDER.indexOf(currentTabRef.current as (typeof TAB_ORDER)[number]);
    const safeIdx = idx === -1 ? 0 : idx;
    const nextIdx = (safeIdx + dir + TAB_ORDER.length) % TAB_ORDER.length;
    setSlideDirection(dir);
    setCurrentTab(TAB_ORDER[nextIdx]);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const handleSelectTab = (nextTab: string) => {
    if (nextTab === currentTab) return;
    const fromIdx = TAB_ORDER.indexOf(currentTab as (typeof TAB_ORDER)[number]);
    const toIdx = TAB_ORDER.indexOf(nextTab as (typeof TAB_ORDER)[number]);
    setSlideDirection(toIdx >= fromIdx ? 1 : -1);
    setCurrentTab(nextTab);
    mainRef.current?.scrollTo({ top: 0 });
  };

  // Native non-passive touch + window mouse circular swipe engine
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const isFormTarget = (target: EventTarget | null) =>
      target instanceof HTMLElement && Boolean(target.closest('input, select, textarea, option'));

    let active = false;
    let isMouse = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let startTime = 0;
    let lock: 'x' | 'y' | null = null;

    const finishGesture = (endX: number, endY: number) => {
      if (!active) return;
      const dx = endX - startX;
      const dy = endY - startY;
      const elapsed = Date.now() - startTime;
      const wasHorizontal = lock === 'x' || (lock === null && Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy));
      const wasMouse = isMouse;

      active = false;
      isMouse = false;
      lock = null;
      animate(dragX, 0, { duration: 0.16, ease: [0.16, 1, 0.3, 1] });

      if (wasHorizontal && (Math.abs(dx) >= 36 || (Math.abs(dx) >= 20 && elapsed < 280))) {
        suppressClickRef.current = true;
        setTimeout(() => {
          suppressClickRef.current = false;
        }, 120);
        navigateCircular(dx < 0 ? 1 : -1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isFormTarget(e.target)) return;
      active = true;
      isMouse = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      lastX = startX;
      lastY = startY;
      startTime = Date.now();
      lock = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || isMouse || e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      lastX = x;
      lastY = y;
      const dx = x - startX;
      const dy = y - startY;

      if (lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        if (Math.abs(dx) >= Math.abs(dy) * 0.85) {
          lock = 'x';
        } else if (Math.abs(dy) > Math.abs(dx) * 1.2) {
          lock = 'y';
        }
      }

      if (lock === 'x') {
        if (e.cancelable) e.preventDefault();
        dragX.set(Math.max(-85, Math.min(85, dx * 0.45)));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active || isMouse) return;
      const touch = e.changedTouches[0];
      finishGesture(touch ? touch.clientX : lastX, touch ? touch.clientY : lastY);
    };

    const onTouchCancel = () => {
      if (!active || isMouse) return;
      finishGesture(lastX, lastY);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || isFormTarget(e.target)) return;
      active = true;
      isMouse = true;
      startX = e.clientX;
      startY = e.clientY;
      lastX = startX;
      lastY = startY;
      startTime = Date.now();
      lock = null;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!active || !isMouse) return;
      lastX = e.clientX;
      lastY = e.clientY;
      const dx = lastX - startX;
      const dy = lastY - startY;

      if (lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        lock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      }

      if (lock === 'x') {
        dragX.set(Math.max(-85, Math.min(85, dx * 0.45)));
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!active || !isMouse) return;
      finishGesture(e.clientX, e.clientY);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragX]);

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState<boolean>(false);
  const [editingFuel, setEditingFuel] = useState<FuelRecord | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [isCarNameModalOpen, setIsCarNameModalOpen] = useState<boolean>(false);
  const [isOdometerModalOpen, setIsOdometerModalOpen] = useState<boolean>(false);
  const [isTripCalcModalOpen, setIsTripCalcModalOpen] = useState<boolean>(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState<boolean>(false);

  // Text size changer
  const handleChangeTextSize = (size: TextSizeOption) => {
    setTextSize(size);
    try {
      localStorage.setItem(TEXT_SIZE_KEY, size);
    } catch {}
    addToast('info', `Tamaño de letra cambiado a ${size === 'sm' ? 'Compacto' : size === 'md' ? 'Cómodo' : size === 'lg' ? 'Grande' : 'Extra Grande'}`);
  };

  // Font family changer
  const handleChangeFontFamily = (font: FontFamilyOption) => {
    setFontFamily(font);
    try {
      localStorage.setItem(FONT_FAMILY_KEY, font);
    } catch {}
    const names: Record<FontFamilyOption, string> = {
      default: 'Plus Jakarta Sans',
      lexend: 'Lexend (Lectura fácil)',
      atkinson: 'Atkinson Hyperlegible',
      system: 'Sistema Clásica',
    };
    addToast('info', `Fuente cambiada a ${names[font]}`);
  };

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    type: 'success' | 'warning' | 'danger' | 'info',
    message: string,
    title?: string,
    duration = 4000
  ) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    addToast('info', `Modo ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} activado`);
  };

  // Save appData to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
      console.error('Error al guardar datos', e);
    }
  }, [appData]);

  // Current odometer calculation
  const currentOdometer = useMemo(() => {
    if (appData.manualOdometer !== null && appData.manualOdometer > 0) {
      return appData.manualOdometer;
    }
    if (appData.fuels.length > 0) {
      return Math.max(...appData.fuels.map((f) => f.odometer));
    }
    return 0;
  }, [appData.manualOdometer, appData.fuels]);

  // Chronological and view computations
  const { computedChronoFuels, computedViewFuels } = useMemo(() => {
    const sortedChrono = [...appData.fuels].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.odometer - b.odometer
    );

    const chrono = calculateContinuousConsumption(sortedChrono, appData.tankCapacityThreshold);

    const view = [...chrono].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.odometer - a.odometer
    );

    return { computedChronoFuels: chrono, computedViewFuels: view };
  }, [appData.fuels, appData.tankCapacityThreshold]);

  // Overall average efficiency calculation
  const averageEfficiency = useMemo(() => {
    if (appData.fuels.length < 2) return null;
    const sorted = [...appData.fuels].sort((a, b) => a.odometer - b.odometer);
    const totalDistance = sorted[sorted.length - 1].odometer - sorted[0].odometer;
    const totalLiters = sorted.slice(0, -1).reduce((acc, curr) => acc + curr.liters, 0);
    return totalDistance > 0 && totalLiters > 0 ? totalDistance / totalLiters : null;
  }, [appData.fuels]);

  // Last fuel price
  const lastFuelPrice = useMemo(() => {
    if (appData.fuels.length > 0) {
      const sorted = [...appData.fuels].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return sorted[0].pricePerLiter || 24.5;
    }
    return 24.5;
  }, [appData.fuels]);

  // Service alert count (only pending)
  const serviceAlertCount = useMemo(() => {
    return appData.services.filter((s) => {
      if (s.completed) return false;
      const diff = s.serviceOdometer - currentOdometer;
      return diff <= 1000;
    }).length;
  }, [appData.services, currentOdometer]);

  // Initial service checks notifications (modern in-app toasts for pending services)
  useEffect(() => {
    const timer = setTimeout(() => {
      appData.services.filter((s) => !s.completed).forEach((s) => {
        const diff = s.serviceOdometer - currentOdometer;
        if (diff <= 500) {
          addToast(
            'danger',
            `🔴 ${s.type}: ${diff > 0 ? `a solo ${diff} km` : '¡VENCIDO!'} de distancia`,
            '¡Mantenimiento Urgente!',
            6000
          );
        } else if (diff <= 1000) {
          addToast(
            'warning',
            `🟡 ${s.type}: programado a ${diff} km de distancia`,
            'Servicio Próximo',
            5000
          );
        }
      });
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Handlers
  const handleSaveFuel = (fuelData: Omit<FuelRecord, 'id' | 'totalCost'> & { id?: string }) => {
    const totalCost = Number((fuelData.liters * fuelData.pricePerLiter).toFixed(2));

    if (fuelData.id) {
      // Edit
      setAppData((prev) => ({
        ...prev,
        fuels: prev.fuels.map((f) =>
          f.id === fuelData.id ? { ...f, ...fuelData, totalCost, id: fuelData.id! } : f
        ),
      }));
      addToast('success', 'Registro de combustible actualizado con éxito', 'Actualizado');
    } else {
      // Create new
      const newFuel: FuelRecord = {
        ...fuelData,
        id: 'fuel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        totalCost,
      };
      setAppData((prev) => ({
        ...prev,
        fuels: [...prev.fuels, newFuel],
      }));
      addToast(
        'success',
        `Carga de ${fuelData.liters.toFixed(1)}L guardada (${fuelData.liters >= appData.tankCapacityThreshold ? 'Lleno ⛽' : 'Parcial 💧'})`,
        '¡Carga Registrada!'
      );
    }

    setIsFuelModalOpen(false);
    setEditingFuel(null);
  };

  const handleDeleteFuel = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar registro?',
      message: 'Esta acción borrará la carga seleccionada y recalculará los consumos.',
      isDangerous: true,
      onConfirm: () => {
        setAppData((prev) => ({
          ...prev,
          fuels: prev.fuels.filter((f) => f.id !== id),
        }));
        setIsFuelModalOpen(false);
        setEditingFuel(null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        addToast('info', 'Registro de combustible eliminado', 'Eliminado');
      },
    });
  };

  const handleSaveService = (serviceData: Omit<ServiceRecord, 'id'>) => {
    const newService: ServiceRecord = {
      ...serviceData,
      id: 'srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    };
    setAppData((prev) => ({
      ...prev,
      services: [...prev.services, newService],
    }));
    setIsServiceModalOpen(false);

    if (serviceData.completed) {
      addToast(
        'success',
        `Servicio "${serviceData.type}" guardado en el historial de realizados`,
        '✓ Mantenimiento Registrado'
      );
    } else {
      const diff = serviceData.serviceOdometer - currentOdometer;
      addToast(
        'success',
        `Servicio "${serviceData.type}" programado a ${diff} km`,
        '¡Servicio Agendado!'
      );
    }
  };

  const handleToggleCompleteService = (
    id: string,
    completed: boolean,
    completionData?: { cost?: number; completedDate: string; completedOdometer: number; notes?: string }
  ) => {
    setAppData((prev) => ({
      ...prev,
      services: prev.services.map((s) => {
        if (s.id === id) {
          if (completed) {
            return {
              ...s,
              completed: true,
              cost: completionData?.cost !== undefined ? completionData.cost : s.cost,
              completedDate: completionData?.completedDate || s.completedDate || getTodayDateString(),
              completedOdometer: completionData?.completedOdometer || s.completedOdometer || currentOdometer,
              notes: completionData?.notes !== undefined ? completionData.notes : s.notes,
            };
          } else {
            return {
              ...s,
              completed: false,
              completedDate: undefined,
              completedOdometer: undefined,
            };
          }
        }
        return s;
      }),
    }));
    addToast(
      completed ? 'success' : 'info',
      completed ? 'Servicio marcado como realizado y guardado en historial' : 'Servicio devuelto a pendientes',
      completed ? '✓ Realizado' : 'Pendiente'
    );
  };

  const handleDeleteService = (id: string, serviceName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar servicio?',
      message: `¿Deseas quitar el recordatorio para "${serviceName}"?`,
      isDangerous: true,
      onConfirm: () => {
        setAppData((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== id),
        }));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        addToast('info', `Servicio "${serviceName}" eliminado`, 'Eliminado');
      },
    });
  };

  const handleSaveCarDetails = (newName: string, newTankCapacity?: number) => {
    setAppData((prev) => ({
      ...prev,
      carName: newName,
      tankCapacityThreshold: newTankCapacity && newTankCapacity > 0 ? newTankCapacity : prev.tankCapacityThreshold || 38,
    }));
    addToast('success', `Vehículo guardado: "${newName}" • Tanque: ${newTankCapacity || 38} L`, 'Vehículo Actualizado');
  };

  const handleUpdateTankCapacity = (newCapacity: number) => {
    if (newCapacity > 0) {
      setAppData((prev) => ({
        ...prev,
        tankCapacityThreshold: newCapacity,
      }));
    }
  };

  const handleSaveOdometer = (newOdometer: number) => {
    setAppData((prev) => ({ ...prev, manualOdometer: newOdometer }));
    addToast('success', `Odómetro fijado en ${newOdometer.toLocaleString('es-MX')} km`);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute(
      'download',
      `gasapp_respaldo_${appData.carName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
    );
    dl.click();
    addToast('success', 'Archivo de respaldo JSON descargado', 'Descarga completada');
  };

  const handleExportCSV = () => {
    const csv = exportDataToCSV(appData.fuels, appData.carName);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dl = document.createElement('a');
    dl.setAttribute('href', url);
    dl.setAttribute('download', `gasapp_${new Date().toISOString().split('T')[0]}.csv`);
    dl.click();
    addToast('success', 'Archivo CSV exportado exitosamente', 'Reporte Excel');
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const normalized = normalizeAppData(parsed);
          setAppData(normalized);
          addToast('success', `¡Datos restaurados con éxito (${normalized.fuels.length} cargas, ${normalized.services.length} servicios)!`, 'Sincronizado');
        } catch (err: any) {
          addToast('danger', err.message || 'Error al leer el archivo JSON', 'Error de Archivo');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getFontFamilyClass = () => {
    switch (fontFamily) {
      case 'lexend':
        return 'font-lexend';
      case 'atkinson':
        return 'font-atkinson';
      case 'system':
        return 'font-system';
      default:
        return 'font-sans';
    }
  };

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'sm':
        return 'app-text-sm';
      case 'md':
        return 'app-text-md';
      case 'lg':
        return 'app-text-lg';
      case 'xl':
        return 'app-text-xl';
      default:
        return 'app-text-md';
    }
  };

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white transition-colors duration-200 ${getFontFamilyClass()} ${getTextSizeClass()}`}>
      {/* Modern In-App Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative shadow-2xl bg-slate-50/50 dark:bg-slate-950 min-h-screen">
        {/* Header with Circular Dark/Light Mode Button & Menu */}
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenTripCalculator={() => setIsTripCalcModalOpen(true)}
          onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
          onOpenAppearance={() => setIsAppearanceModalOpen(true)}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          onImportJSON={handleImportJSON}
        />

        {/* Main Tab Content with Circular Swipe Navigation */}
        <main
          ref={mainRef}
          onClickCapture={(e) => {
            if (suppressClickRef.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          className="flex-1 px-2 pt-1 pb-13 overflow-x-hidden overflow-y-auto touch-pan-y select-none"
        >
          <motion.div style={{ x: dragX }}>
            <AnimatePresence mode="popLayout" initial={false} custom={slideDirection}>
              <motion.div
                key={currentTab}
                custom={slideDirection}
                variants={tabSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {currentTab === 'inicio' && (
                  <TabResumen
                    carName={appData.carName}
                    odometer={currentOdometer}
                    recentFuels={computedViewFuels}
                    tankCapacityThreshold={appData.tankCapacityThreshold}
                    onEditCarName={() => setIsCarNameModalOpen(true)}
                    onEditOdometer={() => setIsOdometerModalOpen(true)}
                    onSelectFuel={(f) => {
                      setEditingFuel(f);
                      setIsFuelModalOpen(true);
                    }}
                    onOpenTripCalculator={() => setIsTripCalcModalOpen(true)}
                    onAddFuel={() => {
                      setEditingFuel(null);
                      setIsFuelModalOpen(true);
                    }}
                  />
                )}

                {currentTab === 'historial' && (
                  <TabHistorial
                    computedChronoFuels={computedChronoFuels}
                    computedViewFuels={computedViewFuels}
                    tankCapacityThreshold={appData.tankCapacityThreshold}
                    onSelectFuel={(f) => {
                      setEditingFuel(f);
                      setIsFuelModalOpen(true);
                    }}
                    onAddFuel={() => {
                      setEditingFuel(null);
                      setIsFuelModalOpen(true);
                    }}
                    onExportCSV={handleExportCSV}
                  />
                )}

                {currentTab === 'servicios' && (
                  <TabServicios
                    services={appData.services}
                    currentOdometer={currentOdometer}
                    onAddService={() => setIsServiceModalOpen(true)}
                    onDeleteService={handleDeleteService}
                    onToggleCompleteService={handleToggleCompleteService}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>

        {/* Floating Action Button (FAB) - Contextual (Fuel in Inicio/Historial, Service in Servicios) */}
        <button
          type="button"
          onClick={() => {
            if (currentTab === 'servicios') {
              setIsServiceModalOpen(true);
            } else {
              setEditingFuel(null);
              setIsFuelModalOpen(true);
            }
          }}
          className="fixed bottom-13 right-3 sm:right-[calc(50%-204px)] w-11 h-11 text-white rounded-full flex items-center justify-center shadow-lg z-30 transition-transform active:scale-90 hover:scale-105 cursor-pointer bg-blue-600 hover:bg-blue-700 shadow-blue-600/35"
          aria-label={currentTab === 'servicios' ? 'Programar o registrar servicio' : 'Registrar nueva carga de combustible'}
          title={currentTab === 'servicios' ? 'Nuevo Servicio' : 'Nueva Carga de Combustible'}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Bottom Navigation */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          serviceAlertCount={serviceAlertCount}
        />
      </div>

      {/* Modals */}
      <FuelModal
        isOpen={isFuelModalOpen}
        onClose={() => {
          setIsFuelModalOpen(false);
          setEditingFuel(null);
        }}
        onSave={handleSaveFuel}
        onDelete={handleDeleteFuel}
        editingFuel={editingFuel}
        currentOdometer={currentOdometer}
        lastPricePerLiter={lastFuelPrice}
        tankThreshold={appData.tankCapacityThreshold}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        currentOdometer={currentOdometer}
      />

      <CarNameModal
        isOpen={isCarNameModalOpen}
        onClose={() => setIsCarNameModalOpen(false)}
        currentName={appData.carName}
        currentTankCapacity={appData.tankCapacityThreshold || 38}
        onSave={handleSaveCarDetails}
      />

      <OdometerModal
        isOpen={isOdometerModalOpen}
        onClose={() => setIsOdometerModalOpen(false)}
        currentOdometer={currentOdometer}
        onSave={handleSaveOdometer}
      />

      <TripCalculatorModal
        isOpen={isTripCalcModalOpen}
        onClose={() => setIsTripCalcModalOpen(false)}
        avgEfficiency={averageEfficiency}
        lastFuelPrice={lastFuelPrice}
        tankCapacity={appData.tankCapacityThreshold || 38}
        onUpdateTankCapacity={handleUpdateTankCapacity}
      />

      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
        appData={appData}
        onImportData={(imported) => {
          setAppData(imported);
          addToast('success', 'Datos sincronizados exitosamente', '¡Completado!');
        }}
        onNotify={addToast}
      />

      <AppearanceModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        textSize={textSize}
        onChangeTextSize={handleChangeTextSize}
        fontFamily={fontFamily}
        onChangeFontFamily={handleChangeFontFamily}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <ConfirmDialogModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDangerous={confirmDialog.isDangerous}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
