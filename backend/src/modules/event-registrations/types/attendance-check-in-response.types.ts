export type AttendanceCheckInResponse =
  | { result: 'registered'; checkedInAt: string; sessionId: string | null }
  | { result: 'duplicate'; checkedInAt: string; sessionId: string | null };
