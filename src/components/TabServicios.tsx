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
    <div className="space-y-1.5 pb-1">
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
        <div
          className={`px-3 py-2 rounded-2xl border shadow-xs ${
            urgent.length > 0
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
              : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
          }`}
        >
          <div className="flex items-start gap-2">
            {urgent.length > 0 ? (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-black uppercase tracking-wider">
                {urgent.length > 0 ? '🔔 ¡Atención Urgente de Mantenimiento!' : '🟡 Recordatorio de Servicios Próximos'}
              </div>
              <div className="text-sm font-semibold mt-0.5 leading-snug">
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
        </div>
      )}

      {/* Add Service Button */}
      <button
        type="button"
        onClick={onAddService}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[15px] shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Programar / Registrar Nuevo Servicio</span>
      </button>

      {/* Sub-Tabs: Pendientes (Default) vs Realizados */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          className={`py-1.5 px-3 rounded-lg text-[15px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'pendientes'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>⏳ Pendientes</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-extrabold leading-none ${
            activeTab === 'pendientes'
              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {pendingServices.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('realizados')}
          className={`py-1.5 px-3 rounded-lg text-[15px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'realizados'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>✓ Realizados</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-extrabold leading-none ${
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
        <div className="flex justify-between items-center px-1 mb-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {activeTab === 'pendientes'
              ? `Servicios Programados (${pendingServices.length})`
              : `Mantenimientos Realizados (${completedServices.length})`}
          </h3>
        </div>

        {/* PENDIENTES VIEW */}
        {activeTab === 'pendientes' && (
          <>
            {pendingServices.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 text-center border border-dashed border-slate-300 dark:border-slate-800">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 text-2xl">
                  ✨
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No tienes servicios pendientes</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
                  Tu vehículo está al día. Puedes programar un nuevo servicio cuando lo requieras.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingServices.map((service) => {
                  const status = getServiceStatus(service.serviceOdometer, currentOdometer);
                  const diff = service.serviceOdometer - currentOdometer;
                  const kmDisplay = diff > 0 ? `${formatNumber(diff)} km` : 'VENCIDO';

                  return (
                    <div
                      key={service.id}
                      className="bg-white dark:bg-slate-900 rounded-xl px-3 py-2 shadow-xs border border-slate-200/70 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-2xl shrink-0">{status.emoji}</span>
                          <div className="min-w-0">
                            <div className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug">
                              {service.type}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span>📅 {formatDateShort(service.date)}</span>
                              <span>·</span>
                              <span className="font-semibold tabular-nums">Meta: {formatNumber(service.serviceOdometer)} km</span>
                              {service.notes && (
                                <>
                                  <span>·</span>
                                  <span className="italic truncate max-w-[170px]">{service.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums leading-none">
                            {kmDisplay}
                          </div>
                          <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 leading-none ${status.badgeClass}`}>
                            {status.message}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                        <button
                          type="button"
                          onClick={() => setServiceToComplete(service)}
                          className="flex-1 py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Marcar como Realizado</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteService(service.id, service.type)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 text-center border border-dashed border-slate-300 dark:border-slate-800">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 text-2xl">
                  📋
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Sin historial de servicios realizados</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto">
                  Al completar un mantenimiento pendiente o registrar uno pasado, aparecerá guardado aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {completedServices.map((service) => {
                  const odoDone = service.completedOdometer || service.serviceOdometer;
                  const dateDone = service.completedDate || service.date;

                  return (
                    <div
                      key={service.id}
                      className="bg-white dark:bg-slate-900 rounded-xl px-3 py-2 shadow-xs border border-slate-200/70 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug">
                              {service.type}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                              <span>📅 {formatDateShort(dateDone)}</span>
                              <span>·</span>
                              <span className="font-semibold font-mono tabular-nums">{formatNumber(odoDone)} km</span>
                            </div>
                            {service.cost !== undefined && service.cost > 0 && (
                              <div className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                                Costo: {formatCurrency(service.cost)}
                              </div>
                            )}
                            {service.notes && (
                              <div className="text-sm text-slate-600 dark:text-slate-400 italic mt-0.5">
                                📝 {service.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                            ✓ Realizado
                          </span>
                        </div>
                      </div>

                      {/* Action buttons for completed item */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80 gap-2">
                        <button
                          type="button"
                          onClick={() => onToggleCompleteService(service.id, false)}
                          className="py-1 px-2.5 rounded-lg text-[13px] font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Volver a poner como pendiente"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Mover a Pendientes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteService(service.id, service.type)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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

