import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
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

    // 記錄最後一次本地寫入的時間，用來忽略寫入後立即觸發的 onValue
    const lastWriteTime = useRef(0);
    const WRITE_DEBOUNCE_MS = 2000; // 寫入後 2 秒內的回呼忽略

    useEffect(() => {
        // 第一步：用 get() 一次性讀取，確保首次載入可靠
        const rootRef = ref(database, DB_PATH);
        get(rootRef).then((snapshot) => {
            const val = snapshot.val();
            setData(parseFirebaseSnapshot(val));
            setIsLoading(false);
        }).catch((error) => {
            console.error('Firebase 首次讀取失敗:', error);
            setData(parseFirebaseSnapshot(null));
            setIsLoading(false);
        });

        // 第二步：設定 onValue 監聽，用於其他裝置的即時同步
        const unsub = onValue(rootRef, (snapshot) => {
            // 如果是剛剛本地寫入觸發的回呼，忽略它
            const timeSinceWrite = Date.now() - lastWriteTime.current;
            if (timeSinceWrite < WRITE_DEBOUNCE_MS) {
                return;
            }
            const val = snapshot.val();
            setData(parseFirebaseSnapshot(val));
        }, (error) => {
            console.error('Firebase 監聽錯誤:', error);
        });

        return () => unsub();
    }, []);

    const markWrite = () => {
        lastWriteTime.current = Date.now();
    };

    const saveConfig = useCallback((basic: TaskItem[], shifts: ShiftSection[], statuses: StatusConfig[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/config`), { basic, shifts, statuses });
    }, []);

    const saveState = useCallback((checked: Record<string, boolean>, handover: HandoverItem[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/state`), { checkedItems: checked, handoverItems: handover });
    }, []);

    const saveWorkRecords = useCallback((records: WorkRecord[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/workRecords`), records);
    }, []);

    const saveWorkRecordGroups = useCallback((groups: WorkRecordGroup[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/workRecordGroups`), groups);
    }, []);

    const saveTrash = useCallback((items: TrashedItem[]) => {
        markWrite();
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
