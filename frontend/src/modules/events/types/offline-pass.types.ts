import type { PassData } from './pass-data.types';

export interface OfflinePass extends PassData {
  savedAt: string;
}
