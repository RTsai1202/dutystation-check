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
const PATHS = {
    config: `${DB_PATH}/config`,
    state: `${DB_PATH}/state`,
    workRecords: `${DB_PATH}/workRecords`,
    workRecordGroups: `${DB_PATH}/workRecordGroups`,
    trash: `${DB_PATH}/trash`,
} as const;

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

export function useFirebaseSync(): UseFirebaseSyncResult {
    const [data, setData] = useState<FirebaseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 追蹤已載入的資料路徑
    const loadedPaths = useRef(new Set<string>());
    const totalPaths = Object.keys(PATHS).length;

    // 組合片段資料
    const partialData = useRef<Partial<FirebaseData>>({});

    // 防止寫回觸發的迴圈
    const skipNextUpdate = useRef<Record<string, boolean>>({});

    useEffect(() => {
        // 監聽 config
        const configRef = ref(database, PATHS.config);
        const unsubConfig = onValue(configRef, (snapshot) => {
            if (skipNextUpdate.current['config']) {
                skipNextUpdate.current['config'] = false;
                return;
            }
            const val = snapshot.val();
            partialData.current = {
                ...partialData.current,
                basicTasks: val?.basic || partialData.current.basicTasks || [],
                shiftSections: val?.shifts || partialData.current.shiftSections || [],
                statusConfigs: val?.statuses || partialData.current.statusConfigs || [],
            };
            loadedPaths.current.add('config');
            if (loadedPaths.current.size >= totalPaths) {
                setData({ ...partialData.current } as FirebaseData);
                setIsLoading(false);
            }
        });

        // 監聽 state
        const stateRef = ref(database, PATHS.state);
        const unsubState = onValue(stateRef, (snapshot) => {
            if (skipNextUpdate.current['state']) {
                skipNextUpdate.current['state'] = false;
                return;
            }
            const val = snapshot.val();
            partialData.current = {
                ...partialData.current,
                checkedItems: val?.checkedItems || {},
                handoverItems: val?.handoverItems || [],
            };
            loadedPaths.current.add('state');
            if (loadedPaths.current.size >= totalPaths) {
                setData({ ...partialData.current } as FirebaseData);
                setIsLoading(false);
            }
        });

        // 監聽 workRecords
        const recordsRef = ref(database, PATHS.workRecords);
        const unsubRecords = onValue(recordsRef, (snapshot) => {
            if (skipNextUpdate.current['workRecords']) {
                skipNextUpdate.current['workRecords'] = false;
                return;
            }
            partialData.current = {
                ...partialData.current,
                workRecords: snapshot.val() || [],
            };
            loadedPaths.current.add('workRecords');
            if (loadedPaths.current.size >= totalPaths) {
                setData({ ...partialData.current } as FirebaseData);
                setIsLoading(false);
            }
        });

        // 監聽 workRecordGroups
        const groupsRef = ref(database, PATHS.workRecordGroups);
        const unsubGroups = onValue(groupsRef, (snapshot) => {
            if (skipNextUpdate.current['workRecordGroups']) {
                skipNextUpdate.current['workRecordGroups'] = false;
                return;
            }
            partialData.current = {
                ...partialData.current,
                workRecordGroups: snapshot.val() || [],
            };
            loadedPaths.current.add('workRecordGroups');
            if (loadedPaths.current.size >= totalPaths) {
                setData({ ...partialData.current } as FirebaseData);
                setIsLoading(false);
            }
        });

        // 監聽 trash
        const trashRef = ref(database, PATHS.trash);
        const unsubTrash = onValue(trashRef, (snapshot) => {
            if (skipNextUpdate.current['trash']) {
                skipNextUpdate.current['trash'] = false;
                return;
            }
            const items: TrashedItem[] = snapshot.val() || [];
            const now = Date.now();
            partialData.current = {
                ...partialData.current,
                trashedItems: items.filter(item => (now - item.trashedAt) < THIRTY_DAYS_MS),
            };
            loadedPaths.current.add('trash');
            if (loadedPaths.current.size >= totalPaths) {
                setData({ ...partialData.current } as FirebaseData);
                setIsLoading(false);
            }
        });

        return () => {
            unsubConfig();
            unsubState();
            unsubRecords();
            unsubGroups();
            unsubTrash();
        };
    }, []);

    const saveConfig = useCallback((basic: TaskItem[], shifts: ShiftSection[], statuses: StatusConfig[]) => {
        skipNextUpdate.current['config'] = true;
        set(ref(database, PATHS.config), { basic, shifts, statuses });
    }, []);

    const saveState = useCallback((checked: Record<string, boolean>, handover: HandoverItem[]) => {
        skipNextUpdate.current['state'] = true;
        set(ref(database, PATHS.state), { checkedItems: checked, handoverItems: handover });
    }, []);

    const saveWorkRecords = useCallback((records: WorkRecord[]) => {
        skipNextUpdate.current['workRecords'] = true;
        set(ref(database, PATHS.workRecords), records);
    }, []);

    const saveWorkRecordGroups = useCallback((groups: WorkRecordGroup[]) => {
        skipNextUpdate.current['workRecordGroups'] = true;
        set(ref(database, PATHS.workRecordGroups), groups);
    }, []);

    const saveTrash = useCallback((items: TrashedItem[]) => {
        skipNextUpdate.current['trash'] = true;
        set(ref(database, PATHS.trash), items);
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
