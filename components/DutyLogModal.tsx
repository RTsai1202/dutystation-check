import React, { useMemo, useState } from 'react';
import { Check, Edit2, Plus, Trash2, X } from 'lucide-react';
import { DutyLogEquipmentCounts, DutyLogTemplates, HandoverItem, StatusConfig } from '../types';
import { StatusDropdown } from './StatusDropdown';
import { RichTextDisplay } from './RichTextDisplay';
import { RichTextEditor } from './RichTextEditor';

export type DutyLogFormState = {
  templates: DutyLogTemplates;
  fireCount: number;
  emsCount: number;
  equipmentCounts: DutyLogEquipmentCounts;
  supplements: string[];
  includeMondayReboot: boolean;
  showMondayRebootOption: boolean;
};

export const MONDAY_REBOOT_TEXT = '重開機派遣電腦。';
export const MONDAY_REBOOT_LINE = `五、${MONDAY_REBOOT_TEXT}`;

const CHINESE_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export const toChineseNumeral = (n: number): string => {
  if (n <= 0) return '零';
  if (n < 10) return CHINESE_DIGITS[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + CHINESE_DIGITS[n - 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return CHINESE_DIGITS[tens] + '十' + (ones ? CHINESE_DIGITS[ones] : '');
};

export const EQUIPMENT_FIELDS: Array<{ key: keyof DutyLogEquipmentCounts; label: string }> = [
  { key: 'vehicleRadio', label: '車裝台' },
  { key: 'fixedRadio', label: '固定台' },
  { key: 'portableRadio', label: '手提台' },
  { key: 'vehicle', label: '車輛' },
  { key: 'motorcycle', label: '機車' },
  { key: 'satellitePhone', label: '衛星電話' },
  { key: 'tablet', label: '平板' },
];

export const normalizeCount = (value: unknown) => {
  const count = Number(value);
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.floor(count));
};

export const normalizeEquipmentCounts = (counts?: Partial<DutyLogEquipmentCounts>): DutyLogEquipmentCounts => ({
  vehicleRadio: normalizeCount(counts?.vehicleRadio),
  fixedRadio: normalizeCount(counts?.fixedRadio),
  portableRadio: normalizeCount(counts?.portableRadio),
  vehicle: normalizeCount(counts?.vehicle),
  motorcycle: normalizeCount(counts?.motorcycle),
  satellitePhone: normalizeCount(counts?.satellitePhone),
  tablet: normalizeCount(counts?.tablet),
});

export const shouldOfferMondayReboot = (date: Date) => date.getDay() === 1 && date.getHours() >= 6 && date.getHours() < 13;

export const buildDutyLogText = (form: DutyLogFormState) => {
  const lines = [
    form.templates.line1,
    form.templates.line2,
    `三、火警 ${form.fireCount} 件、救護 ${form.emsCount} 件。`,
    `四、值班台無線電及設備清點：車裝台 ${form.equipmentCounts.vehicleRadio} 台、固定台 ${form.equipmentCounts.fixedRadio} 台、手提台 ${form.equipmentCounts.portableRadio} 台、車輛 ${form.equipmentCounts.vehicle} 台、機車 ${form.equipmentCounts.motorcycle} 台、衛星電話 ${form.equipmentCounts.satellitePhone} 台、平板 ${form.equipmentCounts.tablet} 台`,
  ].map(line => line.trim()).filter(Boolean);

  let nextIndex = 5;
  if (form.showMondayRebootOption && form.includeMondayReboot) {
    lines.push(`${toChineseNumeral(nextIndex)}、${MONDAY_REBOOT_TEXT}`);
    nextIndex += 1;
  }

  const supplements = (form.supplements || []).map(s => s.trim()).filter(Boolean);
  supplements.forEach(text => {
    lines.push(`${toChineseNumeral(nextIndex)}、${text}`);
    nextIndex += 1;
  });

  return lines.join('\n');
};

const NumberField: React.FC<{ label: string; value: number; onChange: (value: number) => void }> = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold text-gray-500">{label}</span>
    <input
      type="number"
      min={0}
      step={1}
      value={value}
      onChange={(e) => onChange(normalizeCount(e.target.value))}
      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </label>
);

