"use client";

import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/shared/contexts/auth-context";
import { SidebarToggleButton } from "./sidebar-toggle-button";
import { NavigationSearch } from "./navigation-search";
import { AccountMenu } from "./account-menu";
import { ChatPanel } from "@/modules/chat";
import { BrandLogo } from "./brand-logo";
import type { AppHeaderProps } from "@/shared/types/app-header-props.types";

export function AppHeader({ brand }: AppHeaderProps) {
  const { roles } = useAuth();
  const { open } = useSidebar();
  return (
    <header className="sticky top-0 z-30 flex h-app-header shrink-0 items-center gap-6 border-b border-app-header-foreground/15 bg-app-header px-6 text-app-header-foreground">
      <div inert={open} aria-hidden={open || undefined} className="flex w-64 shrink-0 items-center gap-3">
        <SidebarToggleButton />
        {brand ?? <Link href="/dashboard" aria-label="UMSSY, ir al inicio" className="block shrink-0 outline-offset-4"><BrandLogo variant="on-dark" className="w-40" priority /></Link>}
      </div>
      <div className="min-w-0 flex-1"><NavigationSearch /></div>
      <div className="flex shrink-0 items-center gap-4">
        <ChatPanel roles={roles} />
        <AccountMenu roles={roles} />
      </div>
    </header>
  );
}
