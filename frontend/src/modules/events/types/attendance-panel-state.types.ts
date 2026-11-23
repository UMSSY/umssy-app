export type AttendancePanelState =
  | { kind: 'verifying' }
  | { kind: 'registered'; sessionLabel?: string }
  | { kind: 'duplicate'; sessionLabel?: string }
  | { kind: 'invalid'; message?: string }
  | { kind: 'error'; message?: string };
