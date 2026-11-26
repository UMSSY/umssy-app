import { BEARER_PREFIX } from '@/shared/constants/auth.constants';
import { apiClient } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { hasCookieSession } from '@/shared/services/storage/cookie-session-state';
import { REQUEST_TIMEOUT_MS } from '../constants/events.constants';
import { AttendanceSessionRequiredError } from '../utils/attendance-session-required.error';
import type { AttendanceCheckInOutcome } from '../types/attendance-check-in-outcome.types';

export type AttendanceCheckInResult = AttendanceCheckInOutcome['result'];

export const attendanceCheckInService = {
  async checkIn(
    eventId: string,
    reference: string,
    signal?: AbortSignal,
    accessToken: string | null = getAccessToken(),
    sessionId?: string,
  ): Promise<AttendanceCheckInOutcome> {
    if (!accessToken && !hasCookieSession()) throw new AttendanceSessionRequiredError();
    if (!apiClient.defaults.baseURL)
      throw new Error('Attendance API unavailable');

    const response = await apiClient.post<unknown>(
      `/events/${encodeURIComponent(eventId)}/attendances/check-ins`,
      sessionId ? { reference, sessionId } : { reference },
      {
        ...(accessToken ? { headers: { Authorization: `${BEARER_PREFIX}${accessToken}` } } : {}),
        signal,
        timeout: REQUEST_TIMEOUT_MS,
      },
    );
    const body = response.data;
    if (
      !body ||
      typeof body !== 'object' ||
      !('data' in body) ||
      !('statusCode' in body) ||
      body.statusCode !== response.status ||
      !('ok' in body) ||
      body.ok !== true
    )
      throw new Error('Invalid attendance response');
    const data = body.data;
    if (
      !data ||
      typeof data !== 'object' ||
      !('result' in data) ||
      !('checkedInAt' in data) ||
      typeof data.checkedInAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.checkedInAt) ||
      !Number.isFinite(Date.parse(data.checkedInAt))
    )
      throw new Error('Invalid attendance response');
    const registeredSessionId =
      'sessionId' in data && typeof data.sessionId === 'string' ? data.sessionId : null;
    if (response.status === 201 && data.result === 'registered')
      return { result: 'registered', sessionId: registeredSessionId };
    if (response.status === 200 && data.result === 'duplicate')
      return { result: 'duplicate', sessionId: registeredSessionId };
    throw new Error('Invalid attendance response');
  },
};
