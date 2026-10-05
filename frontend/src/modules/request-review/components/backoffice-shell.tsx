"use client";

import type { ReactNode } from "react";
import { AppShell, RoleGate } from "@/shared/components/layout";
import { BACKOFFICE_NAVIGATION } from "../config/backoffice-navigation.config";
import { useBackofficeSession } from "../hooks/use-backoffice-session";

const ALLOWED_ROLES = ["administrativo"] as const;

interface BackofficeShellProps {
  children: ReactNode;
}

export function BackofficeShell({ children }: BackofficeShellProps) {
  const { roleTag, isLoading, user } = useBackofficeSession();

  return (
    <RoleGate allowedRoles={ALLOWED_ROLES} currentRole={roleTag} isLoading={isLoading}>
      <AppShell items={BACKOFFICE_NAVIGATION} user={user}>
        {children}
      </AppShell>
    </RoleGate>
  );
}