const DutyLogModal: React.FC<{
  form: DutyLogFormState | null;
  onChange: (next: DutyLogFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  handoverItems: HandoverItem[];
  onUpdateHandoverItems: (items: HandoverItem[]) => void;
  onSelectHandoverStatus: (itemId: string, statusId: string) => void;
  statusConfigs: StatusConfig[];
  onUpdateStatuses: (statuses: StatusConfig[]) => void;
  defaultHandoverStatusId: string;
}> = ({ form, onChange, onClose, onSubmit, handoverItems, onUpdateHandoverItems, onSelectHandoverStatus, statusConfigs, onUpdateStatuses, defaultHandoverStatusId }) => {
  const [showSupplementEditor, setShowSupplementEditor] = useState(false);
  const [editingHandoverId, setEditingHandoverId] = useState<string | null>(null);
  const preview = useMemo(() => form ? buildDutyLogText(form) : '', [form]);
  if (!form) return null;

  const updateTemplate = (key: keyof DutyLogTemplates, value: string) => {
    onChange({ ...form, templates: { ...form.templates, [key]: value } });
  };

  const updateEquipment = (key: keyof DutyLogEquipmentCounts, value: number) => {
    onChange({ ...form, equipmentCounts: { ...form.equipmentCounts, [key]: value } });
  };

  const updateHandoverItem = (id: string, updates: Partial<HandoverItem>) => {
    onUpdateHandoverItems(handoverItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addHandoverItem = () => {
    const newItem: HandoverItem = {
      id: `handover_${Date.now()}`,
      label: '新交接事項',
      subtext: '',
      statusId: defaultHandoverStatusId,
    };
    onUpdateHandoverItems([newItem, ...handoverItems]);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">登打值班工作紀錄</h2>
            <p className="text-xs text-gray-500">確認後會複製內容，並保存模板與設備數量。</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="關閉">
            <X size={20} />
          </button>
        </div>

        <div className="grid flex-grow grid-cols-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800">模板內容</h3>
              <textarea className="min-h-[56px] w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" value={form.templates.line1} onChange={(e) => updateTemplate('line1', e.target.value)} />
              <textarea className="min-h-[56px] w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" value={form.templates.line2} onChange={(e) => updateTemplate('line2', e.target.value)} />
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm leading-7 text-gray-700">
                三、火警 <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-700">火警數量</span> 件、救護 <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-700">救護數量</span> 件。
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm leading-7 text-gray-700">
                <div>四、值班台無線電及設備清點：</div>
                <div className="text-xs font-bold text-blue-600">（由下方欄位自動帶入）</div>
                <div>車裝台、固定台、手提台、車輛、機車、衛星電話、平板</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumberField label="火警" value={form.fireCount} onChange={(value) => onChange({ ...form, fireCount: value })} />
              <NumberField label="救護" value={form.emsCount} onChange={(value) => onChange({ ...form, emsCount: value })} />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800">值班台無線電及設備清點</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {EQUIPMENT_FIELDS.map(field => (
                  <NumberField key={field.key} label={field.label} value={form.equipmentCounts[field.key]} onChange={(value) => updateEquipment(field.key, value)} />
                ))}
              </div>
            </div>

            {form.showMondayRebootOption && (
              <label className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-bold text-blue-900">
                <input
                  type="checkbox"
                  checked={form.includeMondayReboot}
                  onChange={(e) => onChange({ ...form, includeMondayReboot: e.target.checked })}
                  className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                附加：{MONDAY_REBOOT_LINE}
              </label>
            )}

          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-800">送出內容預覽</h3>
              <button
                onClick={() => setShowSupplementEditor(true)}
                className="rounded-xl border border-sky-500 bg-sky-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-600"
              >
                {form.supplements.some(s => s.trim()) ? `編輯本次補充事項（${form.supplements.filter(s => s.trim()).length}）` : '增加本次補充事項'}
              </button>
            </div>
            <textarea
              readOnly
              className="min-h-[260px] flex-grow resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-sm leading-7 text-gray-800 outline-none"
              value={preview}
            />

            <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">近期注意、交接事項</h3>
                  <p className="text-xs text-gray-500">同步首頁交接事項；此區不會寫入工作紀錄輸出。</p>
                </div>
                <button
                  onClick={addHandoverItem}
                  className="flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  <Plus size={14} />
                  新增
                </button>
              </div>
              {handoverItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-indigo-200 bg-white/70 py-6 text-center text-sm text-gray-400">
                  目前無待辦交接事項
                </div>
              ) : (
                <div className="space-y-2">
                  {handoverItems.map(item => {
                    const isEditing = editingHandoverId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="group rounded-xl border border-indigo-100 bg-white p-2.5 shadow-sm"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setEditingHandoverId(item.id);
                        }}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <StatusDropdown
                                currentStatusId={item.statusId}
                                statusConfigs={statusConfigs}
                                onSelectStatus={(statusId) => onSelectHandoverStatus(item.id, statusId)}
                                onUpdateStatuses={onUpdateStatuses}
                              />
                              <button
                                onClick={() => setEditingHandoverId(null)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                title="完成編輯"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <input
                              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-bold text-gray-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                              value={item.label}
                              onChange={(e) => updateHandoverItem(item.id, { label: e.target.value })}
                              placeholder="交接事項標題"
                              autoFocus
                            />
                            <RichTextEditor
                              value={item.subtext || ''}
                              onChange={(html) => updateHandoverItem(item.id, { subtext: html })}
                              placeholder="說明"
                            />
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => onUpdateHandoverItems(handoverItems.filter(target => target.id !== item.id))}
                                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                                刪除
                              </button>
                              <button
                                onClick={() => setEditingHandoverId(null)}
                                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                              >
                                完成
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <StatusDropdown
                                  currentStatusId={item.statusId}
                                  statusConfigs={statusConfigs}
                                  onSelectStatus={(statusId) => onSelectHandoverStatus(item.id, statusId)}
                                  onUpdateStatuses={onUpdateStatuses}
                                />
                                <div className="truncate text-sm font-bold text-gray-800">{item.label || '未命名交接事項'}</div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={() => setEditingHandoverId(item.id)}
                                  className="rounded-lg p-1.5 text-gray-300 hover:bg-indigo-50 hover:text-indigo-600"
                                  title="編輯說明"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => onUpdateHandoverItems(handoverItems.filter(target => target.id !== item.id))}
                                  className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                  title="刪除交接事項"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {item.subtext && (
                              <div className="mt-2 hidden rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 group-hover:block">
                                <RichTextDisplay html={item.subtext} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
            取消
          </button>
          <button onClick={onSubmit} className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95">
            <Check size={16} />
            確認送出並複製
          </button>
        </div>
      </div>

      {showSupplementEditor && (() => {
        const startIndex = form.showMondayRebootOption && form.includeMondayReboot ? 6 : 5;
        const updateSupplement = (idx: number, value: string) => {
          const next = [...form.supplements];
          next[idx] = value;
          onChange({ ...form, supplements: next });
        };
        const removeSupplement = (idx: number) => {
          onChange({ ...form, supplements: form.supplements.filter((_, i) => i !== idx) });
        };
        const addSupplement = () => {
          onChange({ ...form, supplements: [...form.supplements, ''] });
        };
        const items = form.supplements.length > 0 ? form.supplements : [''];
        if (form.supplements.length === 0 && items.length === 1) {
          // ensure state has at least one row so input is controlled
          // (no-op; rendered from items)
        }
        return (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">本次補充事項</h3>
                  <p className="text-xs text-gray-500">每條一行，會自動以「{toChineseNumeral(startIndex)}、{toChineseNumeral(startIndex + 1)}、…」編號接續。送出後不會保存。</p>
                </div>
                <button onClick={() => setShowSupplementEditor(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {items.map((value, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-12 flex-shrink-0 text-right text-sm font-bold text-sky-600">
                      {toChineseNumeral(startIndex + idx)}、
                    </span>
                    <input
                      autoFocus={idx === items.length - 1}
                      className="flex-grow rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      value={value}
                      onChange={(e) => {
                        if (form.supplements.length === 0) {
                          onChange({ ...form, supplements: [e.target.value] });
                        } else {
                          updateSupplement(idx, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (form.supplements.length === 0) {
                            onChange({ ...form, supplements: [value, ''] });
                          } else {
                            addSupplement();
                          }
                        }
                      }}
                      placeholder="輸入一條補充事項"
                    />
                    <button
                      onClick={() => {
                        if (form.supplements.length === 0) return;
                        removeSupplement(idx);
                      }}
                      disabled={form.supplements.length === 0}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300"
                      title="刪除這條"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addSupplement}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 py-2.5 text-sm font-bold text-gray-500 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600"
              >
                <Plus size={16} />
                新增一條
              </button>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => onChange({ ...form, supplements: [] })}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50"
                >
                  清空
                </button>
                <button
                  onClick={() => setShowSupplementEditor(false)}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DutyLogModal;
