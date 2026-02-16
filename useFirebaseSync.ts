import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from './firebase';
import {
    TaskItem,
    ShiftSection,
    StatusConfig,
    HandoverItem,
    TrashedItem,
    WorkRecord,
    WorkRecordGroup,
} from './types';

// 資料庫路徑定義
const DB_PATH = 'dutystation';

export interface FirebaseData {
    basicTasks: TaskItem[];
    shiftSections: ShiftSection[];
    statusConfigs: StatusConfig[];
    checkedItems: Record<string, boolean>;
    handoverItems: HandoverItem[];
    workRecords: WorkRecord[];
    workRecordGroups: WorkRecordGroup[];
    trashedItems: TrashedItem[];
}

interface UseFirebaseSyncResult {
    data: FirebaseData | null;
    isLoading: boolean;
    saveConfig: (basic: TaskItem[], shifts: ShiftSection[], statuses: StatusConfig[]) => void;
    saveState: (checked: Record<string, boolean>, handover: HandoverItem[]) => void;
    saveWorkRecords: (records: WorkRecord[]) => void;
    saveWorkRecordGroups: (groups: WorkRecordGroup[]) => void;
    saveTrash: (items: TrashedItem[]) => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function parseFirebaseSnapshot(val: any): FirebaseData {
    const now = Date.now();
    const rawTrash: TrashedItem[] = val?.trash || [];

    return {
        basicTasks: val?.config?.basic || [],
        shiftSections: val?.config?.shifts || [],
        statusConfigs: val?.config?.statuses || [],
        checkedItems: val?.state?.checkedItems || {},
        handoverItems: val?.state?.handoverItems || [],
        workRecords: val?.workRecords || [],
        workRecordGroups: val?.workRecordGroups || [],
        trashedItems: Array.isArray(rawTrash)
            ? rawTrash.filter(item => item && (now - item.trashedAt) < THIRTY_DAYS_MS)
            : [],
    };
}

export function useFirebaseSync(): UseFirebaseSyncResult {
    const [data, setData] = useState<FirebaseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 防止本地寫回觸發不必要的 re-render
    const isLocalWrite = useRef(false);

    useEffect(() => {
        // 監聽整個 dutystation 根路徑 — 一次取得所有資料
        const rootRef = ref(database, DB_PATH);
        const unsub = onValue(rootRef, (snapshot) => {
            if (isLocalWrite.current) {
                isLocalWrite.current = false;
                return;
            }
            const val = snapshot.val();
            setData(parseFirebaseSnapshot(val));
            setIsLoading(false);
        }, (error) => {
            console.error('Firebase 連線錯誤:', error);
            // 即使連線失敗也要解除 loading，使用預設資料
            setData(parseFirebaseSnapshot(null));
            setIsLoading(false);
        });

        return () => unsub();
    }, []);

    const saveConfig = useCallback((basic: TaskItem[], shifts: ShiftSection[], statuses: StatusConfig[]) => {
        isLocalWrite.current = true;
        set(ref(database, `${DB_PATH}/config`), { basic, shifts, statuses });
    }, []);

    const saveState = useCallback((checked: Record<string, boolean>, handover: HandoverItem[]) => {
        isLocalWrite.current = true;
        set(ref(database, `${DB_PATH}/state`), { checkedItems: checked, handoverItems: handover });
    }, []);

    const saveWorkRecords = useCallback((records: WorkRecord[]) => {
        isLocalWrite.current = true;
        set(ref(database, `${DB_PATH}/workRecords`), records);
    }, []);

    const saveWorkRecordGroups = useCallback((groups: WorkRecordGroup[]) => {
        isLocalWrite.current = true;
        set(ref(database, `${DB_PATH}/workRecordGroups`), groups);
    }, []);

    const saveTrash = useCallback((items: TrashedItem[]) => {
        isLocalWrite.current = true;
        set(ref(database, `${DB_PATH}/trash`), items);
    }, []);

    return {
        data,
        isLoading,
        saveConfig,
        saveState,
        saveWorkRecords,
        saveWorkRecordGroups,
        saveTrash,
    };
}
