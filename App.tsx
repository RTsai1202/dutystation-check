
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { BASIC_TASKS as INITIAL_BASIC_TASKS, SHIFT_SECTIONS as INITIAL_SHIFT_SECTIONS } from './constants';
import { CheckboxItem } from './components/CheckboxItem';
import { StatusDropdown } from './components/StatusDropdown';
import ScheduleEditor from './components/ScheduleEditor';
import WorkRecordModal from './components/WorkRecordModal';
import { TaskItem, ShiftSection, HandoverItem, StatusConfig, WorkRecord, WorkRecordGroup, TrashedItem } from './types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  FileText,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  RotateCcw,
  Archive,
  ChevronDown,
  ChevronUp,
  Lock,
  Info,
} from 'lucide-react';
import Markdown from 'react-markdown';

import { useFirebaseSync } from './useFirebaseSync';

const ACCESS_PASSWORD = '22792947';
const AUTH_STORAGE_KEY = 'dutystation_auth';

const DEFAULT_STATUSES: StatusConfig[] = [
  { id: 'status_pending', label: '待處理', color: '#94a3b8' },
  { id: 'status_progress', label: '處理中', color: '#3b82f6' },
  { id: 'status_urgent', label: '緊急', color: '#ef4444' },
  { id: 'status_done', label: '已完成', color: '#10b981', isDone: true },
];

const getNamespacedId = (shiftId: string, taskId: string) => shiftId + '::' + taskId;

