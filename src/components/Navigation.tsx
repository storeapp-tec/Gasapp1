import React from 'react';
import { LayoutDashboard, History, Wrench } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  serviceAlertCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  serviceAlertCount,
}) => {
  const tabs = [
    { id: 'inicio', label: 'Resumen', icon: LayoutDashboard },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'servicios', label: 'Servicios', icon: Wrench, badge: serviceAlertCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around h-11 px-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 h-full min-h-[44px] px-1 flex items-center justify-center gap-1.5 relative transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
              }`}
            >
              <div className="relative shrink-0">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-sm leading-none tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="absolute top-0 left-3 right-3 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
