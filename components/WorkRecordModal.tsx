import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
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
    X,
    Plus,
    Edit2,
    Trash2,
    GripVertical,
    Check,
    Copy,
    FileText,
} from 'lucide-react';
import { WorkRecord } from '../types';

// --- Sortable Work Record Item ---
const SortableRecordItem: React.FC<{
    record: WorkRecord;
    onCopy: (record: WorkRecord) => void;
    onEdit: (record: WorkRecord) => void;
    onDelete: (id: string) => void;
    copiedId: string | null;
}> = ({ record, onCopy, onEdit, onDelete, copiedId }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: record.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : 'auto' as any,
    };

    const isCopied = copiedId === record.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 group"
        >
            {/* Drag handle */}
            <div
                {...attributes}
                {...listeners}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none p-1"
            >
                <GripVertical size={18} />
            </div>

            {/* Main clickable area - copy on click */}
            <button
                onClick={() => onCopy(record)}
                className={`flex-grow text-left px-4 py-3 rounded-xl border-2 transition-all duration-300 ${isCopied
                        ? 'bg-green-50 border-green-400 shadow-lg shadow-green-100 scale-[1.02]'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md active:scale-[0.98]'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <span className={`font-medium text-sm transition-colors ${isCopied ? 'text-green-700' : 'text-gray-800'}`}>
                        {record.title || '未命名'}
                    </span>
                    {isCopied ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold animate-bounce-in">
                            <Check size={14} strokeWidth={3} />
                            已複製
                        </span>
                    ) : (
                        <Copy size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                    )}
                </div>
            </button>

            {/* Edit button */}
            <button
                onClick={() => onEdit(record)}
                className="flex-shrink-0 p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="編輯"
            >
                <Edit2 size={16} />
            </button>

            {/* Delete button */}
            <button
                onClick={() => onDelete(record.id)}
                className="flex-shrink-0 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="刪除"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

// --- Edit Dialog ---
const EditDialog: React.FC<{
    record: WorkRecord;
    onSave: (record: WorkRecord) => void;
    onClose: () => void;
}> = ({ record, onSave, onClose }) => {
    const [title, setTitle] = useState(record.title);
    const [content, setContent] = useState(record.content);

    const handleSave = () => {
        onSave({ ...record, title: title.trim() || '未命名', content });
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800">編輯工作記錄</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                            工作項目名稱
                        </label>
                        <input
                            className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="輸入工作項目名稱"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                            複製內容
                        </label>
                        <textarea
                            className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm min-h-[160px] resize-y font-mono"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="點擊此工作記錄時，會複製到剪貼板的內容..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                        <Check size={16} />
                        儲存
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Modal ---
const WorkRecordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    records: WorkRecord[];
    onUpdateRecords: (records: WorkRecord[]) => void;
}> = ({ isOpen, onClose, records, onUpdateRecords }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);
    const [activeRecord, setActiveRecord] = useState<WorkRecord | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Reset copied state
    useEffect(() => {
        if (copiedId) {
            const timer = setTimeout(() => setCopiedId(null), 1500);
            return () => clearTimeout(timer);
        }
    }, [copiedId]);

    if (!isOpen) return null;

    const handleCopy = async (record: WorkRecord) => {
        try {
            await navigator.clipboard.writeText(record.content);
            setCopiedId(record.id);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = record.content;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedId(record.id);
        }
    };

    const handleAdd = () => {
        const newRecord: WorkRecord = {
            id: `wr_${Date.now()}`,
            title: '',
            content: '',
        };
        // Open edit dialog immediately for new record
        setEditingRecord(newRecord);
    };

    const handleSaveEdit = (record: WorkRecord) => {
        const exists = records.find((r) => r.id === record.id);
        if (exists) {
            onUpdateRecords(records.map((r) => (r.id === record.id ? record : r)));
        } else {
            onUpdateRecords([...records, record]);
        }
        setEditingRecord(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('確定要刪除此工作記錄嗎？')) {
            onUpdateRecords(records.filter((r) => r.id !== id));
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveRecord(records.find((r) => r.id === event.active.id) || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveRecord(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIdx = records.findIndex((r) => r.id === active.id);
        const newIdx = records.findIndex((r) => r.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
            onUpdateRecords(arrayMove(records, oldIdx, newIdx));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative m-3 md:m-6 flex-grow flex flex-col bg-gray-50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <FileText className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">工作記錄</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                點擊項目即可一鍵複製內容到剪貼板
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            新增記錄
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - scrollable */}
                <div className="flex-grow overflow-y-auto p-6">
                    {records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <FileText size={48} strokeWidth={1.5} />
                            <div className="text-center">
                                <p className="text-lg font-medium">尚無工作記錄</p>
                                <p className="text-sm mt-1">
                                    點擊「新增記錄」建立你的第一個工作記錄模板
                                </p>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                <Plus size={16} />
                                新增記錄
                            </button>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={records.map((r) => r.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2 max-w-2xl mx-auto">
                                    {records.map((record) => (
                                        <SortableRecordItem
                                            key={record.id}
                                            record={record}
                                            onCopy={handleCopy}
                                            onEdit={setEditingRecord}
                                            onDelete={handleDelete}
                                            copiedId={copiedId}
                                        />
                                    ))}
                                </div>
                            </SortableContext>

                            <DragOverlay>
                                {activeRecord ? (
                                    <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-400 px-4 py-3 opacity-90 max-w-md">
                                        <span className="font-medium text-gray-800 text-sm">
                                            {activeRecord.title || '未命名'}
                                        </span>
                                    </div>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            {editingRecord && (
                <EditDialog
                    record={editingRecord}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingRecord(null)}
                />
            )}

            {/* Custom animation keyframe */}
            <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default WorkRecordModal;
