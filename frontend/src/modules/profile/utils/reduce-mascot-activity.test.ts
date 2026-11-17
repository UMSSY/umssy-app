import { describe, expect, it } from 'vitest';
import {
  finishMascotAction,
  INITIAL_MASCOT_ACTIVITY,
  requestMascotAction,
} from './reduce-mascot-activity';

const forward = { kind: 'step', direction: 'forward' } as const;
const backward = { kind: 'step', direction: 'backward' } as const;
const celebrate = { kind: 'celebrate' } as const;

describe('mascot activity reducer', () => {
  it('starts an action right away when the mascot is idle', () => {
    const state = requestMascotAction(INITIAL_MASCOT_ACTIVITY, forward);

    expect(state).toEqual({
      current: { ...forward, id: 1 },
      queued: null,
      lastId: 1,
    });
  });

  it('restarts a running step with a new id', () => {
    const running = requestMascotAction(INITIAL_MASCOT_ACTIVITY, forward);
    const state = requestMascotAction(running, backward);

    expect(state.current).toEqual({ ...backward, id: 2 });
    expect(state.queued).toBeNull();
  });

  it('queues a step requested during a celebration', () => {
    const running = requestMascotAction(INITIAL_MASCOT_ACTIVITY, celebrate);
    const state = requestMascotAction(running, forward);

    expect(state.current).toEqual({ ...celebrate, id: 1 });
    expect(state.queued).toEqual(forward);
  });

  it('queues a celebration requested during a step or a celebration', () => {
    const step = requestMascotAction(INITIAL_MASCOT_ACTIVITY, forward);
    expect(requestMascotAction(step, celebrate).queued).toEqual(celebrate);

    const party = requestMascotAction(INITIAL_MASCOT_ACTIVITY, celebrate);
    expect(requestMascotAction(party, celebrate).queued).toEqual(celebrate);
  });

  it('keeps only the most recent queued request', () => {
    let state = requestMascotAction(INITIAL_MASCOT_ACTIVITY, celebrate);
    state = requestMascotAction(state, forward);
    state = requestMascotAction(state, backward);

    expect(state.queued).toEqual(backward);
  });

  it('keeps the queued celebration when a step restarts', () => {
    let state = requestMascotAction(INITIAL_MASCOT_ACTIVITY, forward);
    state = requestMascotAction(state, celebrate);
    state = requestMascotAction(state, backward);

    expect(state.current).toEqual({ ...backward, id: 2 });
    expect(state.queued).toEqual(celebrate);
  });

  it('runs the queued action when the current one finishes', () => {
    let state = requestMascotAction(INITIAL_MASCOT_ACTIVITY, celebrate);
    state = requestMascotAction(state, forward);
    state = finishMascotAction(state);

    expect(state).toEqual({
      current: { ...forward, id: 2 },
      queued: null,
      lastId: 2,
    });
  });

  it('goes back to idle when nothing is queued', () => {
    const running = requestMascotAction(INITIAL_MASCOT_ACTIVITY, celebrate);

    expect(finishMascotAction(running)).toEqual({
      current: null,
      queued: null,
      lastId: 1,
    });
  });
});
