import assert from 'node:assert/strict';
import test from 'node:test';

const existingRecords = [
  {
    id: 'existing-record',
    title: '現有記錄',
    content: '現有內容',
    groupId: 'existing-group',
  },
];

const existingGroups = [
  {
    id: 'existing-group',
    title: '現有群組',
  },
];

async function loadResolver() {
  const module = await import('../workRecordInitialization.ts').catch(() => null);
  assert.ok(module, '應存在工作記錄初始化模組');
  assert.equal(typeof module.resolveInitialWorkRecordState, 'function');
  return module.resolveInitialWorkRecordState;
}

async function loadInitializationMarkerResolver() {
  const module = await import('../workRecordInitialization.ts').catch(() => null);
  assert.ok(module, '應存在工作記錄初始化模組');
  assert.equal(typeof module.deriveWorkRecordsInitialized, 'function');
  return module.deriveWorkRecordsInitialized;
}

test('保留現有工作記錄與群組', async () => {
  const resolveInitialWorkRecordState = await loadResolver();
  const result = resolveInitialWorkRecordState({
    workRecords: existingRecords,
    workRecordGroups: existingGroups,
    workRecordsInitialized: true,
  });

  assert.deepStrictEqual(result.workRecords, existingRecords);
  assert.deepStrictEqual(result.workRecordGroups, existingGroups);
  assert.equal(result.seededDefaults, false);
});

test('保留已初始化但刻意清空的狀態', async () => {
  const resolveInitialWorkRecordState = await loadResolver();
  const result = resolveInitialWorkRecordState({
    workRecords: [],
    workRecordGroups: [],
    workRecordsInitialized: true,
  });

  assert.deepStrictEqual(result.workRecords, []);
  assert.deepStrictEqual(result.workRecordGroups, []);
  assert.equal(result.seededDefaults, false);
});

test('只在尚未初始化時載入 20 筆記錄與 5 個群組', async () => {
  const resolveInitialWorkRecordState = await loadResolver();
  const result = resolveInitialWorkRecordState({
    workRecords: [],
    workRecordGroups: [],
    workRecordsInitialized: false,
  });

  assert.equal(result.workRecords.length, 20);
  assert.equal(result.workRecordGroups.length, 5);
  assert.equal(result.seededDefaults, true);
});

test('舊版 Firebase 只要已有資料就不得套用預設值', async () => {
  const resolveInitialWorkRecordState = await loadResolver();
  const result = resolveInitialWorkRecordState({
    workRecords: existingRecords,
    workRecordGroups: existingGroups,
    workRecordsInitialized: false,
  });

  assert.deepStrictEqual(result.workRecords, existingRecords);
  assert.deepStrictEqual(result.workRecordGroups, existingGroups);
  assert.equal(result.seededDefaults, false);
});

test('初始化標記為 true 時，即使清空資料也維持已初始化', async () => {
  const deriveWorkRecordsInitialized = await loadInitializationMarkerResolver();

  assert.equal(deriveWorkRecordsInitialized(true, [], []), true);
});

test('舊版 Firebase 沒有標記但已有資料時，視為已初始化', async () => {
  const deriveWorkRecordsInitialized = await loadInitializationMarkerResolver();

  assert.equal(
    deriveWorkRecordsInitialized(false, existingRecords, existingGroups),
    true,
  );
});

test('沒有標記且沒有資料時，才視為尚未初始化', async () => {
  const deriveWorkRecordsInitialized = await loadInitializationMarkerResolver();

  assert.equal(deriveWorkRecordsInitialized(false, [], []), false);
});
