export interface AttendanceCheckInOutcome {
  result: 'registered' | 'duplicate';
  sessionId: string | null;
}
