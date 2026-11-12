import { createIndexedDbStorage } from '@/shared/services/storage/indexed-db-storage';
import type { ProposalDraft } from '../types/proposal-draft.types';
export type { ProposalDraft } from '../types/proposal-draft.types';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import type { ProposalValues } from '../types/proposal.types';

const storage = createIndexedDbStorage({ databaseName: 'umssy-workshop-drafts', storeName: 'drafts', version: 1 });

// Serialize writes so a delayed save cannot recreate a draft after confirmation.
let writes = Promise.resolve();
export const proposalDraftStorage = {
  async read(userId: string): Promise<ProposalDraft | null> {
    await writes.catch(() => undefined);
    const value = await storage.read(userId) as ProposalDraft | undefined;
    if (!value || !value.values || Object.keys(EMPTY_PROPOSAL).some((key) => typeof value.values[key as keyof ProposalValues] !== 'string')) return null;
    if (value.file !== null && !(value.file instanceof File)) return null;
    const locations = value.locations && typeof value.locations.presencial === 'string' && typeof value.locations.virtual === 'string' ? value.locations : undefined;
    return { ...(locations ? { locations } : {}), values: value.values, file: value.file, operationKey: typeof value.operationKey === 'string' ? value.operationKey : null };
  },
  save(userId: string, draft: ProposalDraft) {
    writes = writes.catch(() => undefined).then(async () => { await storage.write(userId, draft); });
    return writes;
  },
  remove(userId: string) {
    writes = writes.catch(() => undefined).then(async () => { await storage.remove(userId); });
    return writes;
  },
};