// --- 密碼驗證閘門 ---
const PasswordGate: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      onAuthenticated();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className={`bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-sm space-y-6 ${shaking ? 'animate-shake' : ''}`}>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-xl font-bold text-white">車籠埔分隊值班系統</h1>
          <p className="text-sm text-blue-200/70">請輸入存取密碼</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="請輸入密碼"
              autoFocus
              className={`w-full px-4 py-3 bg-white/10 border-2 rounded-xl text-white placeholder-blue-300/50 outline-none text-center text-lg tracking-widest transition-colors ${error ? 'border-red-400 bg-red-500/10' : 'border-white/20 focus:border-blue-400'
                }`}
            />
            {error && (
              <p className="text-red-400 text-xs text-center mt-2 font-medium">密碼錯誤，請重新輸入</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            進入系統
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  });

  const configLoaded = useRef(false);

  // --- Firebase 即時同步 ---
  const { data: firebaseData, isLoading, saveConfig, saveState, saveWorkRecords, saveWorkRecordGroups, saveTrash } = useFirebaseSync();

  // --- Configuration State ---
  const [basicTasks, setBasicTasks] = useState<TaskItem[]>(INITIAL_BASIC_TASKS);
  const [shiftSections, setShiftSections] = useState<ShiftSection[]>(INITIAL_SHIFT_SECTIONS);
  const [statusConfigs, setStatusConfigs] = useState<StatusConfig[]>(DEFAULT_STATUSES);

  // --- Operational State ---
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [handoverItems, setHandoverItems] = useState<HandoverItem[]>([]);
  const [currentDate, setCurrentDate] = useState('');

  // --- UI State ---
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [workRecordGroups, setWorkRecordGroups] = useState<WorkRecordGroup[]>([]);
  const [showWorkRecordModal, setShowWorkRecordModal] = useState(false);
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  const [showTrash, setShowTrash] = useState(false);

  // --- 從 Firebase 載入資料 ---
  useEffect(() => {
    if (!firebaseData) return;
    if (firebaseData.basicTasks?.length > 0) setBasicTasks(firebaseData.basicTasks);
    if (firebaseData.shiftSections?.length > 0) setShiftSections(firebaseData.shiftSections);
    if (firebaseData.statusConfigs?.length > 0) setStatusConfigs(firebaseData.statusConfigs);
    setCheckedItems(firebaseData.checkedItems || {});
    setHandoverItems(firebaseData.handoverItems || []);
    setWorkRecords(firebaseData.workRecords || []);
    setWorkRecordGroups(firebaseData.workRecordGroups || []);
    setTrashedItems(firebaseData.trashedItems || []);
    configLoaded.current = true;
  }, [firebaseData]);

  // --- 初始化日期與時段 ---
  useEffect(() => {
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
  }, []);

  // --- 自動同步到 Firebase ---
  useEffect(() => {
    if (!configLoaded.current) return;
    saveConfig(basicTasks, shiftSections, statusConfigs);
  }, [basicTasks, shiftSections, statusConfigs]);

  useEffect(() => {
    if (!configLoaded.current) return;
    saveState(checkedItems, handoverItems);
  }, [checkedItems, handoverItems]);

  useEffect(() => {
    if (!configLoaded.current) return;
    saveWorkRecords(workRecords);
  }, [workRecords]);

  useEffect(() => {
    if (!configLoaded.current) return;
    saveWorkRecordGroups(workRecordGroups);
  }, [workRecordGroups]);

  useEffect(() => {
    if (!configLoaded.current) return;
    saveTrash(trashedItems);
  }, [trashedItems]);

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
    const targetStatus = statusConfigs.find(s => s.id === statusId);
    if (targetStatus?.isDone) {
      // Move to trash instead of just hiding
      const item = handoverItems.find(i => i.id === taskId);
      if (item) {
        setTrashedItems(prev => [{ ...item, statusId, trashedAt: Date.now() }, ...prev]);
        setHandoverItems(prev => prev.filter(i => i.id !== taskId));
      }
    } else {
      setHandoverItems(prev => prev.map(item =>
        item.id === taskId ? { ...item, statusId } : item
      ));
    }
  };

  const restoreFromTrash = (itemId: string) => {
    const item = trashedItems.find(i => i.id === itemId);
    if (!item) return;
    const firstNonDoneStatus = statusConfigs.find(s => !s.isDone);
    const { trashedAt, ...handoverItem } = item;
    setHandoverItems(prev => [{ ...handoverItem, statusId: firstNonDoneStatus?.id || statusConfigs[0]?.id || '' }, ...prev]);
    setTrashedItems(prev => prev.filter(i => i.id !== itemId));
  };

  const clearTrash = () => {
    if (window.confirm('確定要清空垃圾桶嗎？此操作無法復原。')) {
      setTrashedItems([]);
    }
  };

  // --- DnD Setup ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  // Helper: find which container a task belongs to
  const findContainer = (taskId: string): string | null => {
    if (basicTasks.find(t => t.id === taskId)) return 'basic';
    if (handoverItems.find(t => t.id === taskId)) return 'handover';
    for (const s of shiftSections) {
      if (s.tasks.find(t => t.id === taskId)) return s.id;
    }
    return null;
  };

  // Helper: get tasks from a container
  const getContainerTasks = (containerId: string): TaskItem[] => {
    if (containerId === 'basic') return basicTasks;
    if (containerId === 'handover') return handoverItems;
    return shiftSections.find(s => s.id === containerId)?.tasks || [];
  };

  // Helper: set tasks for a container
  const setContainerTasks = (containerId: string, tasks: TaskItem[]) => {
    if (containerId === 'basic') setBasicTasks(tasks);
    else if (containerId === 'handover') setHandoverItems(tasks as HandoverItem[]);
    else setShiftSections(prev => prev.map(s => s.id === containerId ? { ...s, tasks } : s));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const container = findContainer(active.id as string);
    if (!container) return;
    const tasks = getContainerTasks(container);
    setActiveTask(tasks.find(t => t.id === active.id) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    console.log('[DnD] dragEnd:', { activeId: active.id, overId: over?.id, overData: over?.data?.current });
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const sourceContainer = findContainer(activeId);
    console.log('[DnD] source:', sourceContainer, '| overId:', overId);
    if (!sourceContainer) return;

    // Check if dropped on a shift tab
    const shiftTabTarget = shiftSections.find(s => overId === `tab_${s.id}`);
    if (shiftTabTarget) {
      // Don't allow handover items to move to shift tabs
      if (sourceContainer === 'handover') return;
      const sourceTasks = getContainerTasks(sourceContainer);
      const task = sourceTasks.find(t => t.id === activeId);
      if (!task) return;

      if (sourceContainer === 'basic') {
        // basic → shift tab
        setBasicTasks(prev => prev.filter(t => t.id !== activeId));
        setShiftSections(prev => prev.map(s =>
          s.id === shiftTabTarget.id ? { ...s, tasks: [...s.tasks, task] } : s
        ));
      } else {
        // shift → shift tab (must be atomic to avoid race condition)
        setShiftSections(prev => prev.map(s => {
          if (s.id === sourceContainer && s.id === shiftTabTarget.id) {
            return s; // same section, no-op
          }
          if (s.id === sourceContainer) {
            return { ...s, tasks: s.tasks.filter(t => t.id !== activeId) };
          }
          if (s.id === shiftTabTarget.id) {
            return { ...s, tasks: [...s.tasks, task] };
          }
          return s;
        }));
      }
      return;
    }

    // Check if dropped on a container header
    const targetContainer = findContainer(overId) || (['basic', 'handover'].includes(overId) ? overId : shiftSections.find(s => s.id === overId)?.id || null);

    if (!targetContainer) return;

    // Don't allow cross moves involving handover
    if (sourceContainer === 'handover' && targetContainer !== 'handover') return;
    if (sourceContainer !== 'handover' && targetContainer === 'handover') return;

    if (sourceContainer === targetContainer) {
      // Same container: reorder
      const tasks = getContainerTasks(sourceContainer);
      const oldIdx = tasks.findIndex(t => t.id === activeId);
      const newIdx = tasks.findIndex(t => t.id === overId);
      if (oldIdx !== -1 && newIdx !== -1) {
        setContainerTasks(sourceContainer, arrayMove(tasks, oldIdx, newIdx));
      }
    } else {
      // Cross container: move
      const sourceTasks = getContainerTasks(sourceContainer);
      const targetTasks = getContainerTasks(targetContainer);
      const task = sourceTasks.find(t => t.id === activeId);
      if (!task) return;
      const overIdx = targetTasks.findIndex(t => t.id === overId);
      const insertIdx = overIdx !== -1 ? overIdx : targetTasks.length;
      setContainerTasks(sourceContainer, sourceTasks.filter(t => t.id !== activeId));
      const newTargetTasks = [...targetTasks];
      newTargetTasks.splice(insertIdx, 0, task);
      setContainerTasks(targetContainer, newTargetTasks);
    }
  };



  // --- 密碼驗證 ---
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm font-medium">載入資料中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full max-w-[98%] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="">
              <img src={`${import.meta.env.BASE_URL}mocking_monkey.svg`} alt="Mocking Monkey" className="w-14 h-14 object-contain transform hover:scale-110 transition-transform duration-200 -ml-2" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">車籠埔分隊值班 Checklist</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium">
              <Calendar className="w-4 h-4" />
              <span>{currentDate}</span>
            </div>


          </div>
        </div>
      </header>

      <main className="w-full max-w-[98%] mx-auto px-4 py-6 space-y-6">


        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {shiftSections.map((section) => (
              <ShiftTabDroppable
                key={section.id}
                section={section}
                isActive={selectedShiftId === section.id}
                onClick={() => setSelectedShiftId(section.id)}
                isEditMode={true}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowWorkRecordModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
              title="工作記錄模板"
            >
              <FileText size={13} />
              工作記錄
            </button>
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
            <div className="order-2 lg:order-none">
              <DroppableSection
                id="basic"
                title="基本事項"
                icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}
                color="bg-gray-800"
                showAdd={true}
                onAdd={() => handleAddTask('basic')}
                items={visibleBasicTasks}
              >
                {visibleBasicTasks.map(task => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    sectionId="basic"
                    isEditMode={true}
                    isChecked={!!checkedItems[getNamespacedId(selectedShiftId, task.id)]}
                    onToggle={() => handleToggle(getNamespacedId(selectedShiftId, task.id))}
                    isEditing={editingTaskId === task.id}
                    setEditing={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                    onDelete={() => handleDeleteTask(task.id, 'basic')}
                    onUpdate={(upd) => handleUpdateTask(task.id, 'basic', upd)}
                  />
                ))}
              </DroppableSection>
            </div>

            <div className="order-3 lg:order-none">
              <DroppableSection
                id={activeShiftData?.id || selectedShiftId}
                title={activeShiftData?.title || '值班項目'}
                icon={<Clock className="w-5 h-5 text-white/90" />}
                color={activeShiftData?.colorClass || 'bg-blue-600'}
                showAdd={true}
                onAdd={() => activeShiftData && handleAddTask(activeShiftData.id)}
                items={activeShiftData?.tasks || []}
              >
                {activeShiftData?.tasks.map(task => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    sectionId={activeShiftData.id}
                    isEditMode={true}
                    isChecked={!!checkedItems[task.id]}
                    onToggle={() => handleToggle(task.id)}
                    isEditing={editingTaskId === task.id}
                    setEditing={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                    onDelete={() => handleDeleteTask(task.id, activeShiftData.id)}
                    onUpdate={(upd) => handleUpdateTask(task.id, activeShiftData.id, upd)}
                  />
                ))}
              </DroppableSection>
            </div>

            <div className="order-1 lg:order-none">
              <DroppableSection
                id="handover"
                title="近期注意、交接事項"
                icon={<FileText className="w-5 h-5 text-white/90" />}
                color="bg-indigo-600"
                showAdd={true}
                onAdd={() => handleAddTask('handover')}
                items={handoverItems}
                headerExtra={
                  <button
                    onClick={() => setShowTrash(!showTrash)}
                    className={`bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${showTrash ? 'bg-white/30' : ''}`}
                    title="垃圾桶"
                  >
                    <Trash2 size={14} />
                  </button>
                }
              >
                {handoverItems.map(item => (
                  <SortableTask
                    key={item.id}
                    task={item}
                    sectionId="handover"
                    isEditMode={true}
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
                {handoverItems.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm italic">目前無待辦交接事項</div>
                )}

                {/* Trash Panel */}
                {showTrash && (
                  <div className="mt-4 border-t-2 border-dashed border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Trash2 size={16} className="text-gray-400" />
                        <span className="text-sm font-bold">垃圾桶</span>
                        <span className="text-xs text-gray-400">（{trashedItems.length} 項，30 天自動清空）</span>
                      </div>
                      {trashedItems.length > 0 && (
                        <button
                          onClick={clearTrash}
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                        >
                          <Trash2 size={12} /> 清空
                        </button>
                      )}
                    </div>
                    {trashedItems.length === 0 ? (
                      <div className="text-center py-6 text-gray-300 text-sm italic">垃圾桶是空的</div>
                    ) : (
                      <div className="space-y-2">
                        {trashedItems.map(item => {
                          const daysLeft = Math.max(0, Math.ceil(((30 * 24 * 60 * 60 * 1000) - (Date.now() - item.trashedAt)) / (24 * 60 * 60 * 1000)));
                          const trashedDate = new Date(item.trashedAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                          return (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:bg-gray-100 transition-colors">
                              <div className="flex-grow min-w-0">
                                <div className="text-sm text-gray-500 line-through truncate">{item.label}</div>
                                {item.subtext && <div className="text-[11px] text-gray-400 truncate mt-0.5">{item.subtext}</div>}
                                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                                  <span>{trashedDate} 完成</span>
                                  <span>·</span>
                                  <span className={daysLeft <= 7 ? 'text-red-400' : ''}>{daysLeft} 天後自動清除</span>
                                </div>
                              </div>
                              <button
                                onClick={() => restoreFromTrash(item.id)}
                                className="flex-shrink-0 text-xs text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                title="還原"
                              >
                                <RotateCcw size={12} /> 還原
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </DroppableSection>
            </div>
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-400 p-3 opacity-90 max-w-xs">
                <div className="font-medium text-gray-800 text-sm">{activeTask.label}</div>
                {activeTask.subtext && <div className="text-xs text-gray-500 mt-1">{activeTask.subtext}</div>}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <WorkRecordModal
          isOpen={showWorkRecordModal}
          onClose={() => setShowWorkRecordModal(false)}
          records={workRecords}
          onUpdateRecords={setWorkRecords}
          groups={workRecordGroups}
          onUpdateGroups={setWorkRecordGroups}
        />
      </main>
    </div>
  );
};

// --- Droppable Section Container ---
const DroppableSection: React.FC<{
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  showAdd: boolean;
  onAdd: () => void;
  items: TaskItem[];
  headerExtra?: React.ReactNode;
}> = ({ id, title, icon, color, children, showAdd, onAdd, items, headerExtra }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext items={items.map(t => t.id)} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={`bg-white rounded-xl shadow-sm border-2 flex flex-col overflow-hidden min-h-[400px] transition-all duration-200 ${isOver ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/30' : 'border-gray-200'
          }`}
      >
        <div className={`${color} px-5 py-4 text-white flex justify-between items-center sticky top-0 z-10`}>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
            {showAdd && (
              <button onClick={onAdd} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                <Plus size={14} /> 新增
              </button>
            )}
          </div>
        </div>
        <div className="p-4 space-y-3 flex-grow overflow-y-auto">
          {children}
          {showAdd && (
            <button
              onClick={onAdd}
              className="w-full py-3 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-gray-400 hover:text-blue-500 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium group mt-2"
            >
              <Plus size={16} className="group-hover:scale-110 transition-transform" /> 新增項目
            </button>
          )}
        </div>
      </div>
    </SortableContext>
  );
};

// --- Shift Tab Droppable ---
const ShiftTabDroppable: React.FC<{
  section: ShiftSection;
  isActive: boolean;
  onClick: () => void;
  isEditMode: boolean;
}> = ({ section, isActive, onClick, isEditMode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `tab_${section.id}`, disabled: !isEditMode || isActive });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${isOver
        ? 'bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-300 scale-105'
        : isActive
          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-blue-50'
        }`}
    >
      <span className="text-base font-bold">{section.title}</span>
      <span className={`text-xs font-mono mt-1 ${isOver ? 'text-blue-500' : isActive ? 'text-blue-100' : 'text-gray-500'
        }`}>{section.timeRange}</span>
      {isOver && <span className="text-[10px] text-blue-500 font-bold mt-1">放這裡</span>}
    </button>
  );
};

// --- Context Menu ---
const ContextMenu: React.FC<{
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ x, y, onEdit, onDelete, onClose }) => {
  React.useEffect(() => {
    const handleClick = () => onClose();
    const handleScroll = () => onClose();
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // Ensure menu stays within viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 160),
    top: Math.min(y, window.innerHeight - 100),
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div style={style} className="bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[140px] animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
      >
        <Edit2 size={14} /> 編輯
      </button>
      <div className="border-t border-gray-100 mx-2" />
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <Trash2 size={14} /> 刪除
      </button>
    </div>,
    document.body
  );
};

// --- Header with Right-Click Context Menu ---
const HeaderWithContextMenu: React.FC<{
  task: any;
  dragHandleProps?: any;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ task, dragHandleProps, onEdit, onDelete }) => {
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  return (
    <>
      <div
        {...dragHandleProps}
        className="mt-4 mb-2 group flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none"
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        <h4 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-4 bg-gray-500 rounded-full"></span>
          {task.label}
        </h4>
      </div>
      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} onEdit={onEdit} onDelete={onDelete} onClose={() => setCtxMenu(null)} />}
    </>
  );
};

// --- Edit Mode Task with Checkbox + Right-Click ---
const EditModeTask: React.FC<{
  task: any;
  isChecked?: boolean;
  onToggle?: () => void;
  dragHandleProps?: any;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ task, isChecked, onToggle, dragHandleProps, onEdit, onDelete }) => {
  const [justChecked, setJustChecked] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isChecked && onToggle) {
      setJustChecked(true);
      setTimeout(() => setJustChecked(false), 1500);
    }
    onToggle?.();
  };

  return (
    <>
      <div
        {...dragHandleProps}
        className={`group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 relative overflow-hidden flex-wrap cursor-grab active:cursor-grabbing touch-none ${isChecked
          ? 'bg-blue-50 border-blue-200 shadow-sm'
          : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
          }`}
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
      >
        {/* Dopamine ripple */}
        {justChecked && <div className="dopamine-ripple" />}


        {/* Checkbox - only this toggles */}
        <div
          onClick={handleCheckboxClick}
          className={`
            flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer
            transition-all duration-200 relative z-10
            ${isChecked
              ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-300/50'
              : 'border-gray-300 group-hover:border-blue-400 hover:scale-110'}
            ${justChecked ? 'checkbox-pop' : ''}
          `}
        >
          {isChecked && (
            <Check size={16} className={`text-white ${justChecked ? 'check-draw' : ''}`} strokeWidth={3} />
          )}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className={`text-base leading-snug select-none whitespace-pre-wrap ${isChecked ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
            {task.label}
          </div>
          {task.subtext && <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{task.subtext}</div>}
          {(task.showOnDays?.length || task.showInMonths?.length) && (
            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <Calendar size={10} />
              {task.showOnDays?.length ? `每週${task.showOnDays.map((d: number) => ['日', '一', '二', '三', '四', '五', '六'][d]).join('、')}` : ''}
              {task.showOnDays?.length && task.showInMonths?.length ? ' · ' : ''}
              {task.showInMonths?.length ? `${task.showInMonths.join(',')}月` : ''}
            </div>
          )}
        </div>

        {/* Action icons - inline */}
        {(task.notes || task.link) && (
          <div className="flex-shrink-0 flex items-center gap-1 ml-1">
            {task.notes && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}
                className={`p-1.5 rounded-md transition-colors ${showNotes
                  ? 'text-amber-600 bg-amber-50'
                  : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                title="查看筆記"
              >
                <Info size={16} />
              </button>
            )}
            {task.link && (
              <a
                href={task.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isChecked && onToggle) {
                    setJustChecked(true);
                    setTimeout(() => setJustChecked(false), 1500);
                    onToggle();
                  }
                }}
                className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                title="開啟連結"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        )}

        {/* Notes popup modal */}
        {showNotes && task.notes && ReactDOM.createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowNotes(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
              className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-amber-500" />
                  <span className="font-bold text-gray-800 text-sm">{task.label}</span>
                </div>
                <button onClick={() => setShowNotes(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="px-5 py-4 text-gray-700 text-sm leading-relaxed">
                <Markdown components={{
                  h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.8em 0 0.4em', color: '#1f2937' }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.7em 0 0.3em', color: '#1f2937' }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0.6em 0 0.2em', color: '#374151' }}>{children}</h3>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{children}</a>,
                  code: ({ children }) => <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 4, fontSize: '0.85em' }}>{children}</code>,
                  ul: ({ children }) => <ul style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: '0.2em 0' }}>{children}</li>,
                  p: ({ children }) => <p style={{ margin: '0.4em 0' }}>{children}</p>,
                }}>{task.notes}</Markdown>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} onEdit={onEdit} onDelete={onDelete} onClose={() => setCtxMenu(null)} />}

      {/* Shared dopamine animation styles */}
      <style>{`
        .dopamine-ripple {
          position: absolute;
          left: 12px; top: 12px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(59,130,246,0.5), rgba(147,51,234,0.3), transparent 70%);
          animation: rippleExpand 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
          pointer-events: none; z-index: 0;
        }
        @keyframes rippleExpand { 0% { transform: scale(0); opacity: 1; } 50% { opacity: 0.6; } 100% { transform: scale(50); opacity: 0; } }
        .checkbox-pop { animation: popBounce 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes popBounce { 0% { transform: scale(1); } 20% { transform: scale(1.5); } 40% { transform: scale(0.85); } 60% { transform: scale(1.2); } 80% { transform: scale(0.95); } 100% { transform: scale(1); } }
        .check-draw { animation: drawCheck 0.5s ease-out 0.1s both; }
        @keyframes drawCheck { 0% { opacity: 0; transform: scale(0) rotate(-45deg); } 50% { opacity: 1; transform: scale(1.3) rotate(5deg); } 75% { transform: scale(0.95) rotate(-2deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        .sparkle { position: absolute; width: 7px; height: 7px; border-radius: 50%; pointer-events: none; z-index: 5; }
        .sparkle-1 { background: #fbbf24; left: 18px; top: 8px; animation: sp1 1.1s cubic-bezier(0.22,0.61,0.36,1) forwards; }
        .sparkle-2 { background: #a78bfa; left: 10px; top: 6px; animation: sp2 1.0s cubic-bezier(0.22,0.61,0.36,1) 0.08s forwards; }
        .sparkle-3 { background: #34d399; left: 22px; top: 18px; animation: sp3 1.15s cubic-bezier(0.22,0.61,0.36,1) 0.15s forwards; }
        .sparkle-4 { background: #f472b6; left: 6px; top: 20px; animation: sp4 1.1s cubic-bezier(0.22,0.61,0.36,1) 0.12s forwards; }
        .sparkle-5 { background: #60a5fa; left: 26px; top: 12px; animation: sp5 1.0s cubic-bezier(0.22,0.61,0.36,1) 0.2s forwards; }
        .sparkle-6 { background: #fb923c; left: 14px; top: 24px; animation: sp6 1.05s cubic-bezier(0.22,0.61,0.36,1) 0.05s forwards; }
        @keyframes sp1 { 0% { transform: translate(0,0) scale(0); opacity: 1; } 60% { opacity: 0.8; } 100% { transform: translate(28px,-24px) scale(1.8); opacity: 0; } }
        @keyframes sp2 { 0% { transform: translate(0,0) scale(0); opacity: 1; } 60% { opacity: 0.8; } 100% { transform: translate(-22px,-28px) scale(1.5); opacity: 0; } }
        @keyframes sp3 { 0% { transform: translate(0,0) scale(0); opacity: 1; } 60% { opacity: 0.8; } 100% { transform: translate(30px,20px) scale(1.6); opacity: 0; } }
        @keyframes sp4 { 0% { transform: translate(0,0) scale(0); opacity: 1; } 60% { opacity: 0.8; } 100% { transform: translate(-24px,22px) scale(1.4); opacity: 0; } }
        @keyframes sp5 { 0% { transform: translate(0,0) scale(0); opacity: 1; } 60% { opacity: 0.8; } 100% { transform: translate(32px,-10px) scale(1.7); opacity: 0; } }
        @keyframes sp6 { 0% { transform: translate(0,0) scale(0); opacity: 1; } 60% { opacity: 0.8; } 100% { transform: translate(-18px,26px) scale(1.3); opacity: 0; } }
      `}</style>
    </>
  );
};

const SortableTask: React.FC<any> = (props) => {
  const isCurrentlyEditing = props.isEditing;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task.id, disabled: !props.isEditMode || isCurrentlyEditing });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 50 : 'auto' as any,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(isCurrentlyEditing ? {} : listeners)}>
      <EditableTask {...props} isDragging={isDragging} />
    </div>
  );
};

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
  dragHandleProps?: any;
  isDragging?: boolean;
}> = ({ task, isEditMode, isChecked, onToggle, isEditing, setEditing, onDelete, onUpdate, statusConfigs, onSelectStatus, onUpdateStatuses, isHandover, dragHandleProps }) => {
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
            placeholder="摘要內容..."
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
          {/* 筆記內容編輯器 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">筆記內容 (Markdown)</span>
            </div>
            <textarea
              className="w-full p-2.5 text-xs border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none shadow-sm min-h-[100px] font-mono bg-amber-50/50"
              value={task.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder={"支援 Markdown 格式，例如：\n# 標題\n- 清單項目\n**粗體** *斜體*"}
            />
          </div>
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
        <HeaderWithContextMenu
          task={task}
          dragHandleProps={dragHandleProps}
          onEdit={setEditing}
          onDelete={onDelete}
        />
      );
    }
    return (
      <EditModeTask
        task={task}
        isChecked={isChecked}
        onToggle={onToggle}
        dragHandleProps={dragHandleProps}
        onEdit={setEditing}
        onDelete={onDelete}
      />
    );
  }

  // Normal view for handover items
  if (isHandover) {
    return (
      <div {...dragHandleProps} className="flex flex-col p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative cursor-grab active:cursor-grabbing touch-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-grow space-y-1">
            <div className="text-base font-bold text-gray-800 leading-tight whitespace-pre-wrap">{task.label}</div>
            {task.subtext && <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{task.subtext}</div>}
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
