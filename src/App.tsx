import React, { useState, useEffect, useMemo } from 'react';
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
import { ExportCodeModal } from './components/ExportCodeModal';
import { GitHubUploaderModal } from './components/GitHubUploaderModal';
import { ConfirmDialogModal } from './components/ConfirmDialogModal';
import { ToastContainer } from './components/ToastContainer';
import { Plus } from 'lucide-react';
import { TextSizeOption, FontFamilyOption } from './types';

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

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState<boolean>(false);
  const [editingFuel, setEditingFuel] = useState<FuelRecord | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);
  const [isCarNameModalOpen, setIsCarNameModalOpen] = useState<boolean>(false);
  const [isOdometerModalOpen, setIsOdometerModalOpen] = useState<boolean>(false);
  const [isTripCalcModalOpen, setIsTripCalcModalOpen] = useState<boolean>(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState<boolean>(false);
  const [isExportCodeModalOpen, setIsExportCodeModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);

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
        `Carga de ${fuelData.liters.toFixed(1)}L guardada (${fuelData.liters >= appData.tankCapacityThreshold ? 'Tanque lleno ⛽' : 'Carga parcial 💧'})`,
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
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${getFontFamilyClass()} ${getTextSizeClass()}`}>
      {/* Modern In-App Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative shadow-2xl bg-slate-50/50 dark:bg-slate-950 min-h-screen">
        {/* Header with Circular Dark/Light Mode Button & Menu */}
        <Header
          currentTab={currentTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenTripCalculator={() => setIsTripCalcModalOpen(true)}
          onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
          onOpenAppearance={() => setIsAppearanceModalOpen(true)}
          onOpenExportCode={() => setIsExportCodeModalOpen(true)}
          onOpenGitHubUploader={() => setIsGitHubModalOpen(true)}
          onExportJSON={handleExportJSON}
          onExportCSV={handleExportCSV}
          onImportJSON={handleImportJSON}
        />

        {/* Quick Export index.html Bar for GitHub / Local */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white px-3.5 py-2 flex items-center justify-between shadow-md border-b border-indigo-900/50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🐙</span>
            <div className="truncate">
              <span className="font-bold text-xs">storeapp-tec/Gasapp1</span>
              <span className="text-[10px] text-indigo-200 hidden sm:inline sm:ml-1">• index.html listo</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsGitHubModalOpen(true)}
              className="bg-white text-indigo-900 hover:bg-indigo-50 active:scale-95 text-[11px] font-bold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 shadow-xs cursor-pointer"
            >
              🚀 Subir a GitHub
            </button>
            <a
              href="/codigo.html"
              download="index.html"
              onClick={() => addToast('success', 'Descargando index.html listo para GitHub', 'Descarga iniciada')}
              className="bg-indigo-950/60 hover:bg-indigo-950/80 active:scale-95 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer border border-white/20"
            >
              ⬇️ Descargar
            </a>
          </div>
        </div>

        {/* Main Tab Content */}
        <main className="flex-1 p-4 overflow-y-auto">
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
          className={`fixed bottom-20 right-4 sm:right-[calc(50%-200px)] w-13 h-13 text-white rounded-full flex items-center justify-center shadow-xl z-30 transition-transform active:scale-90 hover:scale-105 cursor-pointer ${
            currentTab === 'servicios'
              ? 'bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-600/40'
              : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/40'
          }`}
          aria-label={currentTab === 'servicios' ? 'Programar o registrar servicio' : 'Registrar nueva carga de combustible'}
          title={currentTab === 'servicios' ? 'Nuevo Servicio' : 'Nueva Carga de Combustible'}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* Bottom Navigation */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
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

      <ExportCodeModal
        isOpen={isExportCodeModalOpen}
        onClose={() => setIsExportCodeModalOpen(false)}
        onShowToast={addToast}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
      />

      <GitHubUploaderModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onShowToast={addToast}
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
