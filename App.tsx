
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BASIC_TASKS as INITIAL_BASIC_TASKS, SHIFT_SECTIONS as INITIAL_SHIFT_SECTIONS } from './constants';
import { CheckboxItem } from './components/CheckboxItem';
import { StatusDropdown } from './components/StatusDropdown';
import ScheduleEditor from './components/ScheduleEditor';
import { TaskItem, ShiftSection, HandoverItem, StatusConfig } from './types';
import {
  Calendar,
  ClipboardCheck,
  FileText,
  AlertCircle,
  Clock,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Palette,
  X,
  RotateCcw
} from 'lucide-react';

const STORAGE_STATE_KEY = 'duty_station_state_v2';
const STORAGE_CONFIG_KEY = 'duty_station_config_v2';

const DEFAULT_STATUSES: StatusConfig[] = [
  { id: 'status_pending', label: '待處理', color: '#94a3b8' },
  { id: 'status_progress', label: '處理中', color: '#3b82f6' },
  { id: 'status_urgent', label: '緊急', color: '#ef4444' },
  { id: 'status_done', label: '已完成', color: '#10b981', isDone: true },
];

const getNamespacedId = (shiftId: string, taskId: string) => shiftId + '::' + taskId;

const App: React.FC = () => {
  const configLoaded = useRef(false);

  // --- Configuration State ---
  const [basicTasks, setBasicTasks] = useState<TaskItem[]>(INITIAL_BASIC_TASKS);
  const [shiftSections, setShiftSections] = useState<ShiftSection[]>(INITIAL_SHIFT_SECTIONS);
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>(DEFAULT_STATUSES);

  // --- Operational State ---
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [handoverItems, setHandoverItems] = useState<HandoverItem[]>([]);
  const [currentDate, setCurrentDate] = useState('');

  // --- UI State ---
  const [isEditMode, setIsEditMode] = useState(true);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);

  // --- Initial Load ---
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (savedConfig) {
      try {
        const { basic, shifts, statuses } = JSON.parse(savedConfig);
        if (basic && basic.length > 0) setBasicTasks(basic);
        if (shifts && shifts.length > 0) setShiftSections(shifts);
        if (statuses && statuses.length > 0) setStatusConfigs(statuses);
      } catch (e) {
        // defaults already set via useState
      }
    }

    const savedState = localStorage.getItem(STORAGE_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setCheckedItems(parsed.checkedItems || {});
        setHandoverItems(parsed.handoverItems || []);
      } catch (e) { }
    }

    const updateTime = () => {
      const date = new Date();
      setCurrentDate(date.toLocaleDateString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
      }));
    };
    updateTime();

    const hour = new Date().getHours();
    if (hour >= 8 && hour < 12) setSelectedShiftId('shift_0812');
    else if (hour >= 12 && hour < 18) setSelectedShiftId('shift_1218');
    else if (hour >= 18 && hour < 22) setSelectedShiftId('shift_1822');
    else setSelectedShiftId('shift_2206');

    configLoaded.current = true;
  }, []);

  // --- Persistence (only after initial load) ---
  useEffect(() => {
    if (!configLoaded.current) return;
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({
      basic: basicTasks,
      shifts: shiftSections,
      statuses: statusConfigs
    }));
  }, [basicTasks, shiftSections, statusConfigs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify({ checkedItems, handoverItems }));
  }, [checkedItems, handoverItems]);

  // --- Helper: Check if task should be visible based on day/month ---
  const isTaskVisible = (task: TaskItem): boolean => {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const currentMonth = now.getMonth() + 1; // 1-12

    if (task.showOnDays && !task.showOnDays.includes(currentDay)) return false;
    if (task.showInMonths && !task.showInMonths.includes(currentMonth)) return false;
    return true;
  };

  // Filter tasks for display
  const visibleBasicTasks = basicTasks.filter(isTaskVisible);
  const visibleShiftSections = shiftSections.map(section => ({
    ...section,
    tasks: section.tasks.filter(isTaskVisible)
  }));

  // --- Handlers ---
  const handleToggle = (uniqueId: string) => {
    setCheckedItems(prev => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
  };

  const clearShiftChecks = () => {
    setCheckedItems(prev => {
      const next = { ...prev };
      // Clear basic tasks for this shift
      basicTasks.forEach(t => { delete next[getNamespacedId(selectedShiftId, t.id)]; });
      // Clear shift-specific tasks
      if (activeShiftData) {
        activeShiftData.tasks.forEach(t => { delete next[t.id]; });
      }
      return next;
    });
  };

  const activeShiftData = visibleShiftSections.find(s => s.id === selectedShiftId);

  const resetConfig = () => {
    if (window.confirm('確定要恢復預設值嗎？這將覆蓋所有自定義任務與狀態。')) {
      setBasicTasks(INITIAL_BASIC_TASKS);
      setShiftSections(INITIAL_SHIFT_SECTIONS);
      setStatusConfigs(DEFAULT_STATUSES);
      setHandoverItems([]);
    }
  };

  const handleAddTask = (sectionId: string) => {
    const newTask: TaskItem = { id: `task_${Date.now()}`, label: '新項目', subtext: '' };
    if (sectionId === 'basic') setBasicTasks([...basicTasks, newTask]);
    else if (sectionId === 'handover') {
      const newH: HandoverItem = { ...newTask, statusId: statusConfigs[0]?.id || '' };
      setHandoverItems([newH, ...handoverItems]);
    } else {
      setShiftSections(shiftSections.map(s => s.id === sectionId ? { ...s, tasks: [...s.tasks, newTask] } : s));
    }
    setEditingTaskId(newTask.id);
  };

  const handleDeleteTask = (taskId: string, sectionId: string) => {
    if (sectionId === 'basic') setBasicTasks(basicTasks.filter(t => t.id !== taskId));
    else if (sectionId === 'handover') setHandoverItems(handoverItems.filter(t => t.id !== taskId));
    else setShiftSections(shiftSections.map(s => s.id === sectionId ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) } : s));
  };

  const handleUpdateTask = (taskId: string, sectionId: string, updates: any) => {
    if (sectionId === 'basic') setBasicTasks(basicTasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
    else if (sectionId === 'handover') setHandoverItems(handoverItems.map(t => t.id === taskId ? { ...t, ...updates } : t));
    else setShiftSections(shiftSections.map(s => s.id === sectionId ? { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) } : s));
  };

  const setHandoverStatus = (taskId: string, statusId: string) => {
    setHandoverItems(prev => prev.map(item =>
      item.id === taskId ? { ...item, statusId } : item
    ));
  };



  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full max-w-[98%] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ClipboardCheck className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">DutyStation Check</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <span>{currentDate}</span>
            </div>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${isEditMode ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Settings className={`w-4 h-4 ${isEditMode ? 'animate-spin' : ''}`} />
              {isEditMode ? '結束修改' : '修改模式'}
            </button>

            {isEditMode && (
              <button
                onClick={() => setShowStatusManager(!showStatusManager)}
                className={`p-2 rounded-lg transition-colors ${showStatusManager ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                title="狀態管理"
              >
                <Palette size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[98%] mx-auto px-4 py-6 space-y-6">
        {isEditMode && showStatusManager && (
          <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Palette className="text-purple-500" /> 狀態定義管理
              </h3>
              <button
                onClick={() => setStatusConfigs([...statusConfigs, { id: `status_${Date.now()}`, label: '新狀態', color: '#64748b' }])}
                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
              >
                <Plus size={14} /> 新增狀態
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusConfigs.map((status, idx) => (
                <div key={status.id} className={`flex items-center gap-2 p-3 rounded-lg border ${status.isDone ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <input
                    type="color"
                    value={status.color}
                    onChange={(e) => setStatusConfigs(statusConfigs.map(s => s.id === status.id ? { ...s, color: e.target.value } : s))}
                    className="w-8 h-8 rounded border-none cursor-pointer p-0 overflow-hidden"
                  />
                  <input
                    className="flex-grow bg-transparent border-none focus:ring-0 text-sm font-medium"
                    value={status.label}
                    onChange={(e) => setStatusConfigs(statusConfigs.map(s => s.id === status.id ? { ...s, label: e.target.value } : s))}
                  />
                  <button
                    onClick={() => setStatusConfigs(statusConfigs.map(s => s.id === status.id ? { ...s, isDone: !s.isDone } : s))}
                    className={`text-[10px] px-2 py-1 rounded-md font-bold border transition-colors ${status.isDone ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-600'}`}
                    title="標記為完成狀態（選擇後項目會自動隱藏）"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setStatusConfigs(statusConfigs.filter(s => s.id !== status.id))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {shiftSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedShiftId(section.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedShiftId === section.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-blue-50'
                }`}
            >
              <span className="text-base font-bold">{section.title}</span>
              <span className={`text-xs font-mono mt-1 ${selectedShiftId === section.id ? 'text-blue-100' : 'text-gray-500'}`}>{section.timeRange}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={clearShiftChecks}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all"
            title="清空此時段所有勾選"
          >
            <RotateCcw size={13} />
            一鍵清空該時段
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SectionContainer
            title="基本事項"
            icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}
            color="bg-gray-800"
            showAdd={isEditMode}
            onAdd={() => handleAddTask('basic')}
          >
            {visibleBasicTasks.map(task => (
              <EditableTask
                key={task.id}
                task={task}
                sectionId="basic"
                isEditMode={isEditMode}
                isChecked={!!checkedItems[getNamespacedId(selectedShiftId, task.id)]}
                onToggle={() => handleToggle(getNamespacedId(selectedShiftId, task.id))}
                isEditing={editingTaskId === task.id}
                setEditing={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                onDelete={() => handleDeleteTask(task.id, 'basic')}
                onUpdate={(upd) => handleUpdateTask(task.id, 'basic', upd)}
              />
            ))}
          </SectionContainer>

          <SectionContainer
            title={activeShiftData?.title || '值班項目'}
            icon={<Clock className="w-5 h-5 text-white/90" />}
            color={activeShiftData?.colorClass || 'bg-blue-600'}
            showAdd={isEditMode}
            onAdd={() => activeShiftData && handleAddTask(activeShiftData.id)}
          >
            {activeShiftData?.tasks.map(task => (
              <EditableTask
                key={task.id}
                task={task}
                sectionId={activeShiftData.id}
                isEditMode={isEditMode}
                isChecked={!!checkedItems[task.id]}
                onToggle={() => handleToggle(task.id)}
                isEditing={editingTaskId === task.id}
                setEditing={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                onDelete={() => handleDeleteTask(task.id, activeShiftData.id)}
                onUpdate={(upd) => handleUpdateTask(task.id, activeShiftData.id, upd)}
              />
            ))}
          </SectionContainer>

          <SectionContainer
            title="近期注意、交接事項"
            icon={<FileText className="w-5 h-5 text-white/90" />}
            color="bg-indigo-600"
            showAdd={true} // Always allow adding handovers
            onAdd={() => handleAddTask('handover')}
          >
            {handoverItems
              .filter(item => {
                const status = statusConfigs.find(s => s.id === item.statusId);
                return !status?.isDone;
              })
              .map(item => (
                <EditableTask
                  key={item.id}
                  task={item}
                  sectionId="handover"
                  isEditMode={isEditMode}
                  isEditing={editingTaskId === item.id}
                  setEditing={() => setEditingTaskId(editingTaskId === item.id ? null : item.id)}
                  onDelete={() => handleDeleteTask(item.id, 'handover')}
                  onUpdate={(upd) => handleUpdateTask(item.id, 'handover', upd)}
                  statusConfigs={statusConfigs}
                  onSelectStatus={(statusId: string) => setHandoverStatus(item.id, statusId)}
                  onUpdateStatuses={setStatusConfigs}
                  isHandover
                />
              ))}
            {handoverItems.filter(item => {
              const status = statusConfigs.find(s => s.id === item.statusId);
              return !status?.isDone;
            }).length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm italic">目前無待辦交接事項</div>
              )}
          </SectionContainer>
        </div>
      </main>
    </div>
  );
};

const SectionContainer: React.FC<{
  title: string, icon: React.ReactNode, color: string, children: React.ReactNode, showAdd: boolean, onAdd: () => void
}> = ({ title, icon, color, children, showAdd, onAdd }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-h-[400px]">
    <div className={`${color} px-5 py-4 text-white flex justify-between items-center sticky top-0 z-10`}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {showAdd && (
        <button onClick={onAdd} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
          <Plus size={14} /> 新增
        </button>
      )}
    </div>
    <div className="p-4 space-y-3 flex-grow overflow-y-auto">
      {children}
    </div>
  </div>
);

const EditableTask: React.FC<{
  task: any;
  sectionId: string;
  isEditMode: boolean;
  isChecked?: boolean;
  onToggle?: () => void;
  isEditing: boolean;
  setEditing: () => void;
  onDelete: () => void;
  onUpdate: (upd: any) => void;
  statusConfigs?: StatusConfig[];
  onSelectStatus?: (statusId: string) => void;
  onUpdateStatuses?: (statuses: StatusConfig[]) => void;
  isHandover?: boolean;
}> = ({ task, isEditMode, isChecked, onToggle, isEditing, setEditing, onDelete, onUpdate, statusConfigs, onSelectStatus, onUpdateStatuses, isHandover }) => {
  const currentStatus = statusConfigs?.find(s => s.id === task.statusId);

  // If we are actively editing this specific task, show the form
  if (isEditing) {
    return (
      <div className="p-4 rounded-xl border-2 border-blue-400 bg-blue-50 shadow-md animate-in zoom-in-95 duration-200">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">編輯項目</span>
            <button onClick={setEditing} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <input
            className="w-full p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
            value={task.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="項目名稱"
            autoFocus
          />
          <textarea
            className="w-full p-2.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm min-h-[60px]"
            value={task.subtext || ''}
            onChange={(e) => onUpdate({ subtext: e.target.value })}
            placeholder="補充說明..."
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <input
                className="w-full p-2.5 pl-8 text-xs border border-gray-300 rounded-lg outline-none shadow-sm"
                value={task.link || ''}
                onChange={(e) => onUpdate({ link: e.target.value })}
                placeholder="連結 URL"
              />
              <ExternalLink size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {!isHandover && (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate({ isHeader: !task.isHeader }); }}
                className={`px-3 py-2.5 text-[10px] font-bold rounded-lg border transition-colors ${task.isHeader ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}
              >
                標頭
              </button>
            )}
          </div>
          {!isHandover && (
            <ScheduleEditor
              showOnDays={task.showOnDays}
              showInMonths={task.showInMonths}
              onUpdateDays={(days) => onUpdate({ showOnDays: days })}
              onUpdateMonths={(months) => onUpdate({ showInMonths: months })}
            />
          )}
          <div className="flex justify-between items-center pt-2">
            <button onClick={onDelete} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs">
              <Trash2 size={16} /> 刪除
            </button>
            <button onClick={setEditing} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-1 shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
              <Check size={16} /> 儲存完成
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If global edit mode is on, show checkbox + edit buttons together
  if (isEditMode && !isHandover) {
    if (task.isHeader) {
      return (
        <div className="mt-4 mb-2 group flex items-center justify-between">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-4 bg-gray-500 rounded-full"></span>
            {task.label}
          </h4>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={setEditing} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md" title="編輯內容"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="刪除"><Trash2 size={14} /></button>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${isChecked
          ? 'bg-blue-50 border-blue-200 shadow-sm'
          : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
          }`}
        onClick={onToggle}
      >
        <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors duration-200 ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
          }`}>
          {isChecked && <Check size={16} className="text-white" strokeWidth={3} />}
        </div>
        <div className="flex-grow">
          <div className={`text-base leading-snug select-none ${isChecked ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
            {task.label}
          </div>
          {task.subtext && <div className="text-xs text-gray-500 mt-1">{task.subtext}</div>}
          {(task.showOnDays?.length || task.showInMonths?.length) && (
            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <Calendar size={10} />
              {task.showOnDays?.length ? `每週${task.showOnDays.map((d: number) => ['日', '一', '二', '三', '四', '五', '六'][d]).join('、')}` : ''}
              {task.showOnDays?.length && task.showInMonths?.length ? ' · ' : ''}
              {task.showInMonths?.length ? `${task.showInMonths.join(',')}月` : ''}
            </div>
          )}
        </div>
        {task.link && (
          <a
            href={task.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 text-gray-400 hover:text-blue-600 p-1"
            title="開啟連結"
          >
            <ExternalLink size={16} />
          </a>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={setEditing} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md" title="編輯內容"><Edit2 size={14} /></button>
          <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="刪除"><Trash2 size={14} /></button>
        </div>
      </div>
    );
  }

  // Normal view for handover items
  if (isHandover) {
    return (
      <div className="flex flex-col p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-grow space-y-1">
            <div className="text-base font-bold text-gray-800 leading-tight">{task.label}</div>
            {task.subtext && <div className="text-xs text-gray-500 leading-relaxed">{task.subtext}</div>}
          </div>
          <div className="flex flex-col gap-1 items-end">
            {task.link && (
              <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 p-1 bg-gray-50 rounded-lg">
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={setEditing}
              className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="快速編輯"
            >
              <Edit2 size={14} />
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {statusConfigs && onSelectStatus && onUpdateStatuses ? (
            <StatusDropdown
              currentStatusId={task.statusId}
              statusConfigs={statusConfigs}
              onSelectStatus={onSelectStatus}
              onUpdateStatuses={onUpdateStatuses}
            />
          ) : (
            <span className="text-[11px] px-3 py-1.5 rounded-full font-bold text-white" style={{ backgroundColor: currentStatus?.color || '#94a3b8' }}>
              {currentStatus?.label || '無狀態'}
            </span>
          )}
          {task.link && <span className="text-[10px] text-gray-400 font-mono opacity-50">附連結</span>}
        </div>
      </div>
    );
  }

  // Normal view for standard tasks
  return <CheckboxItem task={task} isChecked={isChecked!} onToggle={onToggle!} />;
};

export default App;
