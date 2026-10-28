import type { MentorExitState } from './mentor-exit-state.types.js';

export type MentorExitDecision = (state: MentorExitState) => boolean;
