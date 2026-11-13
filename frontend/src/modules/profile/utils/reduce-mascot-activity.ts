import type { MascotAction } from '../types/mascot-action.types';
import type { MascotActivityState } from '../types/mascot-activity-state.types';

export const INITIAL_MASCOT_ACTIVITY: MascotActivityState = {
  current: null,
  queued: null,
  lastId: 0,
};

function startMascotAction(
  state: MascotActivityState,
  action: MascotAction,
  queued: MascotAction | null,
): MascotActivityState {
  const id = state.lastId + 1;
  return { current: { ...action, id }, queued, lastId: id };
}

/**
 * A step restarts a running step. Anything else waits in a single-slot queue
 * where the most recent request replaces the previous one.
 */
export function requestMascotAction(
  state: MascotActivityState,
  action: MascotAction,
): MascotActivityState {
  if (!state.current) return startMascotAction(state, action, null);
  if (action.kind === 'step' && state.current.kind === 'step') {
    return startMascotAction(state, action, state.queued);
  }
  return { ...state, queued: action };
}

export function finishMascotAction(
  state: MascotActivityState,
): MascotActivityState {
  if (state.queued) return startMascotAction(state, state.queued, null);
  return { ...state, current: null };
}
