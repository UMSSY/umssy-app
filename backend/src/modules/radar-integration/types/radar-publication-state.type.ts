import type { SnapshotRow } from './snapshot-row.type.js';

export type RadarPublicationState = {
  snapshots: SnapshotRow[];
  pendingDocs: { count: bigint }[];
  pendingSkills: number;
  state: {
    status: string;
    inputRevision: number;
    processedRevision: number | null;
    dictionaryVersion: string | null;
  } | null;
  attempts: { status: string; source_revision: number | null }[];
};
