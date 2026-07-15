import {
  DEFAULT_WORK_RECORD_GROUPS,
  DEFAULT_WORK_RECORDS,
} from './defaultWorkRecordTemplates';
import { WorkRecord, WorkRecordGroup } from './types';

export interface WorkRecordInitializationInput {
  workRecords: WorkRecord[];
  workRecordGroups: WorkRecordGroup[];
  workRecordsInitialized: boolean;
}

export interface WorkRecordInitializationResult {
  workRecords: WorkRecord[];
  workRecordGroups: WorkRecordGroup[];
  seededDefaults: boolean;
}

export function deriveWorkRecordsInitialized(
  marker: boolean,
  workRecords: WorkRecord[],
  workRecordGroups: WorkRecordGroup[],
): boolean {
  return marker || workRecords.length > 0 || workRecordGroups.length > 0;
}

export function resolveInitialWorkRecordState(
  input: WorkRecordInitializationInput,
): WorkRecordInitializationResult {
  if (
    deriveWorkRecordsInitialized(
      input.workRecordsInitialized,
      input.workRecords,
      input.workRecordGroups,
    )
  ) {
    return {
      workRecords: input.workRecords,
      workRecordGroups: input.workRecordGroups,
      seededDefaults: false,
    };
  }

  return {
    workRecords: DEFAULT_WORK_RECORDS.map(record => ({ ...record })),
    workRecordGroups: DEFAULT_WORK_RECORD_GROUPS.map(group => ({ ...group })),
    seededDefaults: true,
  };
}
