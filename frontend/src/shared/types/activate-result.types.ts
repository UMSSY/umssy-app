import type { PushEnvironment } from './push-environment.types';

export interface ActivateResult {
  ok: boolean;
  reason?: PushEnvironment | 'permission-denied' | 'network-error' | 'unknown';
}
