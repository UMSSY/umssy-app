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
  const { open, isMobile } = useSidebar();
  const hideBrand = !isMobile && open;
  return (
    <header className="sticky top-0 z-30 flex h-app-header min-w-0 shrink-0 items-center gap-2 border-b border-app-header-foreground/15 bg-app-header px-3 text-app-header-foreground sm:gap-4 sm:px-4 lg:gap-6 lg:px-6">
      <div inert={hideBrand} aria-hidden={hideBrand || undefined} className="flex w-auto shrink-0 items-center gap-2 sm:w-48 sm:gap-3 lg:w-64">
        <SidebarToggleButton />
        {brand ?? <Link href="/dashboard" aria-label="UMSSY, ir al inicio" className="block shrink-0 outline-offset-4"><BrandLogo variant="on-dark" className="w-24 sm:w-32 lg:w-40" priority /></Link>}
      </div>
      <div className="min-w-0 flex-1"><NavigationSearch /></div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <ChatPanel roles={roles} />
        <AccountMenu roles={roles} />
      </div>
    </header>
  );
}
