import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ServiceRecord } from '../types';
import { formatNumber, formatDateShort, formatCurrency, getServiceStatus } from '../utils/calculations';
import { Plus, AlertTriangle, AlertCircle, Trash2, Check, RotateCcw } from 'lucide-react';
import { CompleteServiceModal } from './CompleteServiceModal';

interface TabServiciosProps {
  services: ServiceRecord[];
  currentOdometer: number;
  onAddService: () => void;
  onDeleteService: (id: string, serviceName: string) => void;
  onToggleCompleteService: (
    id: string,
    completed: boolean,
    completionData?: { cost?: number; completedDate: string; completedOdometer: number; notes?: string }
  ) => void;
}

export const TabServicios: React.FC<TabServiciosProps> = ({
  services,
  currentOdometer,
  onAddService,
  onDeleteService,
  onToggleCompleteService,
}) => {
  // Default tab is 'pendientes'
  const [activeTab, setActiveTab] = useState<'pendientes' | 'realizados'>('pendientes');
  const [serviceToComplete, setServiceToComplete] = useState<ServiceRecord | null>(null);

  // Split into pending and completed
  const pendingServices = services
    .filter((s) => !s.completed)
    .sort((a, b) => a.serviceOdometer - b.serviceOdometer);

  const completedServices = services
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.completedDate || b.date).getTime() - new Date(a.completedDate || a.date).getTime());

  // Group warnings and urgent for pending services only
  const warnings: string[] = [];
  const urgent: string[] = [];

  pendingServices.forEach((service) => {
    const diff = service.serviceOdometer - currentOdometer;
    if (diff <= 1000 && diff > 500) {
      warnings.push(`${service.type} (a ${formatNumber(diff)} km)`);
    } else if (diff <= 500) {
      urgent.push(`${service.type} (${diff > 0 ? `a ${formatNumber(diff)} km` : 'VENCIDO'})`);
    }
  });

  const hasAlerts = urgent.length > 0 || warnings.length > 0;

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Modal for recording completion data (cost, date, odometer, notes) */}
      <CompleteServiceModal
        isOpen={!!serviceToComplete}
        onClose={() => setServiceToComplete(null)}
        service={serviceToComplete}
        currentOdometer={currentOdometer}
        onConfirm={(id, completionData) => {
          onToggleCompleteService(id, true, completionData);
          setServiceToComplete(null);
        }}
      />

      {/* Dynamic Semáforo Notification Banner (for pending items) */}
      {hasAlerts && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border shadow-xs ${
            urgent.length > 0
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {urgent.length > 0 ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-black uppercase tracking-wider">
                {urgent.length > 0 ? '🔔 ¡Atención Urgente de Mantenimiento!' : '🟡 Recordatorio de Servicios Próximos'}
              </div>
              <div className="text-xs font-semibold mt-1 leading-relaxed">
                {urgent.length > 0 && (
                  <p className="text-rose-700 dark:text-rose-300">
                    🔴 <strong>{urgent.join(', ')}</strong> — ¡Se recomienda agendar de inmediato!
                  </p>
                )}
                {warnings.length > 0 && (
                  <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                    🟡 <strong>{warnings.join(', ')}</strong> — Próximo a vencer.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Service Button */}
      <button
        type="button"
        onClick={onAddService}
        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>+ Programar / Registrar Nuevo Servicio</span>
      </button>

      {/* Sub-Tabs: Pendientes (Default) vs Realizados */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pendientes'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>⏳ Pendientes</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            activeTab === 'pendientes'
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {pendingServices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('realizados')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'realizados'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>✓ Realizados</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
            activeTab === 'realizados'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {completedServices.length}
          </span>
        </button>
      </div>

      {/* Services List Content */}
      <div>
        <div className="flex justify-between items-center px-1 mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {activeTab === 'pendientes'
              ? `Servicios Programados (${pendingServices.length})`
              : `Historial de Mantenimientos Realizados (${completedServices.length})`}
          </h3>
        </div>

        {/* PENDIENTES VIEW */}
        {activeTab === 'pendientes' && (
          <>
            {pendingServices.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                  ✨
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No tienes servicios pendientes</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
                  Tu vehículo está al día. Puedes programar un nuevo servicio de cambio de aceite o afinación cuando lo requieras.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingServices.map((service) => {
                  const status = getServiceStatus(service.serviceOdometer, currentOdometer);
                  const diff = service.serviceOdometer - currentOdometer;
                  const kmDisplay = diff > 0 ? `${formatNumber(diff)} km` : 'VENCIDO';

                  return (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.005 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/70 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-2xl shrink-0 mt-0.5">{status.emoji}</span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {service.type}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>📅 {formatDateShort(service.date)}</span>
                              <span>•</span>
                              <span className="font-semibold">Objetivo: {formatNumber(service.serviceOdometer)} km</span>
                              {service.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic truncate max-w-[150px]">{service.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-slate-900 dark:text-white font-mono leading-none">
                            {kmDisplay}
                          </div>
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${status.badgeClass}`}>
                            {status.message}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                        <button
                          type="button"
                          onClick={() => setServiceToComplete(service)}
                          className="flex-1 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Marcar como Realizado</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteService(service.id, service.type)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* REALIZADOS VIEW */}
        {activeTab === 'realizados' && (
          <>
            {completedServices.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                  📋
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Sin historial de servicios realizados</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
                  Al completar un mantenimiento pendiente o registrar uno pasado, aparecerá guardado en este historial.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedServices.map((service) => {
                  const odoDone = service.completedOdometer || service.serviceOdometer;
                  const dateDone = service.completedDate || service.date;

                  return (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.005 }}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/70 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {service.type}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>📅 Realizado el {formatDateShort(dateDone)}</span>
                              <span>•</span>
                              <span className="font-semibold font-mono">{formatNumber(odoDone)} km</span>
                            </div>
                            {service.cost !== undefined && service.cost > 0 && (
                              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                Costo: {formatCurrency(service.cost)}
                              </div>
                            )}
                            {service.notes && (
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-0.5">
                                📝 {service.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                            ✓ Realizado
                          </span>
                        </div>
                      </div>

                      {/* Action buttons for completed item */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleCompleteService(service.id, false)}
                          className="py-1 px-2.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
                          title="Volver a poner como pendiente"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Mover a Pendientes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteService(service.id, service.type)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

