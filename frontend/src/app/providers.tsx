"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/shared/contexts/auth-context";
import { createQueryClient } from "@/shared/services/query-client";
import { getAccessToken, subscribeAccessToken } from "@/shared/services/storage/access-token-storage";
import { SocketProvider } from "@/modules/chat/contexts/socket-context";

function SessionProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  useEffect(() => () => queryClient.clear(), [queryClient]);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>{children}</SocketProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

const getServerToken = () => null;

export function Providers({ children }: { children: ReactNode }) {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, getServerToken);
  // El cambio de identidad reinicia las vistas privadas y su caché. Las respuestas
  // tardías de la sesión anterior solo afectan al cliente de consultas descartado.
  return <SessionProviders key={token ?? 'anonymous'}>{children}</SessionProviders>;
}
