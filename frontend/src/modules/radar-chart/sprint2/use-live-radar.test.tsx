import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { radarIntegrationApi, type IntegrationRadar } from '../sprint2-integration/radar-integration-api';
import { useLiveRadar } from './use-live-radar';

vi.mock('@/shared/services/storage/access-token-storage', () => ({ getAccessToken: vi.fn() }));
vi.mock('../sprint2-integration/radar-integration-api', () => ({ radarIntegrationApi: { me: vi.fn(), recalculate: vi.fn() } }));

const stored: IntegrationRadar = {
  userId: 'owner', status: 'published', version: 2, sourceRevision: 3, inputRevision: 4,
  processingStatus: 'pending', rubricVersion: 'rubric-from-server', updatedAt: '2026-10-26T12:00:00Z',
  scores: { desarrollo: 0, 'cloud-devops': 0, 'data-ai': 1.5, qa: 0, ciberseguridad: 0, 'gobernanza-ti': 0 },
  average: 0.25, variation: 0.1, pending: 1, hasPending: true,
  evidence: { 'data-ai': [{ id: 'python', name: 'Python' }] },
  skills: [{ id: 'python', name: 'Python', areaId: 'data-ai', isHighRelevance: true, evidenceRefs: [{ type: 'work-experience', id: 'old-source' }] }],
};

beforeEach(() => {
  vi.mocked(getAccessToken).mockReturnValue('session-a');
  vi.mocked(radarIntegrationApi.me).mockResolvedValue(stored);
  vi.mocked(radarIntegrationApi.recalculate).mockResolvedValue(stored);
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe('useLiveRadar', () => {
  it('keeps scores and evidence from the same published revision while NLP is newer', async () => {
    const { result } = renderHook(useLiveRadar);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toMatchObject({ version: 2, status: 'pending', rubric: 'rubric-from-server', average: 0.25 });
    expect(result.current.data?.approved[0].evidenceRefs).toEqual([{ type: 'work-experience', id: 'old-source' }]);
    expect(result.current.data?.areas.find(area => area.id === 'data-ai')?.score).toBe(1.5);
  });

  it('keeps the last publication and actually processes a retry after a failure', async () => {
    vi.mocked(radarIntegrationApi.me).mockResolvedValue({ ...stored, processingStatus: 'error' });
    const { result } = renderHook(useLiveRadar);
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data?.version).toBe(2);
    vi.mocked(radarIntegrationApi.me).mockResolvedValue({ ...stored, processingStatus: 'ready', hasPending: false });
    await act(async () => { await result.current.retry(); });
    expect(radarIntegrationApi.recalculate).toHaveBeenCalledOnce();
    expect(result.current.error).toBeNull();
    expect(result.current.data?.status).toBe('ready');
  });

  it('does not replace a newer publication with a late older version', async () => {
    const { result } = renderHook(useLiveRadar);
    await waitFor(() => expect(result.current.data?.version).toBe(2));
    vi.mocked(radarIntegrationApi.me).mockResolvedValue({ ...stored, version: 1, skills: [] });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.data?.version).toBe(2);
    expect(result.current.data?.approved[0].id).toBe('python');
  });

  it('discards a response received after the session has changed', async () => {
    let resolve!: (value: IntegrationRadar) => void;
    vi.mocked(radarIntegrationApi.me).mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const { result } = renderHook(useLiveRadar);
    await waitFor(() => expect(radarIntegrationApi.me).toHaveBeenCalledOnce());
    vi.mocked(getAccessToken).mockReturnValue('session-b');
    await act(async () => { resolve(stored); await Promise.resolve(); });
    expect(result.current.data).toBeNull();
  });
});
