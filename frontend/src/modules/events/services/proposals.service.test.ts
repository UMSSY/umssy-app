import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import { proposalsService } from './proposals.service';

vi.mock('@/shared/services/api-client', () => ({ apiClient: { post: vi.fn() } }));
const response = { id: 'proposal-1', status: 'voting', supportThreshold: 15, votingDeadline: '2026-11-01T16:00:00Z', coverUrl: '/api/event-proposals/proposal-1/cover' };
const image = new File(['png'], 'cover.png', { type: 'image/png' });
beforeEach(() => vi.clearAllMocks());
describe('Proposal creation contract', () => {
  it('sends multipart cover and local times, excluding trusted server fields', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: response } });
    expect(await proposalsService.create({ ...EMPTY_PROPOSAL, title: ' Python ', startTime: '15:30' }, image, 'operation-1')).toEqual(response);
    const [, data, options] = vi.mocked(apiClient.post).mock.calls[0];
    const payload = data as FormData;
    expect(payload.get('title')).toBe('Python');
    expect(payload.get('startTime')).toBe('15:30');
    expect(payload.get('cover')).toBe(image);
    for (const key of ['createdById', 'instructorName', 'supportThreshold', 'status']) expect(payload.has(key)).toBe(false);
    expect(options?.headers).toEqual({ 'Idempotency-Key': 'operation-1' });
  });
  it('sends the captured session explicitly for proposal mutations', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data: response } });
    await proposalsService.create(EMPTY_PROPOSAL, image, 'operation-1', 'session-a');
    expect(vi.mocked(apiClient.post).mock.calls[0][2]?.headers).toEqual({
      'Idempotency-Key': 'operation-1', Authorization: 'Bearer session-a',
    });
  });
  it.each([{ ...response, id: '' }, { ...response, status: 'published' }, { ...response, coverUrl: '' }, { ...response, votingDeadline: 'invalid' }])('never acknowledges an incomplete response', async (data) => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { data } });
    await expect(proposalsService.create(EMPTY_PROPOSAL, image, 'operation-1')).rejects.toThrow();
  });
});
