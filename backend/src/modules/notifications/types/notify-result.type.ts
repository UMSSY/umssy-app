export type NotifyResult = {
  inAppCount: number;
  pushStatus: 'sent' | 'partial' | 'failed' | 'skipped';
  emailStatus: 'sent' | 'partial' | 'failed' | 'skipped';
};