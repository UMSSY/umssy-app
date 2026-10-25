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
    <header className="sticky top-0 z-30 flex min-h-app-header shrink-0 flex-wrap items-center gap-2 border-b border-app-header-foreground/15 bg-app-header px-3 py-2 text-app-header-foreground lg:h-app-header lg:flex-nowrap lg:gap-6 lg:px-6 lg:py-0">
      <div inert={open} aria-hidden={open || undefined} className="flex shrink-0 items-center gap-3 lg:w-64">
        <SidebarToggleButton />
        {brand ?? <Link href="/dashboard" aria-label="UMSSY, ir al inicio" className="block shrink-0 outline-offset-4"><BrandLogo variant="on-dark" className="w-40" priority /></Link>}
      </div>
      <div className="order-last w-full min-w-0 lg:order-none lg:w-auto lg:flex-1"><NavigationSearch /></div>
      <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:gap-4">
        <ChatPanel roles={roles} />
        <AccountMenu roles={roles} />
      </div>
    </header>
  );
}
