
export interface TaskItem {
  id: string;
  label: string;
  link?: string;
  subtext?: string;
  notes?: string;        // Markdown 筆記內容
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

export interface TrashedItem extends HandoverItem {
  trashedAt: number; // Unix milliseconds timestamp
}

export interface WorkRecordGroup {
  id: string;
  title: string;
}

export interface WorkRecord {
  id: string;
  title: string;
  content: string;
  link?: string;   // 選填連結，複製後提示前往
  groupId?: string; // 所屬群組 ID，undefined 表示「未分類」
}

export interface AppState {
  checkedItems: Record<string, boolean>;
  handoverItems: HandoverItem[];
  statusConfigs: StatusConfig[];
  lastUpdated: number;
}
