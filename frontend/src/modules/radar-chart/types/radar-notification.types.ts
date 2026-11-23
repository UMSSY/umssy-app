export interface RadarNotification {
  id: string;
  snapshotId: string;
  message: string;
  version: number;
  createdAt: string;
  readAt: string | null;
}

export type { OpenedRadarNotification } from './opened-radar-notification.types';
