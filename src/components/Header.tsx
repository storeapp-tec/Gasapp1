import React, { useState } from 'react';
import { MoreVertical, Download, Upload, HardDrive, Sun, Moon, Type, Bell } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenTripCalculator: () => void;
  onOpenCloudSync: () => void;
  onOpenAppearance: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportJSON: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenTripCalculator,
  onOpenCloudSync,
  onOpenAppearance,
  onExportJSON,
  onExportCSV,
  onImportJSON,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getLastBackupInfo = () => {
    try {
      const lastDateStr = localStorage.getItem('gasapp_last_backup_date');
      if (!lastDateStr) return { days: 999 };
      const diffTime = Math.abs(Date.now() - new Date(lastDateStr).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { days: diffDays };
    } catch {
      return { days: 0 };
    }
  };

  const backupInfo = getLastBackupInfo();
  const needsBackup = backupInfo.days >= 7;

  return (
    <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white flex-shrink-0 z-30 rounded-b-xl shadow-md px-3 py-1.5 transition-colors duration-300">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none select-none shrink-0" aria-hidden="true">⛽</span>
          <div className="font-extrabold text-base tracking-tight leading-none flex items-center gap-1.5">
            <span>GasApp</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-slate-800 text-blue-300 border border-slate-700">
              PRO
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Backup Reminder / Notification Button */}
          <button
            type="button"
            onClick={onOpenCloudSync}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
              needsBackup
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
            }`}
            title="Respaldos y Recordatorio Semanal"
          >
            <Bell className={`w-3.5 h-3.5 ${needsBackup ? 'text-white' : 'text-blue-400'}`} />
            <span className="hidden sm:inline">Respaldar</span>
            {needsBackup && (
              <span className="w-2 h-2 bg-amber-300 rounded-full" />
            )}
          </button>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-sm cursor-pointer border ${
              theme === 'dark'
                ? 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100'
                : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
            }`}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Alternar tema claro y oscuro"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-slate-900 stroke-[2.25]" />
            ) : (
              <Moon className="w-4 h-4 text-white stroke-[2.25]" />
            )}
          </button>

          {/* 3-dots Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-colors text-white cursor-pointer"
              aria-label="Opciones de menú"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-10 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-slate-800 dark:text-slate-200 text-xs font-medium animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    Opciones y Ajustes
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAppearance();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Fuente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenCloudSync();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Respaldos</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onExportJSON();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Descargar Respaldo JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onExportCSV();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Exportar a Excel (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onImportJSON();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Restaurar Archivo JSON</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
