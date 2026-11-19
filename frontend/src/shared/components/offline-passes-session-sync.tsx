'use client';

import { useEffect } from 'react';
import {
  getAccessToken,
  isAccessTokenReady,
  subscribeAccessToken,
} from '@/shared/services/storage/access-token-storage';
import { syncOfflinePassesSession } from '@/shared/services/storage/offline-passes-session-sync';

export function OfflinePassesSessionSync() {
  useEffect(() => {
    let previous = isAccessTokenReady() ? getAccessToken() : null;
    return subscribeAccessToken(() => {
      if (!isAccessTokenReady()) return;
      const current = getAccessToken();
      const last = previous;
      previous = current;
      void syncOfflinePassesSession(last, current).catch(() => undefined);
    });
  }, []);
  return null;
}
