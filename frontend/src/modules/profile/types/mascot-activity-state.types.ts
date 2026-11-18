import type { MascotAction } from './mascot-action.types';

export interface MascotActivityState {
  current: (MascotAction & { id: number }) | null;
  queued: MascotAction | null;
  lastId: number;
}
