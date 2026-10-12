import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  FolderGit2,
  GitBranch,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Check,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface GitHubUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface FileToUpload {
  path: string;
  sourceUrl: string;
  label: string;
  description: string;
  isBinary?: boolean;
}

const FILES_LIST: FileToUpload[] = [
  {
    path: 'index.html',
    sourceUrl: '/codigo.html',
    label: 'index.html',
    description: 'Aplicación completa autónoma (UI, scripts y soporte de datos offline)',
    isBinary: false,
  },
  {
    path: 'manifest.json',
    sourceUrl: '/manifest.json',
    label: 'manifest.json',
    description: 'Configuración PWA para instalación móvil e iconos',
    isBinary: false,
  },
  {
    path: 'sw.js',
    sourceUrl: '/sw.js',
    label: 'sw.js',
    description: 'Service Worker para abrir por datos y almacenar en caché',
    isBinary: false,
  },
  {
    path: 'icon-192.png',
    sourceUrl: '/icon-192.png',
    label: 'icon-192.png',
    description: 'Icono de aplicación 192x192',
    isBinary: true,
  },
  {
    path: 'icon-512.png',
    sourceUrl: '/icon-512.png',
    label: 'icon-512.png',
    description: 'Icono de aplicación 512x512',
    isBinary: true,
  },
];

