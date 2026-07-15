import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_WORK_RECORD_GROUPS,
  DEFAULT_WORK_RECORDS,
} from '../defaultWorkRecordTemplates.ts';

const LIVE_FIREBASE_URL =
  'https://dutystation-check-default-rtdb.asia-southeast1.firebasedatabase.app/dutystation.json';

test('預設工作記錄與目前線上 Firebase 完全一致', async () => {
  const response = await fetch(LIVE_FIREBASE_URL);
  assert.equal(response.ok, true, `讀取線上 Firebase 失敗：${response.status}`);

  const live = await response.json();

  assert.deepStrictEqual(DEFAULT_WORK_RECORD_GROUPS, live.workRecordGroups);
  assert.deepStrictEqual(DEFAULT_WORK_RECORDS, live.workRecords);
});
