
import React, { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    pointerWithin,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDroppable,
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
    Edit2,
    Trash2,
    Plus,
    Copy,
    Check,
    X,
    FolderPlus,
    GripHorizontal,
    ChevronDown,
    ChevronRight,
    FileText,
    Link as LinkIcon,
    ExternalLink,
} from 'lucide-react';
import { WorkRecord, WorkRecordGroup } from '../types';

// --- Inline Delete Confirm Button ---
const DeleteButton: React.FC<{
    onConfirm: () => void;
    size?: number;
}> = ({ onConfirm, size = 16 }) => {
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (confirming) {
            const timer = setTimeout(() => setConfirming(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [confirming]);

    if (confirming) {
        return (
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={(e) => { e.stopPropagation(); onConfirm(); }}
                    className="px-2 py-1 text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all active:scale-95 flex items-center gap-0.5"
                >
                    <Check size={12} /> 確認
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                    className="px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    取消
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="刪除"
        >
            <Trash2 size={size} />
        </button>
    );
};

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
            className="flex items-center gap-1.5 group"
            {...attributes}
            {...listeners}
        >
            {/* Main clickable area */}
            <button
                onClick={() => onCopy(record)}
                className={`flex-grow text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-300 min-w-0 cursor-grab active:cursor-grabbing ${isCopied
                    ? 'bg-green-50 border-green-400 shadow-lg shadow-green-100 scale-[1.02]'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
                    }`}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className={`font-medium text-sm truncate transition-colors ${isCopied ? 'text-green-700' : 'text-gray-800'}`}>
                        {record.title || '未命名'}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {record.link && !isCopied && (
                            <LinkIcon size={12} className="text-blue-400" />
                        )}
                        {isCopied ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold animate-bounce-in">
                                <Check size={14} strokeWidth={3} />
                                已複製
                            </span>
                        ) : (
                            <Copy size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                        )}
                    </div>
                </div>
            </button>

            {/* Edit button */}
            <button
                onClick={() => onEdit(record)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="編輯"
            >
                <Edit2 size={14} />
            </button>

            {/* Delete button */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteButton onConfirm={() => onDelete(record.id)} size={14} />
            </div>
        </div>
    );
};

// --- Sortable Section Header (for group reordering) ---
const SortableSectionHeader: React.FC<{
    group: WorkRecordGroup;
    recordCount: number;
    collapsed: boolean;
    onToggleCollapse: () => void;
    onAddRecord: (groupId: string) => void;
    onRenameGroup: (groupId: string, title: string) => void;
    onDeleteGroup: (groupId: string) => void;
    isUncategorized?: boolean;
}> = ({ group, recordCount, collapsed, onToggleCollapse, onAddRecord, onRenameGroup, onDeleteGroup, isUncategorized }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(group.title);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `section_${group.id}`,
        disabled: isUncategorized,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 100 : 'auto' as any,
    };

    const handleRename = () => {
        if (renameValue.trim()) {
            onRenameGroup(group.id, renameValue.trim());
        }
        setIsRenaming(false);
    };

    return (
        <div ref={setNodeRef} style={style} className="group/section">
            <div className="flex items-center gap-1.5 py-2">
                {/* Drag handle for section reorder */}
                {!isUncategorized && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none p-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity"
                    >
                        <GripHorizontal size={14} />
                    </div>
                )}

                {/* Collapse toggle */}
                <button
                    onClick={onToggleCollapse}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Section title */}
                {isRenaming && !isUncategorized ? (
                    <input
                        className="flex-grow text-base font-bold bg-transparent border-b-2 border-blue-400 outline-none px-1 py-0.5 text-gray-800"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                        autoFocus
                    />
                ) : (
                    <span
                        className={`flex-grow text-base font-bold ${isUncategorized ? 'text-gray-500' : 'text-gray-800 cursor-pointer hover:text-blue-600'} transition-colors`}
                        onDoubleClick={() => { if (!isUncategorized) { setRenameValue(group.title); setIsRenaming(true); } }}
                    >
                        {group.title}
                        <span className="text-xs text-gray-400 font-normal ml-2">({recordCount})</span>
                    </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover/section:opacity-100 transition-opacity">
                    <button
                        onClick={() => onAddRecord(group.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="新增記錄到此群組"
                    >
                        <Plus size={14} />
                    </button>
                    {!isUncategorized && (
                        <DeleteButton onConfirm={() => onDeleteGroup(group.id)} size={14} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Section Content (droppable area for records) ---
const SectionContent: React.FC<{
    groupId: string;
    records: WorkRecord[];
    onCopy: (record: WorkRecord) => void;
    onEdit: (record: WorkRecord) => void;
    onDelete: (id: string) => void;
    onAddRecord: (groupId: string) => void;
    copiedId: string | null;
    collapsed: boolean;
}> = ({ groupId, records, onCopy, onEdit, onDelete, onAddRecord, copiedId, collapsed }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `group_${groupId}` });

    if (collapsed) return null;

    return (
        <div
            ref={setNodeRef}
            className={`pl-6 pb-4 transition-all duration-200 ${isOver ? 'bg-blue-50/40 rounded-xl' : ''}`}
        >
            {records.length === 0 ? (
                <div
                    onClick={() => onAddRecord(groupId)}
                    className={`text-center py-4 text-sm italic rounded-xl border-2 border-dashed transition-colors cursor-pointer group/empty ${isOver ? 'text-blue-400 border-blue-300 bg-blue-50' : 'text-gray-300 border-gray-200 hover:text-blue-400 hover:border-blue-300 hover:bg-blue-50/50'}`}
                >
                    <div className="flex items-center justify-center gap-1.5">
                        <Plus size={16} className={`transition-transform group-hover/empty:scale-110 ${isOver ? 'text-blue-400' : ''}`} />
                        {isOver ? '放在這裡' : '點擊新增第一筆記錄'}
                    </div>
                </div>
            ) : (
                <SortableContext items={records.map(r => r.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-3 gap-2">
                        {records.map((record) => (
                            <SortableRecordItem
                                key={record.id}
                                record={record}
                                onCopy={onCopy}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                copiedId={copiedId}
                            />
                        ))}
                    </div>
                </SortableContext>
            )}
        </div>
    );
};

// --- Edit Dialog ---
const EditDialog: React.FC<{
    record: WorkRecord;
    groups: WorkRecordGroup[];
    onSave: (record: WorkRecord) => void;
    onClose: () => void;
}> = ({ record, groups, onSave, onClose }) => {
    const [title, setTitle] = useState(record.title);
    const [content, setContent] = useState(record.content);
    const [link, setLink] = useState(record.link || '');
    const [groupId, setGroupId] = useState(record.groupId || '');

    const handleSave = () => {
        onSave({ ...record, title: title.trim() || '未命名', content, link: link.trim() || undefined, groupId: groupId || undefined });
    };

    // Cmd/Ctrl+Enter to save
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                onSave({ ...record, title: title.trim() || '未命名', content, link: link.trim() || undefined, groupId: groupId || undefined });
            }
        };
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [title, content, link, groupId, record, onSave]);

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
                            所屬群組
                        </label>
                        <select
                            className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                        >
                            <option value="">未分類</option>
                            {groups.map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
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
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                            <span className="flex items-center gap-1"><LinkIcon size={12} /> 連結（選填）</span>
                        </label>
                        <textarea
                            className="w-full p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm min-h-[36px] resize-y"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="連結 URL（每行一個，可填多個）"
                            rows={Math.max(1, link.split('\n').length)}
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
    groups: WorkRecordGroup[];
    onUpdateGroups: (groups: WorkRecordGroup[]) => void;
}> = ({ isOpen, onClose, records, onUpdateRecords, groups, onUpdateGroups }) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [linkToast, setLinkToast] = useState<{ urls: string[]; title: string; content: string } | null>(null);
    const [editingRecord, setEditingRecord] = useState<WorkRecord | null>(null);
    const [activeRecord, setActiveRecord] = useState<WorkRecord | null>(null);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    // 無連結時 toast 自動關閉
    useEffect(() => {
        if (linkToast && linkToast.urls.length === 0) {
            const timer = setTimeout(() => setLinkToast(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [linkToast]);

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

    // ESC to close: EditDialog > linkToast > modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation();
                if (editingRecord) {
                    setEditingRecord(null);
                } else if (linkToast) {
                    setLinkToast(null);
                } else {
                    onClose();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, editingRecord, linkToast, onClose]);

    const uncategorizedGroup: WorkRecordGroup = { id: '__uncategorized__', title: '未分類' };

    const orderedGroups = useMemo(() => {
        return [...groups, uncategorizedGroup];
    }, [groups]);

    // Group records by groupId
    const recordsByGroup = useMemo(() => {
        const map: Record<string, WorkRecord[]> = {};
        for (const g of orderedGroups) {
            map[g.id] = [];
        }
        for (const r of records) {
            const gid = r.groupId && groups.find(g => g.id === r.groupId) ? r.groupId : '__uncategorized__';
            if (!map[gid]) map[gid] = [];
            map[gid].push(r);
        }
        return map;
    }, [records, groups, orderedGroups]);

    // All sortable IDs: section headers + record items
    const allSortableIds = useMemo(() => {
        const ids: string[] = [];
        for (const g of orderedGroups) {
            ids.push(`section_${g.id}`);
            const recs = recordsByGroup[g.id] || [];
            recs.forEach(r => ids.push(r.id));
        }
        return ids;
    }, [orderedGroups, recordsByGroup]);

    if (!isOpen) return null;

    const toggleCollapse = (groupId: string) => {
        setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const handleCopy = async (record: WorkRecord) => {
        try {
            await navigator.clipboard.writeText(record.content);
            setCopiedId(record.id);
        } catch {
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
        // 顯示複製成功提示
        const urls = record.link ? record.link.split('\n').map(u => u.trim()).filter(u => u.length > 0) : [];
        setLinkToast({ urls, title: record.title, content: record.content });
    };

    const handleAddRecord = (groupId?: string) => {
        const newRecord: WorkRecord = {
            id: `wr_${Date.now()} `,
            title: '',
            content: '',
            groupId: groupId === '__uncategorized__' ? undefined : groupId,
        };
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

    const handleDeleteRecord = (id: string) => {
        onUpdateRecords(records.filter((r) => r.id !== id));
    };

    const handleAddGroup = () => {
        const newGroup: WorkRecordGroup = {
            id: `wg_${Date.now()} `,
            title: '未命名群組',
        };
        onUpdateGroups([...groups, newGroup]);
    };

    const handleRenameGroup = (groupId: string, title: string) => {
        onUpdateGroups(groups.map(g => g.id === groupId ? { ...g, title } : g));
    };

    const handleDeleteGroup = (groupId: string) => {
        onUpdateRecords(records.map(r => r.groupId === groupId ? { ...r, groupId: undefined } : r));
        onUpdateGroups(groups.filter(g => g.id !== groupId));
    };

    const handleDragStart = (event: DragStartEvent) => {
        const id = event.active.id as string;
        if (id.startsWith('section_')) {
            setActiveSectionId(id);
            setActiveRecord(null);
        } else {
            setActiveRecord(records.find((r) => r.id === id) || null);
            setActiveSectionId(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveRecord(null);
        setActiveSectionId(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // --- Section reorder ---
        if (activeId.startsWith('section_') && overId.startsWith('section_')) {
            const activeGroupId = activeId.replace('section_', '');
            const overGroupId = overId.replace('section_', '');
            if (activeGroupId === '__uncategorized__' || overGroupId === '__uncategorized__') return;

            const oldIdx = groups.findIndex(g => g.id === activeGroupId);
            const overIdx = groups.findIndex(g => g.id === overGroupId);
            if (oldIdx !== -1 && overIdx !== -1) {
                onUpdateGroups(arrayMove(groups, oldIdx, overIdx));
            }
            return;
        }

        // --- Record dropped on a group droppable ---
        if (overId.startsWith('group_')) {
            const targetGroupId = overId.replace('group_', '');
            const newGroupId = targetGroupId === '__uncategorized__' ? undefined : targetGroupId;
            onUpdateRecords(records.map(r => r.id === activeId ? { ...r, groupId: newGroupId } : r));
            return;
        }

        // --- Record reorder / cross-group ---
        const activeRec = records.find(r => r.id === activeId);
        const overRec = records.find(r => r.id === overId);
        if (!activeRec || !overRec) return;

        const activeGroupId = activeRec.groupId && groups.find(g => g.id === activeRec.groupId) ? activeRec.groupId : '__uncategorized__';
        const overGroupId = overRec.groupId && groups.find(g => g.id === overRec.groupId) ? overRec.groupId : '__uncategorized__';

        if (activeGroupId === overGroupId) {
            // Same group: reorder
            const groupRecords = recordsByGroup[activeGroupId] || [];
            const oldIdx = groupRecords.findIndex(r => r.id === activeId);
            const newIdx = groupRecords.findIndex(r => r.id === overId);
            if (oldIdx !== -1 && newIdx !== -1) {
                const reordered = arrayMove(groupRecords, oldIdx, newIdx);
                const newRecords = records.map(r => r);
                const initAcc: number[] = [];
                const groupIndices = records.reduce((acc, r, i) => {
                    const gid = r.groupId && groups.find(g => g.id === r.groupId) ? r.groupId : '__uncategorized__';
                    if (gid === activeGroupId) acc.push(i);
                    return acc;
                }, initAcc);
                groupIndices.forEach((idx, i) => {
                    newRecords[idx] = reordered[i];
                });
                onUpdateRecords(newRecords);
            }
        } else {
            // Cross group: move record
            const newGroupId = overGroupId === '__uncategorized__' ? undefined : overGroupId;
            onUpdateRecords(records.map(r => r.id === activeId ? { ...r, groupId: newGroupId } : r));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

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
                                點擊項目複製 · 雙擊群組名稱可重新命名 · 拖曳可排序
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAddGroup}
                            className="flex items-center gap-1.5 px-3 py-2 text-purple-700 hover:bg-purple-50 rounded-xl text-sm font-bold transition-all active:scale-95"
                        >
                            <FolderPlus size={16} />
                            新增群組
                        </button>
                        <button
                            onClick={() => handleAddRecord()}
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

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6">
                    {records.length === 0 && groups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <FileText size={48} strokeWidth={1.5} />
                            <div className="text-center">
                                <p className="text-lg font-medium">尚無工作記錄</p>
                                <p className="text-sm mt-1">
                                    點擊「新增記錄」建立你的第一個工作記錄模板
                                </p>
                            </div>
                            <button
                                onClick={() => handleAddRecord()}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                <Plus size={16} />
                                新增記錄
                            </button>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={pointerWithin}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="max-w-6xl mx-auto">
                                <SortableContext
                                    items={orderedGroups.map(g => `section_${g.id}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {orderedGroups.map((group, idx) => {
                                        const groupRecords = recordsByGroup[group.id] || [];
                                        const isUncategorized = group.id === '__uncategorized__';
                                        const isCollapsed = !!collapsedGroups[group.id];

                                        // Hide empty uncategorized when there are user groups and records
                                        if (isUncategorized && groupRecords.length === 0 && groups.length > 0) {
                                            return null;
                                        }

                                        return (
                                            <div key={group.id}>
                                                {/* Divider line between sections */}
                                                {idx > 0 && (
                                                    <div className="border-t border-gray-200 my-2" />
                                                )}

                                                <SortableSectionHeader
                                                    group={group}
                                                    recordCount={groupRecords.length}
                                                    collapsed={isCollapsed}
                                                    onToggleCollapse={() => toggleCollapse(group.id)}
                                                    onAddRecord={handleAddRecord}
                                                    onRenameGroup={handleRenameGroup}
                                                    onDeleteGroup={handleDeleteGroup}
                                                    isUncategorized={isUncategorized}
                                                />

                                                <SectionContent
                                                    groupId={group.id}
                                                    records={groupRecords}
                                                    onCopy={handleCopy}
                                                    onEdit={setEditingRecord}
                                                    onDelete={handleDeleteRecord}
                                                    onAddRecord={handleAddRecord}
                                                    copiedId={copiedId}
                                                    collapsed={isCollapsed}
                                                />
                                            </div>
                                        );
                                    })}
                                </SortableContext>
                            </div>

                            <DragOverlay>
                                {activeRecord ? (
                                    <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-400 px-4 py-3 opacity-90 max-w-md">
                                        <span className="font-medium text-gray-800 text-sm">
                                            {activeRecord.title || '未命名'}
                                        </span>
                                    </div>
                                ) : null}
                                {activeSectionId ? (
                                    <div className="bg-white rounded-xl shadow-2xl border-2 border-purple-400 px-4 py-3 opacity-90 max-w-md">
                                        <span className="font-bold text-gray-800 text-base">
                                            {groups.find(g => `section_${g.id}` === activeSectionId)?.title || '段落'}
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
                    groups={groups}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingRecord(null)}
                />
            )}
            {/* Copy Success Overlay */}
            {linkToast && (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center"
                    onClick={() => setLinkToast(null)}
                >
                    {/* 毛玻璃背景 */}
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />
                    {/* 卡片 */}
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-toast-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 成功圖示 */}
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200 animate-success-pop">
                                <Check className="w-7 h-7 text-white" strokeWidth={3} />
                            </div>
                        </div>
                        {/* 標題 */}
                        <h3 className="text-center text-lg font-bold text-gray-800 mb-1">工作項目內容已複製到剪貼簿</h3>
                        {/* 內容預覽 */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                            <p className="text-sm font-semibold text-gray-700 mb-1">📋 {linkToast.title}</p>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                {linkToast.content.length > 80 ? linkToast.content.slice(0, 80) + '…' : linkToast.content}
                            </p>
                        </div>
                        {/* 按鈕區 */}
                        <div className="flex flex-col gap-2">
                            {linkToast.urls.length > 0 && (
                                <button
                                    onClick={() => {
                                        for (let i = linkToast.urls.length - 1; i >= 1; i--) {
                                            const url = linkToast.urls[i];
                                            setTimeout(() => {
                                                window.open(url, '_blank');
                                            }, (linkToast.urls.length - i) * 300);
                                        }
                                        setTimeout(() => {
                                            window.open(linkToast.urls[0], '_blank');
                                        }, linkToast.urls.length * 300);
                                        setLinkToast(null);
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={16} />
                                    {linkToast.urls.length > 1 ? `開啟全部 ${linkToast.urls.length} 個相關網站` : '開啟相關網站'}
                                </button>
                            )}
                            <button
                                onClick={() => setLinkToast(null)}
                                className="w-full py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.3s ease-out;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                @keyframes toast-in {
                    0% { transform: scale(0.85) translateY(20px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                .animate-toast-in {
                    animation: toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes success-pop {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                .animate-success-pop {
                    animation: success-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
                }
            `}</style>
        </div>
    );
};

export default WorkRecordModal;