export const GitHubUploaderModal: React.FC<GitHubUploaderModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [repo, setRepo] = useState('storeapp-tec/Gasapp1');
  const [branch, setBranch] = useState('main');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar token guardado de localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('gasapp_github_token');
    if (savedToken) {
      setToken(savedToken);
    }
    const savedRepo = localStorage.getItem('gasapp_github_repo');
    if (savedRepo) {
      setRepo(savedRepo);
    }
  }, []);

  if (!isOpen) return null;

  // Convierte un ArrayBuffer a Base64 de forma compatible con binarios y UTF-8
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const handleUploadToGitHub = async () => {
    const cleanRepo = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    const cleanToken = token.trim();
    const cleanBranch = branch.trim() || 'main';

    if (!cleanRepo || !cleanRepo.includes('/')) {
      onShowToast('error', 'El formato del repositorio debe ser usuario/repositorio (ej. storeapp-tec/Gasapp1)');
      return;
    }

    if (!cleanToken) {
      onShowToast('error', 'Por favor ingresa tu GitHub Personal Access Token');
      return;
    }

    // Guardar para conveniencia
    localStorage.setItem('gasapp_github_token', cleanToken);
    localStorage.setItem('gasapp_github_repo', cleanRepo);

    setIsUploading(true);
    setUploadStatus('running');
    setErrorMessage('');
    setProgressLog([`⏳ Conectando con GitHub API para ${cleanRepo}...`]);

    try {
      // 1. Verificar existencia del repositorio
      const checkRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!checkRes.ok) {
        if (checkRes.status === 401) {
          throw new Error('Token inválido o expirado. Asegúrate de copiar el token completo.');
        } else if (checkRes.status === 404) {
          throw new Error(`Repositorio "${cleanRepo}" no encontrado. Verifica si el nombre está bien escrito o si tu token tiene permiso "repo".`);
        } else {
          const errData = await checkRes.json().catch(() => ({}));
          throw new Error(errData.message || `Error al verificar repositorio (${checkRes.status})`);
        }
      }

      const repoData = await checkRes.json();
      setProgressLog((prev) => [...prev, `✅ Repositorio verificado: ${repoData.full_name} (${repoData.private ? 'Privado' : 'Público'})`]);

      // 2. Subir cada archivo secuencialmente
      for (const item of FILES_LIST) {
        setProgressLog((prev) => [...prev, `📦 Descargando ${item.label} localmente...`]);

        const fetchRes = await fetch(item.sourceUrl);
        if (!fetchRes.ok) {
          throw new Error(`No se pudo obtener el archivo local ${item.sourceUrl}`);
        }

        const buffer = await fetchRes.arrayBuffer();
        const base64Content = arrayBufferToBase64(buffer);

        // 3. Revisar si el archivo ya existe en GitHub para obtener su sha
        let sha: string | undefined = undefined;
        const fileCheckRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/contents/${item.path}?ref=${cleanBranch}`,
          {
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (fileCheckRes.ok) {
          const existingData = await fileCheckRes.json();
          sha = existingData.sha;
        }

        setProgressLog((prev) => [
          ...prev,
          `🚀 Subiendo ${item.label} a la rama "${cleanBranch}" ${sha ? '(actualizando existente)' : '(nuevo)'}...`,
        ]);

        // 4. Subir (PUT) a GitHub Contents API
        const uploadRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/contents/${item.path}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${cleanToken}`,
              'Content-Type': 'application/json',
              Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
              message: `Actualizar ${item.path} de GasApp`,
              content: base64Content,
              branch: cleanBranch,
              ...(sha ? { sha } : {}),
            }),
          }
        );

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.message || `Error al subir ${item.path} (${uploadRes.status})`);
        }

        setProgressLog((prev) => [...prev, `✅ ${item.label} subido exitosamente a GitHub`]);
      }

      setUploadStatus('success');
      setProgressLog((prev) => [
        ...prev,
        `🎉 ¡Todos los archivos se sincronizaron con éxito en ${cleanRepo}!`,
      ]);
      onShowToast('success', `¡Archivos subidos exitosamente a ${cleanRepo}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado durante la subida';
      setUploadStatus('error');
      setErrorMessage(msg);
      setProgressLog((prev) => [...prev, `❌ Error: ${msg}`]);
      onShowToast('error', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSingle = (filename: string, url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('success', `Descargado: ${filename}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/40 border border-indigo-400/30 rounded-xl">
              <FolderGit2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Publicar en GitHub</h3>
              <p className="text-xs text-indigo-200/80">Repositorio: {repo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 active:scale-90 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('auto')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'auto'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Subida Automática (Recomendada)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            Subida Manual (Web GitHub)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800 dark:text-slate-200 text-sm flex-1">
          {activeTab === 'auto' ? (
            <>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Sube index.html, manifest.json y Service Worker directo a tu repo
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Todo se envía seguro desde tu navegador usando la API oficial de GitHub sin intermediarios.
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                {/* Repositorio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Repositorio de GitHub:</span>
                    <a
                      href={`https://github.com/${repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 text-[11px] hover:underline flex items-center gap-0.5"
                    >
                      Ver en GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={repo}
                      onChange={(e) => setRepo(e.target.value)}
                      placeholder="usuario/repositorio (ej. storeapp-tec/Gasapp1)"
                      className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <FolderGit2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Rama */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rama (Branch):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-2 pl-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <GitBranch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Token */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      GitHub Personal Access Token (PAT):
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=GasApp-Direct-Uploader"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold hover:underline flex items-center gap-1"
                    >
                      🔑 Generar Token en 1 clic
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx o github_pat_xxxxxxxxxxxx"
                      className="w-full px-3 py-2 pl-9 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Solo requiere el permiso marcado: <strong>repo</strong> (o si es token fine-grained: Contents &quot;Read and Write&quot;).
                  </p>
                </div>
              </div>

              {/* Botón de acción */}
              <button
                type="button"
                onClick={handleUploadToGitHub}
                disabled={isUploading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Subiendo a GitHub...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Subir Archivos a {repo} Ahora
                  </>
                )}
              </button>

              {/* Progress and status logger */}
              {progressLog.length > 0 && (
                <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs font-mono max-h-40 overflow-y-auto space-y-1">
                  {progressLog.map((log, idx) => (
                    <div key={idx} className="leading-tight">
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {/* Éxito */}
              {uploadStatus === 'success' && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>¡Repositorio actualizado con éxito!</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    Los archivos <strong>index.html</strong>, <strong>manifest.json</strong> y <strong>sw.js</strong> ya están en tu repositorio.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={`https://github.com/${repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      Abrir Repositorio en GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                    >
                      Abrir Web Pública (GitHub Pages) <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Error */}
              {uploadStatus === 'error' && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Ocurrió un error al subir</span>
                  </div>
                  <p className="text-rose-700 dark:text-rose-300">{errorMessage}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] pt-1">
                    Puedes verificar que tu token tenga activado el permiso <strong>&quot;repo&quot;</strong> o usar la pestaña &quot;Subida Manual&quot;.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Subida manual */
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1">
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  ¿Cómo subirlo directamente en la página web de GitHub?
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  No necesitas token de acceso. Solo descargas los archivos con los botones de abajo y los arrastras a GitHub.
                </p>
              </div>

              {/* Paso 1: Descargar archivos */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Descarga los archivos a tu equipo:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle('index.html', '/codigo.html')}
                    className="p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 flex items-center justify-between cursor-pointer"
                  >
                    <div className="text-left">
                      <div className="font-bold text-indigo-950 dark:text-indigo-200">index.html</div>
                      <div className="text-[10px] text-slate-500">App completa con datos</div>
                    </div>
                    <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingle('manifest.json', '/manifest.json')}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div className="text-left">
                      <div className="font-bold text-slate-800 dark:text-slate-200">manifest.json</div>
                      <div className="text-[10px] text-slate-500">Configuración PWA</div>
                    </div>
                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingle('sw.js', '/sw.js')}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                  >
                    <div className="text-left">
                      <div className="font-bold text-slate-800 dark:text-slate-200">sw.js</div>
                      <div className="text-[10px] text-slate-500">Service Worker</div>
                    </div>
                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Paso 2: Ir a GitHub */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Abre la página de subida de GitHub:
                </div>
                <a
                  href={`https://github.com/${repo}/upload/main`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  Abrir https://github.com/{repo}/upload/main <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Paso 3: Arrastrar y Commit */}
              <div className="space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Arrastra los archivos y presiona &quot;Commit changes&quot;
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-6">
                  Arrastra el archivo <strong>index.html</strong> descargado al área que dice &quot;Drag files here to add them to your repository&quot; y haz clic en el botón verde <strong>Commit changes</strong>.
                </p>
              </div>

              {/* Paso 4: Activar GitHub Pages */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-1">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Para que tu app funcione en vivo en internet (GitHub Pages):
                </span>
                <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Ve a <strong>Settings</strong> ➔ <strong>Pages</strong> en tu repositorio.</li>
                  <li>En <strong>Build and deployment &gt; Branch</strong> selecciona <strong>main</strong> y carpeta <strong>/ (root)</strong>.</li>
                  <li>Haz clic en <strong>Save</strong>.</li>
                  <li>¡Tu app estará en vivo en: <strong className="text-indigo-600 dark:text-indigo-400">https://{repo.split('/')[0]}.github.io/{repo.split('/')[1]}/</strong>!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <a
            href={`https://github.com/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Ir a {repo} <ExternalLink className="w-3 h-3" />
          </a>
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
