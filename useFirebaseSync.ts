import { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, set, get, update } from 'firebase/database';
import { database, ensureSignedIn } from './firebase';
import { deriveWorkRecordsInitialized } from './workRecordInitialization';
import {
    TaskItem,
    ShiftSection,
    StatusConfig,
    HandoverItem,
    TrashedItem,
    WorkRecord,
    WorkRecordGroup,
    DutyLogConfig,
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
    workRecordsInitialized: boolean;
    trashedItems: TrashedItem[];
    dutyLogConfig?: Partial<DutyLogConfig>;
}

interface UseFirebaseSyncResult {
    data: FirebaseData | null;
    isLoading: boolean;
    error: string | null;
    saveConfig: (basic: TaskItem[], shifts: ShiftSection[], statuses: StatusConfig[]) => void;
    saveState: (checked: Record<string, boolean>, handover: HandoverItem[]) => void;
    saveWorkRecords: (records: WorkRecord[]) => void;
    saveWorkRecordGroups: (groups: WorkRecordGroup[]) => void;
    saveTrash: (items: TrashedItem[]) => void;
    saveDutyLogConfig: (config: DutyLogConfig) => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function parseFirebaseSnapshot(val: any): FirebaseData {
    const now = Date.now();
    const rawTrash: TrashedItem[] = val?.trash || [];
    const workRecords: WorkRecord[] = Array.isArray(val?.workRecords) ? val.workRecords : [];
    const workRecordGroups: WorkRecordGroup[] = Array.isArray(val?.workRecordGroups) ? val.workRecordGroups : [];

    return {
        basicTasks: val?.config?.basic || [],
        shiftSections: val?.config?.shifts || [],
        statusConfigs: val?.config?.statuses || [],
        checkedItems: val?.state?.checkedItems || {},
        handoverItems: val?.state?.handoverItems || [],
        workRecords,
        workRecordGroups,
        workRecordsInitialized: deriveWorkRecordsInitialized(
            val?.workRecordsInitialized === true,
            workRecords,
            workRecordGroups,
        ),
        dutyLogConfig: val?.dutyLogConfig || val?.config?.dutyLog,
        trashedItems: Array.isArray(rawTrash)
            ? rawTrash.filter(item => item && (now - item.trashedAt) < THIRTY_DAYS_MS)
            : [],
    };
}

export function useFirebaseSync(): UseFirebaseSyncResult {
    const [data, setData] = useState<FirebaseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 記錄最後一次本地寫入的時間，用來忽略寫入後立即觸發的 onValue
    const lastWriteTime = useRef(0);
    const WRITE_DEBOUNCE_MS = 2000; // 寫入後 2 秒內的回呼忽略

    useEffect(() => {
        let cancelled = false;
        let unsub: (() => void) | null = null;

        const start = async () => {
            // 第零步：先匿名登入（RTDB 規則要求 auth != null）
            try {
                await ensureSignedIn();
            } catch (err) {
                console.error('Firebase 匿名登入失敗:', err);
                if (!cancelled) {
                    setError('連線失敗');
                    setIsLoading(false);
                }
                return;
            }
            if (cancelled) return;

            const rootRef = ref(database, DB_PATH);

            // 第一步：用 get() 一次性讀取，確保首次載入可靠
            get(rootRef).then((snapshot) => {
                if (cancelled) return;
                const val = snapshot.val();
                setData(parseFirebaseSnapshot(val));
                setIsLoading(false);
            }).catch((err) => {
                console.error('Firebase 首次讀取失敗:', err);
                if (cancelled) return;
                setError('連線失敗');
                setIsLoading(false);
            });

            // 第二步：設定 onValue 監聽，用於其他裝置的即時同步
            unsub = onValue(rootRef, (snapshot) => {
                // 如果是剛剛本地寫入觸發的回呼，忽略它
                const timeSinceWrite = Date.now() - lastWriteTime.current;
                if (timeSinceWrite < WRITE_DEBOUNCE_MS) {
                    return;
                }
                const val = snapshot.val();
                setData(parseFirebaseSnapshot(val));
            }, (err) => {
                console.error('Firebase 監聽錯誤:', err);
            });
        };

        start();

        return () => {
            cancelled = true;
            if (unsub) unsub();
        };
    }, []);

    const markWrite = () => {
        lastWriteTime.current = Date.now();
    };

    // Firebase 不接受 undefined 值，需要轉成 null
    const sanitize = (obj: any): any => {
        if (obj === undefined) return null;
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sanitize);
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = sanitize(value);
        }
        return result;
    };

    const saveConfig = useCallback((basic: TaskItem[], shifts: ShiftSection[], statuses: StatusConfig[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/config`), sanitize({ basic, shifts, statuses }));
    }, []);

    const saveState = useCallback((checked: Record<string, boolean>, handover: HandoverItem[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/state`), sanitize({ checkedItems: checked, handoverItems: handover }));
    }, []);

    const saveWorkRecords = useCallback((records: WorkRecord[]) => {
        markWrite();
        update(ref(database, DB_PATH), {
            workRecords: sanitize(records),
            workRecordsInitialized: true,
        });
    }, []);

    const saveWorkRecordGroups = useCallback((groups: WorkRecordGroup[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/workRecordGroups`), sanitize(groups));
    }, []);

    const saveTrash = useCallback((items: TrashedItem[]) => {
        markWrite();
        set(ref(database, `${DB_PATH}/trash`), sanitize(items));
    }, []);

    const saveDutyLogConfig = useCallback((config: DutyLogConfig) => {
        markWrite();
        set(ref(database, `${DB_PATH}/dutyLogConfig`), sanitize(config));
    }, []);

    return {
        data,
        isLoading,
        error,
        saveConfig,
        saveState,
        saveWorkRecords,
        saveWorkRecordGroups,
        saveTrash,
        saveDutyLogConfig,
    };
}
