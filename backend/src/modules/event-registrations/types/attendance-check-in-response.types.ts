export type AttendanceCheckInResponse =
  | { result: 'registered'; checkedInAt: string }
  | { result: 'duplicate'; checkedInAt: string };
