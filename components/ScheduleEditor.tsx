import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface ScheduleEditorProps {
    showOnDays?: number[];
    showInMonths?: number[];
    onUpdateDays: (days: number[] | undefined) => void;
    onUpdateMonths: (months: number[] | undefined) => void;
}

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
    showOnDays,
    showInMonths,
    onUpdateDays,
    onUpdateMonths,
}) => {
    const [isExpanded, setIsExpanded] = useState(
        !!(showOnDays?.length || showInMonths?.length)
    );

    const hasSchedule = !!(showOnDays?.length || showInMonths?.length);

    const toggleDay = (day: number) => {
        const current = showOnDays || [];
        const updated = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort();
        onUpdateDays(updated.length > 0 ? updated : undefined);
    };

    const toggleMonth = (month: number) => {
        const current = showInMonths || [];
        const updated = current.includes(month)
            ? current.filter(m => m !== month)
            : [...current, month].sort((a, b) => a - b);
        onUpdateMonths(updated.length > 0 ? updated : undefined);
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Collapsible Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    <Calendar size={14} className={hasSchedule ? 'text-blue-500' : 'text-gray-400'} />
                    <span className="text-xs font-bold text-gray-600">顯示排程</span>
                    {hasSchedule && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                            已設定
                        </span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-3 space-y-3 bg-white">
                    {/* Day of Week Toggle */}
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            指定星期
                        </div>
                        <div className="flex gap-1.5">
                            {DAY_LABELS.map((label, idx) => {
                                const isActive = showOnDays?.includes(idx) ?? false;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleDay(idx); }}
                                        className={`w-8 h-8 rounded-full text-xs font-bold transition-all duration-150
                      ${isActive
                                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                                : 'bg-white text-gray-500 border border-gray-300 hover:border-blue-400 hover:text-blue-500'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Month Toggle */}
                    <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                            指定月份
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {MONTHS.map(month => {
                                const isActive = showInMonths?.includes(month) ?? false;
                                return (
                                    <button
                                        key={month}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleMonth(month); }}
                                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all duration-150
                      ${isActive
                                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                                : 'bg-white text-gray-500 border border-gray-300 hover:border-blue-400 hover:text-blue-500'
                                            }`}
                                    >
                                        {month}月
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hint */}
                    <p className="text-[10px] text-gray-400 italic">
                        未選擇 = 每天 / 每月都顯示
                    </p>
                </div>
            )}
        </div>
    );
};

export default ScheduleEditor;
