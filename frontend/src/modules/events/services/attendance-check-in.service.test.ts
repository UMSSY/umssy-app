import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { attendanceCheckInService } from './attendance-check-in.service';
import { AttendanceSessionRequiredError } from '../utils/attendance-session-required.error';

vi.mock('@/shared/services/api-client', () => ({
  apiClient: { defaults: { baseURL: 'http://localhost/api' }, post: vi.fn() },
}));
vi.mock('@/shared/services/storage/access-token-storage', () => ({
  getAccessToken: vi.fn(),
}));

const EVENT_ID = '914f52b0-47f0-49b0-925a-d6783861693a';
const REFERENCE = 'a'.repeat(64);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAccessToken).mockReturnValue('session-token');
  apiClient.defaults.baseURL = 'http://localhost/api';
});

describe('attendanceCheckInService', () => {
  it.each([
    [201, 'registered'],
    [200, 'duplicate'],
  ] as const)(
    'posts only the reference and accepts %i %s',
    async (status, result) => {
      const signal = new AbortController().signal;
      vi.mocked(apiClient.post).mockResolvedValue({
        status,
        data: {
          statusCode: status,
          ok: true,
          data: { result, checkedInAt: '2026-11-16T14:00:00.000Z' },
        },
      });
      await expect(
        attendanceCheckInService.checkIn(EVENT_ID, REFERENCE, signal),
      ).resolves.toEqual({ result, sessionId: null });
      expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
        `/events/${EVENT_ID}/attendances/check-ins`,
        { reference: REFERENCE },
        expect.objectContaining({
          headers: { Authorization: 'Bearer session-token' },
          signal,
        }),
      );
    },
  );

  it('requires a session and a configured API before sending a pass', async () => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    await expect(
      attendanceCheckInService.checkIn(EVENT_ID, REFERENCE),
    ).rejects.toBeInstanceOf(AttendanceSessionRequiredError);
    expect(apiClient.post).not.toHaveBeenCalled();
    vi.mocked(getAccessToken).mockReturnValue('session-token');
    apiClient.defaults.baseURL = undefined;
    await expect(
      attendanceCheckInService.checkIn(EVENT_ID, REFERENCE),
    ).rejects.toThrow();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects a success response with the wrong HTTP status or payload', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      status: 200,
      data: {
        statusCode: 200,
        ok: true,
        data: { result: 'registered', checkedInAt: '2026-11-16T14:00:00.000Z' },
      },
    });
    await expect(
      attendanceCheckInService.checkIn(EVENT_ID, REFERENCE),
    ).rejects.toThrow('Invalid attendance response');
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      status: 201,
      data: {
        statusCode: 201,
        ok: true,
        data: { result: 'other', checkedInAt: '2026-11-16T14:00:00.000Z' },
      },
    });
    await expect(
      attendanceCheckInService.checkIn(EVENT_ID, REFERENCE),
    ).rejects.toThrow('Invalid attendance response');
    for (const body of [
      {
        statusCode: 200,
        ok: true,
        data: { result: 'registered', checkedInAt: '2026-11-16T14:00:00.000Z' },
      },
      {
        statusCode: 201,
        ok: false,
        data: { result: 'registered', checkedInAt: '2026-11-16T14:00:00.000Z' },
      },
      { statusCode: 201, ok: true, data: { result: 'registered' } },
      {
        statusCode: 201,
        ok: true,
        data: { result: 'registered', checkedInAt: 'not-a-date' },
      },
    ]) {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        status: 201,
        data: body,
      });
      await expect(
        attendanceCheckInService.checkIn(EVENT_ID, REFERENCE),
      ).rejects.toThrow('Invalid attendance response');
    }
  });

  it('sends the selected session and returns the registered session', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      status: 201,
      data: {
        statusCode: 201,
        ok: true,
        data: { result: 'registered', checkedInAt: '2026-11-16T14:00:00.000Z', sessionId: 'session-2' },
      },
    });
    await expect(
      attendanceCheckInService.checkIn(EVENT_ID, REFERENCE, undefined, undefined, 'session-2'),
    ).resolves.toEqual({ result: 'registered', sessionId: 'session-2' });
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith(
      `/events/${EVENT_ID}/attendances/check-ins`,
      { reference: REFERENCE, sessionId: 'session-2' },
      expect.any(Object),
    );
  });
});
