import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '@/shared/testing/create-query-wrapper';
import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { proposalsService } from '../services/proposals.service';
import { useProposalForm } from './use-proposal-form';
import type { ProposalValues } from '../types/proposal.types';

vi.mock('@/modules/profile', () => ({ profileService: { getProfile: vi.fn().mockResolvedValue({ firstName: 'Ana', lastName: 'López' }) } }));
vi.mock('@/modules/event-categories', () => ({ useEventCategories: () => ({ categories: [{ id: 'cat', name: 'Tecnología' }], isLoading: false, error: null, retry: vi.fn() }) }));
vi.mock('../services/proposals.service', () => ({ proposalsService: { create: vi.fn() } }));
const resultData = { id: 'id', status: 'voting' as const, coverUrl: '/cover.png', supportThreshold: 15, votingDeadline: '2026-11-01T16:00:00Z' };
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-24T12:00:00Z')); vi.clearAllMocks(); saveAccessToken('session'); URL.revokeObjectURL = vi.fn(); });
afterEach(() => { cleanup(); clearAccessToken(); vi.useRealTimers(); });

async function setup() {
  const hook = renderHook(useProposalForm, { wrapper: createQueryWrapper().wrapper });
  await waitFor(() => expect(hook.result.current.tutor).toBe('Ana López'));
  const fields: ProposalValues = { title: 'Python', description: 'Taller práctico', categoryId: 'cat', eventDate: '2026-11-12', startTime: '09:00', endTime: '12:00', capacity: '30', modality: 'presencial', location: 'Aula 1' };
  act(() => {
    for (const key of Object.keys(fields) as (keyof ProposalValues)[]) hook.result.current.change(key, fields[key]);
    hook.result.current.changeCover({ file: new File(['image'], 'cover.png', { type: 'image/png' }), previewUrl: 'blob:cover' });
  });
  return hook;
}

describe('Proposal review and submission', () => {
  it('reviews and cancels without sending or losing the draft', async () => {
    const hook = await setup();
    act(() => { expect(hook.result.current.review()).toBe(true); });
    expect(hook.result.current.reviewing).toBe(true);
    expect(proposalsService.create).not.toHaveBeenCalled();
    act(() => hook.result.current.closeReview());
    expect(hook.result.current.values.title).toBe('Python');
    expect(hook.result.current.cover?.file.name).toBe('cover.png');
  });
  it('keeps the draft and same operation key after an uncertain failure', async () => {
    const hook = await setup();
    vi.mocked(proposalsService.create).mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(resultData);
    await act(async () => { await hook.result.current.confirm(); });
    expect(hook.result.current.created).toBeNull();
    expect(hook.result.current.values.title).toBe('Python');
    expect(hook.result.current.cover).not.toBeNull();
    await act(async () => { await hook.result.current.confirm(); });
    expect(vi.mocked(proposalsService.create).mock.calls[0][2]).toBe(vi.mocked(proposalsService.create).mock.calls[1][2]);
    expect(hook.result.current.created).toEqual(resultData);
    expect(hook.result.current.values.title).toBe('');
    expect(hook.result.current.cover).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cover');
  });
  it('prevents rapid duplicate confirmations', async () => {
    const hook = await setup();
    let resolve!: (value: typeof resultData) => void;
    vi.mocked(proposalsService.create).mockReturnValue(new Promise((done) => { resolve = done; }));
    let first!: Promise<void>;
    act(() => { first = hook.result.current.confirm(); void hook.result.current.confirm(); });
    await waitFor(() => expect(proposalsService.create).toHaveBeenCalledTimes(1));
    expect(hook.result.current.pending).toBe(true);
    await act(async () => { resolve(resultData); await first; });
  });
  it('shows mutation field errors and keeps entered data when validation fails', async () => {
    const hook = await setup();
    act(() => { hook.result.current.review(); });
    vi.mocked(proposalsService.create).mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { code: 'VALIDATION_ERROR', errors: [{ field: 'categoryId', message: 'Categoría no disponible' }] } },
    });
    await act(async () => { await hook.result.current.confirm(); });
    await waitFor(() => expect(hook.result.current.errors.categoryId).toBe('Categoría no disponible'));
    expect(hook.result.current.reviewing).toBe(false);
    expect(hook.result.current.values.title).toBe('Python');
    expect(hook.result.current.cover).not.toBeNull();
    act(() => { hook.result.current.change('categoryId', 'cat'); });
    expect(hook.result.current.errors.categoryId).toBeUndefined();
  });
  it('cannot review a draft without its required cover', async () => {
    const hook = await setup();
    act(() => hook.result.current.changeCover(null));
    act(() => { expect(hook.result.current.review()).toBe(false); });
    expect(hook.result.current.errors.cover).toBeTruthy();
  });
  it('clears physical location when switching to virtual', async () => {
    const hook = await setup();
    act(() => hook.result.current.change('modality', 'virtual'));
    expect(hook.result.current.values.location).toBe('');
  });
});
