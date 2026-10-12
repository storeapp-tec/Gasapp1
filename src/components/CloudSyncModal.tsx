import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  HardDrive,
  FileCode,
  Sparkles,
  Car,
  Bell,
  Calendar
} from 'lucide-react';
import { AppData } from '../types';
import { exportDataToCSV, normalizeAppData, NISSAN_MARCH_BACKUP } from '../utils/calculations';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onImportData: (data: AppData) => void;
  onNotify: (type: 'success' | 'warning' | 'danger' | 'info', message: string, title?: string) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  appData,
  onImportData,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(appData, null, 2);

  const getLastBackupInfo = () => {
    try {
      const lastDateStr = localStorage.getItem('gasapp_last_backup_date');
      if (!lastDateStr) return { days: 999, text: 'Nunca respaldado en este dispositivo' };
      const diffTime = Math.abs(Date.now() - new Date(lastDateStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return { days: 0, text: 'Respaldado hoy' };
      if (diffDays === 1) return { days: 1, text: 'Respaldado ayer' };
      return { days: diffDays, text: `Último respaldo hace ${diffDays} días` };
    } catch {
      return { days: 0, text: 'Estado desconocido' };
    }
  };

  const backupInfo = getLastBackupInfo();
  const needsBackup = backupInfo.days >= 7;

  const handleDownloadWeeklyBackup = () => {
    // 1. Download JSON
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const dl1 = document.createElement('a');
    dl1.setAttribute('href', dataStr);
    dl1.setAttribute('download', `gasapp_respaldo_${appData.carName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    dl1.click();

    // 2. Download CSV
    const csvContent = exportDataToCSV(appData.fuels, appData.carName);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dl2 = document.createElement('a');
    dl2.setAttribute('href', url);
    dl2.setAttribute('download', `gasapp_registros_${new Date().toISOString().split('T')[0]}.csv`);
    dl2.click();

    // 3. Save timestamp
    try {
      localStorage.setItem('gasapp_last_backup_date', new Date().toISOString());
    } catch {}

    onNotify('success', '¡Respaldo semanal generado! Se descargaron JSON y CSV automáticamente en tu celular.', '¡Respaldo Local Exitoso!');
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `gasapp_respaldo_${appData.carName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    dl.click();
    try {
      localStorage.setItem('gasapp_last_backup_date', new Date().toISOString());
    } catch {}
    onNotify('success', 'Archivo de respaldo JSON descargado correctamente', 'Respaldo Listo');
  };

  const handleDownloadCSV = () => {
    const csvContent = exportDataToCSV(appData.fuels, appData.carName);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dl = document.createElement('a');
    dl.setAttribute('href', url);
    dl.setAttribute('download', `gasapp_registros_${new Date().toISOString().split('T')[0]}.csv`);
    dl.click();
    try {
      localStorage.setItem('gasapp_last_backup_date', new Date().toISOString());
    } catch {}
    onNotify('success', 'Reporte Excel / CSV generado y descargado automáticamente', 'CSV Exportado');
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotify('info', 'Copia de respaldo copiada al portapapeles', 'Copiado');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const normalized = normalizeAppData(parsed);
        onImportData(normalized);
        onNotify('success', `¡Datos restaurados con éxito (${normalized.fuels.length} cargas, ${normalized.services.length} servicios)!`, 'Sincronizado');
        onClose();
      } catch (err: any) {
        onNotify('danger', err.message || 'No se pudo leer el archivo JSON seleccionado.', 'Error de archivo');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFromText = () => {
    if (!jsonInputText.trim()) {
      onNotify('warning', 'Por favor pega el contenido de tu respaldo JSON en el campo de texto.', 'Texto Vacío');
      return;
    }
    try {
      const parsed = JSON.parse(jsonInputText.trim());
      const normalized = normalizeAppData(parsed);
      onImportData(normalized);
      onNotify('success', `¡Respaldo importado correctamente (${normalized.fuels.length} cargas, ${normalized.services.length} servicios)!`, '¡Restaurado!');
      setJsonInputText('');
      setShowPasteArea(false);
      onClose();
    } catch (err: any) {
      onNotify('danger', 'El texto pegado no es un JSON válido. Verifica que esté completo.', 'Error de formato');
    }
  };

  const handleRestoreNissanMarch = () => {
    onImportData(NISSAN_MARCH_BACKUP);
    onNotify('success', `¡Respaldo de ${NISSAN_MARCH_BACKUP.carName} cargado con éxito (20 cargas, 1 servicio)!`, 'Datos Cargados');
    onClose();
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
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Respaldo y Seguridad
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">Guardado local y recordatorio semanal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5 text-xs">
            {/* SECCIÓN PRINCIPAL: RECORDATORIO Y RESPALDO SEMANAL AUTOMÁTICO */}
            <div className={`p-4 rounded-xl border space-y-3 shadow-xs ${needsBackup ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/40 border-amber-300 dark:border-amber-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-slate-800/80 dark:to-indigo-950/40 border-indigo-200 dark:border-indigo-800/60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-sm">
                  <div className={`w-7 h-7 rounded-lg shadow-xs flex items-center justify-center ${needsBackup ? 'bg-amber-500 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>Recordatorio de Respaldo Semanal</span>
                      {needsBackup && (
                        <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded-full animate-bounce">
                          ⚠️ ¡Hora de Respaldar!
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{backupInfo.text}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                {needsBackup
                  ? '⚠️ Han pasado más de 7 días desde tu último respaldo. Haz clic abajo para descargar automáticamente tu archivo JSON y tu reporte en Excel (CSV) en tu celular.'
                  : 'Protege tu información. Recomendamos generar tu respaldo semanal automático (JSON + CSV) para guardar en tu dispositivo.'}
              </p>

              <button
                type="button"
                onClick={handleDownloadWeeklyBackup}
                className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white font-bold flex items-center justify-center gap-2 transition-all text-xs shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>⚡ Respaldar Automático (Descargar JSON + CSV)</span>
              </button>
            </div>

            {/* SECCIÓN 2: ARCHIVO JSON LOCAL / DESCARGA */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Respaldo en Archivo JSON Individual</span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                  Local
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors text-xs shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar JSON</span>
                </button>
                <label className="flex-1 py-2 px-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cargar JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* PEGAR JSON DIRECTAMENTE */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{showPasteArea ? 'Ocultar cuadro de texto JSON' : '¿No abre el archivo? Pegar texto JSON directo aquí'}</span>
                </button>

                {showPasteArea && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      rows={4}
                      value={jsonInputText}
                      onChange={(e) => setJsonInputText(e.target.value)}
                      placeholder='Pega aquí tu código JSON, ejemplo: {"carName":"Nissan March","fuels":[...]}'
                      className="w-full p-2 text-[10px] font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleRestoreFromText}
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Restaurar desde Texto Pegado</span>
                    </button>
                  </div>
                )}
              </div>
            </div>


            {/* SECCIÓN 3: EXCEL / CSV */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Reporte Excel / Google Sheets (.csv)</span>
                </div>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-full">
                  CSV
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Genera y descarga un reporte en formato CSV compatible con Excel, Numbers o Google Sheets.
              </p>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="w-full py-2 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar CSV Automático</span>
              </button>
            </div>

            {/* ACCESO RÁPIDO: RESTAURAR NISSAN MARCH */}
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                    Datos de Ejemplo (Nissan March)
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">
                    20 cargas + 1 servicio de prueba
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRestoreNissanMarch}
                className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
