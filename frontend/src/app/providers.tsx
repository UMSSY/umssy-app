"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/shared/contexts/auth-context";
import { createQueryClient } from "@/shared/services/query-client";
import { SocketProvider } from '@/modules/chat/contexts/socket-context';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
