'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/shared/contexts/auth-context';
import { createQueryClient } from '@/shared/services/query-client';
import {
  getAccessToken,
  subscribeAccessToken,
} from '@/shared/services/storage/access-token-storage';
import {
  getCookieSessionSubject,
  hasCookieSession,
  subscribeCookieSession,
} from '@/shared/services/storage/cookie-session-state';
import { hasSessionMarker } from '@/shared/utils/session-marker';
import { OfflinePassesSessionSync } from '@/shared/components/offline-passes-session-sync';
import { PwaInstallProvider } from '@/shared/contexts/pwa-install-context';
import { SocketProvider } from '@/modules/chat/contexts/socket-context';
import { OfflineNavigation } from '@/shared/components/offline-navigation';
import { MentorProfileDraftProvider } from '@/modules/mentorship';

import { AppVisibilityReporter, PushSubscriptionSync } from '@/modules/notifications';

function SessionProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  useEffect(() => () => queryClient.clear(), [queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppVisibilityReporter />
        <PushSubscriptionSync />
        <SocketProvider>
          <OfflineNavigation />
          <MentorProfileDraftProvider>{children}</MentorProfileDraftProvider>
        </SocketProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

const getServerNull = () => null;
const getServerFalse = () => false;

export function Providers({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(
    subscribeAccessToken,
    getAccessToken,
    getServerNull,
  );
  const subject = useSyncExternalStore(
    subscribeCookieSession,
    getCookieSessionSubject,
    getServerNull,
  );
  const cookieSession = useSyncExternalStore(
    subscribeCookieSession,
    hasCookieSession,
    getServerFalse,
  );
  const hasMarker = useSyncExternalStore(
    subscribeAccessToken,
    hasSessionMarker,
    getServerFalse,
  );

  const sessionKey = token
    ? (subject ?? token)
    : cookieSession || hasMarker
      ? (subject ?? 'cookie-session')
      : 'anonymous';

  return (
    <PwaInstallProvider>
      <OfflinePassesSessionSync />
      <SessionProviders key={sessionKey}>{children}</SessionProviders>
    </PwaInstallProvider>
  );
}
