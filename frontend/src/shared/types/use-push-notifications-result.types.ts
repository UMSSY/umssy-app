import type { PushEnvironment } from './push-environment.types';
import type { PushPermissionState } from './push-permission-state.types';
import type { ActivateResult } from './activate-result.types';
import type { PushSyncSession } from './push-sync-session.types';

export interface UsePushNotificationsResult {
  environment: PushEnvironment;
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  activate: () => Promise<ActivateResult>;
  sync: (session: PushSyncSession) => Promise<boolean>;
  deactivate: () => Promise<void>;
}
