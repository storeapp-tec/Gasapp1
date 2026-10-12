import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, FileText, ExternalLink, X, ShieldCheck, FolderGit2, ArrowRight } from 'lucide-react';

interface ExportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onOpenGitHub?: () => void;
}

export const ExportCodeModal: React.FC<ExportCodeModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onOpenGitHub,
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const downloadFile = (filename: string, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('success', `Archivo ${filename} descargado exitosamente`);
  };

  const handleCopyCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/codigo.txt');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onShowToast('success', '¡Código completo (606 KB) copiado al portapapeles!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'No se pudo copiar automáticamente. Usa la descarga de archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <FileCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Código Completo de la App</h3>
              <p className="text-xs text-white/80">Para GitHub, Hosting o copia local</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 active:scale-90 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-slate-800 dark:text-slate-200 text-sm">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Aquí tienes el archivo <strong>100% completo y compilado</strong> con todos los estilos, scripts, iconos y funciones integradas sin depender de servidores externos:
          </p>

          <div className="space-y-2.5">
            {/* Destacado: Subir a GitHub storeapp-tec/Gasapp1 */}
            {onOpenGitHub && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGitHub();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-purple-400 dark:border-purple-600 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-indigo-500/20 hover:to-purple-500/20 transition-all cursor-pointer group text-left shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform shadow-xs">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-purple-950 dark:text-purple-200 text-sm flex items-center gap-1.5">
                      Subir a GitHub (storeapp-tec/Gasapp1)
                      <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded-full">Directo</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Sincroniza index.html, manifest.json y sw.js en 1 clic
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* Opción 1: Descargar index.html */}
            <button
              type="button"
              onClick={() => downloadFile('index.html', '/codigo.html')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 text-sm">
                    Descargar como index.html
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Listo para subir directo a GitHub Pages o hosting
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>

            {/* Opción 2: Descargar como .txt */}
            <button
              type="button"
              onClick={() => downloadFile('codigo_app.txt', '/codigo.txt')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                    Descargar como archivo .TXT
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Abre en Bloc de Notas / Editor sin errores
                  </div>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>

            {/* Opción 3: Copiar al portapapeles */}
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold text-purple-950 dark:text-purple-200 text-sm">
                    {copied ? '¡Código Copiado al Portapapeles!' : 'Copiar Todo el Código'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Copia los 606 KB directamente a la memoria de tu equipo
                  </div>
                </div>
              </div>
              {copied ? (
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Listo</span>
              ) : (
                <Copy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Incluye el Service Worker, Manifest, PWA offline y datos locales protegidos.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
