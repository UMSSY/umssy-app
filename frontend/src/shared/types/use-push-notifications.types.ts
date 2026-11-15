export type PushEnvironment =
  | 'supported'
  | 'desktop'
  | 'ios-old'
  | 'ios-not-installed'
  | 'unsupported';

export type PushPermissionState = 'default' | 'granted' | 'denied';

export interface ActivateResult {
  ok: boolean;
  reason?: PushEnvironment | 'permission-denied' | 'network-error' | 'unknown';
}

export interface UsePushNotificationsResult {
  environment: PushEnvironment;
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  activate: () => Promise<ActivateResult>;
  deactivate: () => Promise<void>;
}