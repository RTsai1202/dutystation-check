
export interface TaskItem {
  id: string;
  label: string;
  link?: string;
  subtext?: string;
  isHeader?: boolean;
  showOnDays?: number[];    // 0-6 (Sunday-Saturday)
  showInMonths?: number[];  // 1-12 (January-December)
}

export interface StatusConfig {
  id: string;
  label: string;
  color: string;
  isDone?: boolean;
}

export interface HandoverItem extends TaskItem {
  statusId: string;
}

export interface ShiftSection {
  id: string;
  title: string;
  timeRange: string;
  colorClass: string;
  tasks: TaskItem[];
}

export interface AppState {
  checkedItems: Record<string, boolean>;
  handoverItems: HandoverItem[];
  statusConfigs: StatusConfig[];
  lastUpdated: number;
}
