import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '@/shared/testing/create-query-wrapper';
import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { proposalsService } from '../services/proposals.service';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import { useCreateProposal } from './use-create-proposal';

vi.mock('../services/proposals.service', () => ({ proposalsService: { create: vi.fn() } }));
const response = { id: 'proposal', status: 'voting' as const, coverUrl: '/cover', supportThreshold: 15, votingDeadline: '2026-11-01T16:00:00Z' };
const variables = { values: { ...EMPTY_PROPOSAL }, cover: new File(['image'], 'cover.png'), operationKey: 'operation', accessToken: 'session-a' };
beforeEach(() => { vi.clearAllMocks(); saveAccessToken('session-a'); });
afterEach(() => { cleanup(); clearAccessToken(); });

describe('proposal creation mutation', () => {
  it('invalidates proposal and catalog queries only after confirmed success', async () => {
    vi.mocked(proposalsService.create).mockResolvedValue(response);
    const { wrapper, client } = createQueryWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateProposal('session-a'), { wrapper });
    await act(async () => { await result.current.mutateAsync(variables); });
    expect(proposalsService.create).toHaveBeenCalledWith(variables.values, variables.cover, 'operation', 'session-a');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['event-proposals'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['events'] });
  });

  it('does not retry uncertain failures automatically', async () => {
    vi.mocked(proposalsService.create).mockRejectedValue(new Error('timeout'));
    const { wrapper, client } = createQueryWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateProposal('session-a'), { wrapper });
    await act(async () => { await expect(result.current.mutateAsync(variables)).rejects.toThrow('timeout'); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(proposalsService.create).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('rejects an operation captured from a previous session before sending', async () => {
    const { result } = renderHook(() => useCreateProposal('session-a'), { wrapper: createQueryWrapper().wrapper });
    saveAccessToken('session-b');
    await act(async () => { await expect(result.current.mutateAsync(variables)).rejects.toThrow('La sesión cambió'); });
    expect(proposalsService.create).not.toHaveBeenCalled();
  });

  it('does not invalidate another user queries when an old session request completes', async () => {
    let resolve!: (data: typeof response) => void;
    vi.mocked(proposalsService.create).mockReturnValue(new Promise((done) => { resolve = done; }));
    const { wrapper, client } = createQueryWrapper();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateProposal('session-a'), { wrapper });
    let pending!: Promise<typeof response>;
    act(() => { pending = result.current.mutateAsync(variables); });
    await waitFor(() => expect(proposalsService.create).toHaveBeenCalledTimes(1));
    saveAccessToken('session-b');
    await act(async () => { resolve(response); await pending; });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
