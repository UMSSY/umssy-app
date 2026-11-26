import type { PushEnvironment } from './push-environment.types';

export interface ActivateResult {
  ok: boolean;
  reason?:
    | PushEnvironment
    | 'permission-blocked'
    | 'permission-dismissed'
    | 'service-worker-unavailable'
    | 'network-error'
    | 'unknown';
}
