import type { StartedSession } from './started-session.types.js';

export interface RotatedSession extends StartedSession {
  roleTag: string;
  roles: string[];
}
