import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryWrapper } from '@/shared/testing/create-query-wrapper';
import { saveAccessToken, clearAccessToken } from '@/shared/services/storage/access-token-storage';
import { proposalsService } from '../services/proposals.service';
import { useProposalForm } from './use-proposal-form';
import { proposalDraftStorage } from '../services/proposal-draft-storage';
import type { ProposalDraft } from '../types/proposal-draft.types';
import type { ProposalValues } from '../types/proposal.types';

vi.mock('@/modules/profile', () => ({ profileService: { getProfile: vi.fn().mockResolvedValue({ id: 'user-a', firstName: 'Ana', lastName: 'López' }) } }));
vi.mock('@/modules/event-categories', () => ({ useEventCategories: () => ({ categories: [{ id: 'cat', name: 'Tecnología' }], isLoading: false, error: null, retry: vi.fn() }) }));
vi.mock('../services/proposals.service', () => ({ proposalsService: { create: vi.fn() } }));
const { drafts } = vi.hoisted(() => ({ drafts: new Map<string, ProposalDraft>() }));
vi.mock('../services/proposal-draft-storage', () => ({
  proposalDraftStorage: {
    read: vi.fn(async (owner: string) => drafts.get(owner) ?? null),
    save: vi.fn(async (owner: string, draft: ProposalDraft) => { drafts.set(owner, draft); }),
    remove: vi.fn(async (owner: string) => { drafts.delete(owner); }),
  },
}));
vi.mock('../utils/read-proposal-cover', () => ({ readProposalCover: vi.fn(async (file: File) => ({ file, previewUrl: 'blob:restored' })) }));
const resultData = { id: 'id', status: 'voting' as const, coverUrl: '/cover.png', supportThreshold: 15, votingDeadline: '2026-11-01T16:00:00Z' };
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-24T12:00:00Z')); vi.clearAllMocks(); drafts.clear(); saveAccessToken('session'); URL.revokeObjectURL = vi.fn(); });
afterEach(() => { cleanup(); clearAccessToken(); vi.useRealTimers(); });

async function setup() {
  const hook = renderHook(useProposalForm, { wrapper: createQueryWrapper().wrapper });
  await waitFor(() => { expect(hook.result.current.tutor).toBe('Ana López'); expect(hook.result.current.restoring).toBe(false); });
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

describe('Validation timing and draft lifecycle', () => {
  it('does not mark empty fields or the file picker before review', async () => {
    const hook = await setup();
    act(() => {
      hook.result.current.change('title', '');
      hook.result.current.touch('title');
      hook.result.current.changeCover(null);
      hook.result.current.touch('cover');
    });
    expect(hook.result.current.errors.title).toBeUndefined();
    expect(hook.result.current.errors.cover).toBeUndefined();
    act(() => { hook.result.current.review(); });
    expect(hook.result.current.errors.title).toBeTruthy();
    expect(hook.result.current.errors.cover).toBeTruthy();
  });
  it('validates entered content on blur and updates the error when corrected', async () => {
    const hook = await setup();
    act(() => hook.result.current.change('title', '123'));
    expect(hook.result.current.errors.title).toBeUndefined();
    act(() => hook.result.current.touch('title'));
    expect(hook.result.current.errors.title).toBe('Incluye palabras en el título.');
    act(() => hook.result.current.change('title', 'Python'));
    expect(hook.result.current.errors.title).toBeUndefined();
  });
  it('restores an unfinished draft on remount, then removes it after confirmation', async () => {
    const hook = await setup();
    await waitFor(() => expect(drafts.get('user-a')?.values.title).toBe('Python'));
    hook.unmount();
    const restored = renderHook(useProposalForm, { wrapper: createQueryWrapper().wrapper });
    await waitFor(() => expect(restored.result.current.values.title).toBe('Python'));
    expect(restored.result.current.cover?.file.name).toBe('cover.png');
    vi.mocked(proposalsService.create).mockResolvedValueOnce(resultData);
    await act(async () => { await restored.result.current.confirm(); });
    expect(drafts.has('user-a')).toBe(false);
    expect(restored.result.current.values.title).toBe('');
    restored.unmount();
    const fresh = renderHook(useProposalForm, { wrapper: createQueryWrapper().wrapper });
    await waitFor(() => { expect(fresh.result.current.tutor).toBe('Ana López'); expect(fresh.result.current.restoring).toBe(false); });
    expect(fresh.result.current.values.title).toBe('');
    expect(fresh.result.current.cover).toBeNull();
    expect(drafts.has('user-a')).toBe(false);
  });
  it('does not save again while confirmed draft deletion is pending', async () => {
    const hook = await setup();
    let finish!: () => void;
    vi.mocked(proposalDraftStorage.remove).mockImplementationOnce(async owner => {
      await new Promise<void>(resolve => { finish = resolve; });
      drafts.delete(owner);
    });
    vi.mocked(proposalsService.create).mockResolvedValueOnce(resultData);
    let confirming!: Promise<void>;
    act(() => { confirming = hook.result.current.confirm(); });
    await waitFor(() => expect(finish).toBeDefined());
    const saves = vi.mocked(proposalDraftStorage.save).mock.calls.length;
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(proposalDraftStorage.save).toHaveBeenCalledTimes(saves);
    await act(async () => { finish(); await confirming; });
    expect(drafts.has('user-a')).toBe(false);
  });
});

it('keeps both locations across navigation and sends only the active one', async () => {
  const hook = await setup();
  act(() => hook.result.current.change('modality', 'virtual'));
  act(() => hook.result.current.change('location', 'https://meet.example.org/room'));
  act(() => hook.result.current.change('modality', 'presencial'));
  expect(hook.result.current.values.location).toBe('Aula 1');
  await waitFor(() => expect(drafts.get('user-a')?.locations?.virtual).toBe('https://meet.example.org/room'));
  hook.unmount();
  const restored = renderHook(useProposalForm, { wrapper: createQueryWrapper().wrapper });
  await waitFor(() => expect(restored.result.current.values.location).toBe('Aula 1'));
  act(() => restored.result.current.change('modality', 'virtual'));
  expect(restored.result.current.values.location).toBe('https://meet.example.org/room');
  act(() => { expect(restored.result.current.review()).toBe(true); });
  vi.mocked(proposalsService.create).mockResolvedValueOnce(resultData);
  await act(async () => { await restored.result.current.confirm(); });
  const payload = vi.mocked(proposalsService.create).mock.calls.at(-1)![0];
  expect(payload).toMatchObject({ modality: 'virtual', location: 'https://meet.example.org/room' });
  expect(payload).not.toHaveProperty('locations');
  expect(drafts.has('user-a')).toBe(false);
});
