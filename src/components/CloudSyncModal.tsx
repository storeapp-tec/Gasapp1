import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Cloud,
  Download,
  Upload,
  Share2,
  Copy,
  Check,
  HardDrive,
  RefreshCw,
  LogOut,
  User,
  ShieldCheck,
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
  FileCode,
  Sparkles,
  Car,
} from 'lucide-react';
import { AppData } from '../types';
import { exportDataToCSV, normalizeAppData, NISSAN_MARCH_BACKUP } from '../utils/calculations';
import { GoogleDriveService, GoogleDriveSyncState } from '../utils/googleDriveService';

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
  const [driveState, setDriveState] = useState<GoogleDriveSyncState>(() => GoogleDriveService.getSavedState());
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailHint, setEmailHint] = useState('latynx@gmail.com');
  const [jsonInputText, setJsonInputText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDriveState(GoogleDriveService.getSavedState());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(appData, null, 2);

  // Direct Google Drive Connect via Firebase Auth Popup
  const handleProceedGoogleSignIn = async (userEmail?: string) => {
    setIsLoading(true);
    setShowEmailPrompt(false);
    try {
      const { accessToken, user } = await GoogleDriveService.signInWithFirebaseGoogle(userEmail || emailHint);
      
      const newState: GoogleDriveSyncState = {
        isConnected: true,
        accessToken: accessToken,
        tokenExpiry: Date.now() + 3500 * 1000,
        user: user,
        lastSyncedAt: driveState.lastSyncedAt,
        backupFileId: driveState.backupFileId,
      };

      GoogleDriveService.saveState(newState);
      setDriveState(newState);
      onNotify('success', `Conectado como ${user.name || user.email || 'usuario de Google'}`, 'Google Drive Vinculado');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        onNotify('info', 'Ventana de autorización cancelada por el usuario.', 'Cancelado');
      } else {
        onNotify('danger', err.message || 'No se pudo autorizar Google Drive', 'Error de Conexión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogleDrive = () => {
    setShowEmailPrompt(true);
  };

  // Disconnect
  const handleDisconnect = async () => {
    await GoogleDriveService.signOutUser();
    setDriveState({
      isConnected: false,
      accessToken: null,
      tokenExpiry: null,
      user: null,
      lastSyncedAt: null,
      backupFileId: null,
    });
    onNotify('info', 'Desconectado de Google Drive', 'Sesión Cerrada');
  };

  // Backup to Drive
  const handleSaveToDrive = async () => {
    if (!driveState.accessToken) {
      handleConnectGoogleDrive();
      return;
    }

    setIsLoading(true);
    try {
      const res = await GoogleDriveService.saveToDrive(driveState.accessToken, appData);
      const nowStr = new Date().toLocaleString();
      
      const updated = {
        ...driveState,
        lastSyncedAt: nowStr,
        backupFileId: res.fileId,
      };
      GoogleDriveService.saveState(updated);
      setDriveState(updated);

      onNotify('success', '¡Datos guardados exitosamente en tu Google Drive (gasapp_backup.json)!', 'Respaldo en Nube OK');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('401') || err.message?.includes('token')) {
        onNotify('warning', 'Tu sesión de Google expiró. Por favor vuelve a conectar.', 'Sesión Expirada');
        handleConnectGoogleDrive();
      } else {
        onNotify('danger', err.message || 'Error al guardar en Google Drive', 'Error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Restore from Drive
  const handleRestoreFromDrive = async () => {
    if (!driveState.accessToken) {
      handleConnectGoogleDrive();
      return;
    }

    setIsLoading(true);
    try {
      const res = await GoogleDriveService.loadFromDrive(driveState.accessToken);
      const normalized = normalizeAppData(res.data);
      onImportData(normalized);
      const nowStr = new Date().toLocaleString();
      
      const updated = {
        ...driveState,
        lastSyncedAt: nowStr,
      };
      GoogleDriveService.saveState(updated);
      setDriveState(updated);

      onNotify('success', `¡Historial restaurado desde Google Drive (${normalized.fuels.length} cargas, ${normalized.services.length} servicios)!`, 'Datos Restaurados');
      onClose();
    } catch (err: any) {
      console.error(err);
      onNotify('danger', err.message || 'No se pudo descargar el respaldo de Google Drive', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `gasapp_respaldo_${appData.carName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    dl.click();
    onNotify('success', 'Archivo de respaldo JSON descargado correctamente', 'Respaldo Listo');
  };

  const handleDownloadSingleHTML = () => {
    const a = document.createElement('a');
    a.href = '/index_completo_para_github.html';
    a.download = 'index.html';
    a.click();
    onNotify('success', 'Descargando archivo index.html completo e independiente para GitHub', 'Descarga Iniciada');
  };

  const handleDownloadCSV = () => {
    const csvContent = exportDataToCSV(appData.fuels, appData.carName);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dl = document.createElement('a');
    dl.setAttribute('href', url);
    dl.setAttribute('download', `gasapp_registros_${new Date().toISOString().split('T')[0]}.csv`);
    dl.click();
    onNotify('success', 'Reporte Excel / CSV descargado exitosamente', 'Exportado');
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
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Google Drive y Respaldos
                </h2>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">Sincronización en tu nube personal</p>
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

          <div className="mt-4 space-y-3.5 text-xs">
            {/* ACCESO RÁPIDO: RESTAURAR NISSAN MARCH */}
            <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                    Respaldo Nissan March
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">
                    20 cargas (175,687 a 182,408 km) + 1 servicio
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

            {/* SECCIÓN PRINCIPAL: GOOGLE DRIVE */}
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-indigo-950/40 p-4 rounded-xl border border-sky-200 dark:border-sky-800/60 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-sm">
                  <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                      <path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/>
                      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.15 7.9 13.65z" fill="#ea4335"/>
                      <path d="M43.65 25 57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                    </svg>
                  </div>
                  <span>Google Drive Sync</span>
                </div>
                {driveState.isConnected ? (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Conectado
                  </span>
                ) : (
                  <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full">
                    Recomendado
                  </span>
                )}
              </div>

              {driveState.isConnected && driveState.user ? (
                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {driveState.user.picture ? (
                        <img src={driveState.user.picture} alt="Avatar" className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {driveState.user.name || 'Usuario Google'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {driveState.user.email || 'Cuenta vinculada'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="text-[11px] text-slate-500 hover:text-red-500 p-1 flex items-center gap-1 transition-colors"
                      title="Desconectar cuenta"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {driveState.lastSyncedAt && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                      Última sincronización: <span className="font-semibold text-slate-700 dark:text-slate-300">{driveState.lastSyncedAt}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleSaveToDrive}
                      className="flex-1 py-2 px-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold flex items-center justify-center gap-1.5 transition-all text-xs shadow-xs disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                      )}
                      <span>Guardar en Drive</span>
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleRestoreFromDrive}
                      className="flex-1 py-2 px-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-bold flex items-center justify-center gap-1.5 transition-all text-xs disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowDownCircle className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>Cargar de Drive</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Guarda y restaura tus cargas de gasolina y servicios directamente en tu cuenta de Google Drive para tenerlos sincronizados y seguros.
                  </p>

                  {showEmailPrompt ? (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          Ingresa tu correo de Google:
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowEmailPrompt(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          Cancelar
                        </button>
                      </div>
                      <input
                        type="email"
                        value={emailHint}
                        onChange={(e) => setEmailHint(e.target.value)}
                        placeholder="tu-correo@gmail.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleProceedGoogleSignIn(emailHint)}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold flex items-center justify-center gap-2 transition-all text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Continuar y Abrir Aprobación de Google</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleConnectGoogleDrive}
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold flex items-center justify-center gap-2 transition-all text-xs shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                      <span>Conectar con Google Drive</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: ARCHIVO JSON LOCAL / DESCARGA */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Respaldo en Archivo JSON</span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                  Sin internet
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors text-xs shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo</span>
                </button>
                <label className="flex-1 py-2 px-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Seleccionar Archivo</span>
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
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{showPasteArea ? 'Ocultar cuadro de texto JSON' : '¿No abre el selector? Pegar texto JSON directo aquí'}</span>
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
                      className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Restaurar desde Texto Pegado</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN: DESCARGAR INDEX.HTML PARA GITHUB */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5 text-xs">
                  <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Descargar Archivo index.html Completo</span>
                </div>
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-1.5 py-0.5 rounded-full">
                  1 Solo Archivo
                </span>
              </div>
              <p className="text-emerald-800/80 dark:text-emerald-200/80 text-[11px] leading-relaxed">
                Descarga un único archivo <strong>index.html</strong> que contiene todo el código, diseño y base de datos local listo para subir a GitHub o abrir con doble clic.
              </p>
              <button
                type="button"
                onClick={handleDownloadSingleHTML}
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold flex items-center justify-center gap-2 transition-all text-xs shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar index.html (Para GitHub)</span>
              </button>
            </div>

            {/* SECCIÓN 3: EXCEL / CSV */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Exportar a Excel / Google Sheets (.csv)</span>
                </div>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-full">
                  Universal
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Descarga tus registros en formato Excel compatible para analizar en hojas de cálculo.
              </p>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="w-full py-2 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar CSV para Excel / Sheets</span>
              </button>
            </div>

            {/* SECCIÓN 4: PORTAPAPELES */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                  Copiar Todo el Respaldo al Portapapeles
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  {appData.fuels.length} cargas • {appData.services.length} servicios
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyJSON}
                className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
