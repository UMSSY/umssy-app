import { createIndexedDbStorage } from '@/shared/services/storage/indexed-db-storage';
import { PROFILE_COMPLETENESS_SECTION_IDS } from '../constants/profile-completeness.constants';
import type { ProfileGuideSession } from '../types/profile-guide-session.types';

const storage = createIndexedDbStorage({
  databaseName: 'umssy-profile-guide',
  storeName: 'sessions',
});

export function createProfileGuideSession(): ProfileGuideSession {
  return {
    version: 1,
    dismissed: false,
    completed: false,
    lastStep: null,
    skipped: [],
  };
}

export const profileGuideStorage = {
  async read(userId: string): Promise<ProfileGuideSession> {
    const value = (await storage.read(userId)) as
      Partial<ProfileGuideSession> | undefined;
    if (!value || value.version !== 1) return createProfileGuideSession();
    return {
      version: 1,
      dismissed: value.dismissed === true,
      completed: value.completed === true,
      lastStep:
        PROFILE_COMPLETENESS_SECTION_IDS.find((id) => id === value.lastStep) ??
        null,
      skipped: PROFILE_COMPLETENESS_SECTION_IDS.filter(
        (id) => Array.isArray(value.skipped) && value.skipped.includes(id),
      ),
    };
  },
  write(userId: string, session: ProfileGuideSession) {
    return storage.write(userId, session);
  },
};
