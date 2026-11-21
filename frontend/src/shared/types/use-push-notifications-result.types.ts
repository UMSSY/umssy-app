import type { PushEnvironment } from './push-environment.types';
import type { PushPermissionState } from './push-permission-state.types';
import type { ActivateResult } from './activate-result.types';

export interface UsePushNotificationsResult {
  environment: PushEnvironment;
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  activate: () => Promise<ActivateResult>;
  deactivate: () => Promise<void>;
}
