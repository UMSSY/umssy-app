import type { ProposalDraft } from '../types/proposal-draft.types';
export type { ProposalDraft } from '../types/proposal-draft.types';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import type { ProposalValues } from '../types/proposal.types';


function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('umssy-workshop-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function access(userId: string, mode: 'read' | 'write' | 'delete', draft?: ProposalDraft): Promise<unknown> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('drafts', mode === 'read' ? 'readonly' : 'readwrite');
      const store = transaction.objectStore('drafts');
      const request = mode === 'read' ? store.get(userId) : mode === 'delete' ? store.delete(userId) : store.put(draft, userId);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}

// Serialize writes so a delayed save cannot recreate a draft after confirmation.
let writes = Promise.resolve();
export const proposalDraftStorage = {
  async read(userId: string): Promise<ProposalDraft | null> {
    await writes.catch(() => undefined);
    const value = await access(userId, 'read') as ProposalDraft | undefined;
    if (!value || !value.values || Object.keys(EMPTY_PROPOSAL).some((key) => typeof value.values[key as keyof ProposalValues] !== 'string')) return null;
    if (value.file !== null && !(value.file instanceof File)) return null;
    return { values: value.values, file: value.file, operationKey: typeof value.operationKey === 'string' ? value.operationKey : null };
  },
  save(userId: string, draft: ProposalDraft) {
    writes = writes.catch(() => undefined).then(async () => { await access(userId, 'write', draft); });
    return writes;
  },
  remove(userId: string) {
    writes = writes.catch(() => undefined).then(async () => { await access(userId, 'delete'); });
    return writes;
  },
};
