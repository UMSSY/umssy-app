import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import { proposalDraftStorage } from './proposal-draft-storage';

const { rows, read, write, remove } = vi.hoisted(() => {
  const rows = new Map<string, unknown>();
  return {
    rows,
    read: vi.fn(async (key: string) => rows.get(key)),
    write: vi.fn(async (key: string, value: unknown) => { rows.set(key, value); }),
    remove: vi.fn(async (key: string) => { rows.delete(key); }),
  };
});
vi.mock('@/shared/services/storage/indexed-db-storage', () => ({
  createIndexedDbStorage: (options: { databaseName: string; storeName: string; version: number }) => {
    if (options.databaseName !== 'umssy-workshop-drafts' || options.storeName !== 'drafts' || options.version !== 1) {
      throw new Error('Existing drafts must retain their database and store');
    }
    return { read, write, remove };
  },
}));
const draft = { values: { ...EMPTY_PROPOSAL, title: 'Python' }, file: new File(['image'], 'cover.png', { type: 'image/png' }), operationKey: 'same-operation' };
beforeEach(() => { rows.clear(); vi.clearAllMocks(); });

describe('proposal drafts through shared storage', () => {
  it('restores legacy values, the cover File and the original operation key', async () => {
    rows.set('user-a', draft);
    const restored = await proposalDraftStorage.read('user-a');
    expect(restored).toEqual(draft);
    expect(restored?.file).toBeInstanceOf(File);
  });

  it('isolates drafts by owner and deletes only the confirmed user draft', async () => {
    await proposalDraftStorage.save('user-a', draft);
    await proposalDraftStorage.save('user-b', { ...draft, operationKey: 'other-operation' });
    await proposalDraftStorage.remove('user-a');
    expect(await proposalDraftStorage.read('user-a')).toBeNull();
    expect(await proposalDraftStorage.read('user-b')).toMatchObject({ operationKey: 'other-operation' });
  });

  it('serializes a delayed save before deleting the confirmed draft', async () => {
    let finishSave!: () => void;
    write.mockImplementationOnce(async (key, value) => {
      await new Promise<void>((resolve) => { finishSave = resolve; });
      rows.set(key, value);
    });
    const saving = proposalDraftStorage.save('user-a', draft);
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    const deleting = proposalDraftStorage.remove('user-a');
    expect(remove).not.toHaveBeenCalled();
    finishSave();
    await Promise.all([saving, deleting]);
    expect(await proposalDraftStorage.read('user-a')).toBeNull();
  });

  it('allows saving again after a failed write', async () => {
    write.mockRejectedValueOnce(new Error('Quota exceeded'));
    await expect(proposalDraftStorage.save('user-a', draft)).rejects.toThrow('Quota exceeded');
    await proposalDraftStorage.save('user-a', draft);
    expect(await proposalDraftStorage.read('user-a')).toEqual(draft);
  });

  it.each([null, {}, { values: {}, file: null }, { values: EMPTY_PROPOSAL, file: 'invalid' }])('rejects corrupted draft data: %j', async (value) => {
    rows.set('user-a', value);
    expect(await proposalDraftStorage.read('user-a')).toBeNull();
  });

  it('keeps a valid draft without a cover and normalizes a missing operation key', async () => {
    rows.set('user-a', { values: EMPTY_PROPOSAL, file: null });
    expect(await proposalDraftStorage.read('user-a')).toEqual({ values: EMPTY_PROPOSAL, file: null, operationKey: null });
  });
});
