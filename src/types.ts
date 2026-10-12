export interface FuelRecord {
  id: string;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  date: string;
  totalCost: number;
  notes?: string;
  gasStation?: string;
}

export interface ComputedFuelRecord extends FuelRecord {
  kmDiff: number;
  calculatedConsumption: number | null; // km / L
  isFullTank: boolean; // true if liters >= tankThreshold (default 38L)
}

export interface ServiceRecord {
  id: string;
  type: string;
  serviceOdometer: number;
  date: string;
  cost?: number;
  notes?: string;
  completed?: boolean;
  completedDate?: string;
  completedOdometer?: number;
}

export type TextSizeOption = 'sm' | 'md' | 'lg' | 'xl';
export type FontFamilyOption = 'default' | 'lexend' | 'atkinson' | 'system';

export interface AppData {
  carName: string;
  manualOdometer: number | null;
  tankCapacityThreshold: number; // default 38 liters
  fuels: FuelRecord[];
  services: ServiceRecord[];
  theme?: 'light' | 'dark';
  cloudSyncKey?: string;
  lastCloudBackup?: string;
  textSize?: TextSizeOption;
  fontFamily?: FontFamilyOption;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export interface ServiceStatus {
  color: 'green' | 'yellow' | 'red';
  emoji: string;
  message: string;
  status: 'ok' | 'warning' | 'danger';
  badgeClass: string;
  remaining: number;
}

export interface TripEstimate {
  distanceKm: number;
  litersNeeded: number;
  totalCost: number;
  tanksNeeded: number;
  costPerPerson: number;
  passengers: number;
  pricePerLiter: number;
  efficiencyKmPerLiter: number;
}
