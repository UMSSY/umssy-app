"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/shared/contexts/auth-context";
import { createQueryClient } from "@/shared/services/query-client";
import { getAccessToken, subscribeAccessToken } from "@/shared/services/storage/access-token-storage";
import { SocketProvider } from "@/modules/chat/contexts/socket-context";
import { MentorProfileDraftProvider } from "@/modules/mentorship";
import { AppVisibilityReporter } from "@/modules/notifications";

function SessionProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  useEffect(() => () => queryClient.clear(), [queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
          <AppVisibilityReporter />
        <SocketProvider>
          <MentorProfileDraftProvider>{children}</MentorProfileDraftProvider>
        </SocketProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

const getServerToken = () => null;

export function Providers({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  return <SessionProviders key={token ?? 'anonymous'}>{children}</SessionProviders>;
}
