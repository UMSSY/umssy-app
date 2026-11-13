import type { MascotAction } from './mascot-action.types';

export interface MascotActivityState {
  /** Action that is running, with the id of its run. */
  current: (MascotAction & { id: number }) | null;
  /** Single-slot queue: only the most recent request is kept. */
  queued: MascotAction | null;
  lastId: number;
}
