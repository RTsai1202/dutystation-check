import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { StatusConfig } from '../types';

interface StatusDropdownProps {
    currentStatusId: string;
    statusConfigs: StatusConfig[];
    onSelectStatus: (statusId: string) => void;
    onUpdateStatuses: (statuses: StatusConfig[]) => void;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
    currentStatusId,
    statusConfigs,
    onSelectStatus,
    onUpdateStatuses,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editColor, setEditColor] = useState('');

    // Positioning state
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentStatus = statusConfigs.find(s => s.id === currentStatusId);

    // Update position when opening
    useLayoutEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;

            // Default: align left, drop UP if too close to bottom? 
            // For simplicity, let's just drop down first, but we can make it smarter if needed.
            // Adjusting logic to prevent off-screen could be added later.

            setPosition({
                top: rect.bottom + scrollY + 4, // 4px gap
                left: rect.left + scrollX,
                width: 256 // w-64 = 256px
            });
        }
    }, [isOpen]);

    // Close dropdown when clicking outside or resizing/scrolling
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Check if click is inside the portal dropdown
            if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
                return;
            }
            // Check if click is on the trigger button
            if (buttonRef.current && buttonRef.current.contains(e.target as Node)) {
                return;
            }

            setIsOpen(false);
            setEditingId(null);
        };

        const handleScrollOrResize = () => {
            if (isOpen) setIsOpen(false); // Close on scroll/resize for simplicity to avoid detached floating menus
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', handleScrollOrResize);
            window.addEventListener('scroll', handleScrollOrResize, true); // true for capturing scroll in sub-elements
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    const startEditing = (status: StatusConfig, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(status.id);
        setEditLabel(status.label);
        setEditColor(status.color);
    };

    const saveEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && editLabel.trim()) {
            onUpdateStatuses(
                statusConfigs.map(s =>
                    s.id === editingId ? { ...s, label: editLabel.trim(), color: editColor } : s
                )
            );
        }
        setEditingId(null);
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const handleDelete = (statusId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (statusConfigs.length <= 1) return;
        onUpdateStatuses(statusConfigs.filter(s => s.id !== statusId));
        if (currentStatusId === statusId) {
            const remaining = statusConfigs.filter(s => s.id !== statusId);
            if (remaining.length > 0) onSelectStatus(remaining[0].id);
        }
        setEditingId(null);
    };

    const handleAddStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus: StatusConfig = {
            id: `status_${Date.now()}`,
            label: '新狀態',
            color: '#64748b',
        };
        onUpdateStatuses([...statusConfigs, newStatus]);
        setEditingId(newStatus.id);
        setEditLabel('新狀態');
        setEditColor('#64748b');
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent click events
                    setIsOpen(!isOpen);
                    setEditingId(null);
                }}
                className="text-[11px] px-3 py-1.5 rounded-full font-bold text-white shadow-sm flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
                style={{ backgroundColor: currentStatus?.color || '#94a3b8' }}
            >
                {currentStatus?.label || '無狀態'}
                <svg
                    className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu Portal */}
            {isOpen && ReactDOM.createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
                    style={{
                        top: position.top,
                        left: position.left,
                        width: position.width,
                        animation: 'dropdownIn 0.15s ease-out'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: translateY(4px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

                    {/* Header */}
                    <div className="px-3 py-2 border-b border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">選擇狀態</span>
                    </div>

                    {/* Status List */}
                    <div className="py-1 max-h-60 overflow-y-auto">
                        {statusConfigs.map(status => (
                            <div key={status.id}>
                                {editingId === status.id ? (
                                    /* Editing Mode */
                                    <div className="px-3 py-2 bg-blue-50 border-y border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                type="color"
                                                value={editColor}
                                                onChange={e => setEditColor(e.target.value)}
                                                className="w-7 h-7 rounded-md border border-gray-300 cursor-pointer p-0 overflow-hidden shrink-0"
                                                onClick={e => e.stopPropagation()}
                                            />
                                            <input
                                                className="flex-grow text-sm font-medium bg-white border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                value={editLabel}
                                                onChange={e => setEditLabel(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                onKeyDown={e => { if (e.key === 'Enter') saveEdit(e as any); if (e.key === 'Escape') cancelEdit(e as any); }}
                                                autoFocus
                                                placeholder="狀態名稱"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={e => handleDelete(status.id, e)}
                                                    className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5 px-1.5 py-1 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={11} /> 刪除
                                                </button>
                                                <button
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        const updated = statusConfigs.map(s =>
                                                            s.id === status.id ? { ...s, isDone: !s.isDone } : s
                                                        );
                                                        onUpdateStatuses(updated);
                                                    }}
                                                    className={`text-[10px] px-1.5 py-1 rounded flex items-center gap-0.5 transition-colors ${status.isDone
                                                        ? 'bg-green-600 text-white'
                                                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50 border border-gray-200'
                                                        }`}
                                                    title="此狀態代表結案，選取後項目自動歸檔至垃圾桶"
                                                >
                                                    <Check size={11} /> {status.isDone ? '歸檔 ✓' : '歸檔'}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={cancelEdit}
                                                    className="text-[10px] text-gray-500 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    onClick={saveEdit}
                                                    className="text-[10px] text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-0.5"
                                                >
                                                    <Check size={11} /> 儲存
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal Mode */
                                    <div
                                        className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors group ${status.id === currentStatusId ? 'bg-gray-50' : 'hover:bg-gray-50'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectStatus(status.id);
                                            setIsOpen(false);
                                        }}
                                    >
                                        {/* Color dot */}
                                        <span
                                            className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-offset-1"
                                            style={{ backgroundColor: status.color }} // Removed invalid ringColor style, simplified
                                        />
                                        {/* Label */}
                                        <span className="flex-grow text-sm text-gray-700 font-medium">{status.label}</span>
                                        {/* Check mark for current */}
                                        {status.id === currentStatusId && (
                                            <Check size={14} className="text-blue-600 shrink-0" />
                                        )}
                                        {/* Edit button */}
                                        <button
                                            onClick={e => startEditing(status, e)}
                                            className="p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                            title="編輯狀態"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add New Status */}
                    <div className="border-t border-gray-100">
                        <button
                            onClick={handleAddStatus}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        >
                            <Plus size={14} />
                            <span className="font-medium">新增狀態</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
