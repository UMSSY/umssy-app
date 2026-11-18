export type AttendancePanelState =
  | { kind: 'verifying' }
  | { kind: 'registered' }
  | { kind: 'duplicate' }
  | { kind: 'invalid'; message?: string }
  | { kind: 'error'; message?: string };
