import React from 'react';
import { Type, Sparkles, Check, Eye, RefreshCw, X } from 'lucide-react';
import { TextSizeOption, FontFamilyOption } from '../types';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  textSize: TextSizeOption;
  onChangeTextSize: (size: TextSizeOption) => void;
  fontFamily: FontFamilyOption;
  onChangeFontFamily: (font: FontFamilyOption) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  isOpen,
  onClose,
  textSize,
  onChangeTextSize,
  fontFamily,
  onChangeFontFamily,
  theme,
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  const textSizes: { id: TextSizeOption; label: string; desc: string; sample: string }[] = [
    { id: 'sm', label: 'Compacto', desc: 'Tamaño estándar original', sample: '12.5 km/L' },
    { id: 'md', label: 'Cómodo', desc: 'Recomendado (+10% tamaño)', sample: '13.8 km/L' },
    { id: 'lg', label: 'Grande', desc: 'Alta legibilidad (+25% tamaño)', sample: '15.2 km/L' },
    { id: 'xl', label: 'Extra Grande', desc: 'Máxima visibilidad (+40% tamaño)', sample: '16.5 km/L' },
  ];

  const fontFamilies: { id: FontFamilyOption; name: string; desc: string; previewClass: string }[] = [
    {
      id: 'default',
      name: 'Plus Jakarta Sans',
      desc: 'Moderna y estilizada (Predeterminada)',
      previewClass: 'font-sans font-medium',
    },
    {
      id: 'lexend',
      name: 'Lexend',
      desc: 'Diseñada científicamente para facilitar la lectura rápida',
      previewClass: 'font-lexend font-medium',
    },
    {
      id: 'atkinson',
      name: 'Atkinson Hyperlegible',
      desc: 'Creada por el Instituto Braille para baja visión y distinción clara',
      previewClass: 'font-atkinson font-medium',
    },
    {
      id: 'system',
      name: 'Sistema / Clásica',
      desc: 'Tipografía nativa de tu dispositivo (Roboto / SF Pro / Segoe)',
      previewClass: 'font-system font-medium',
    },
  ];

  return (
    <div
      id="appearance-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="appearance-modal-container"
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Fuente
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ajusta el tamaño y estilo de letra
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5">
          {/* Visual Live Preview Box */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1 mb-1.5">
              <Eye className="w-3 h-3" />
              <span>Vista Previa en Vivo</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 space-y-1 shadow-xs">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-800 dark:text-slate-100">Última Carga: Nissan March</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">14.8 km/L</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span>Odómetro: <strong>142,500 km</strong></span>
                <span>Costo: <strong>$850.00</strong></span>
              </div>
            </div>
          </div>

          {/* SIZES SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              1. Tamaño de Texto
            </label>
            <div className="grid grid-cols-2 gap-2">
              {textSizes.map((item) => {
                const isSelected = textSize === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeTextSize(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FONT SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              2. Tipo de Letra (Fuente)
            </label>
            <div className="space-y-2">
              {fontFamilies.map((item) => {
                const isSelected = fontFamily === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeFontFamily(item.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className={`text-sm ${item.previewClass}`}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onChangeTextSize('md');
              onChangeFontFamily('lexend');
            }}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Recomendado (Cómodo + Lexend)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
