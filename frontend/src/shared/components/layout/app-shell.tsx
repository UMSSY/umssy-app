"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { cn } from "cn";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SIDEBAR_STYLE } from "@/shared/constants/sidebar.constants";
import type { AppShellProps } from "@/shared/types/app-shell-props.types";
import type { NavigationItem } from "@/shared/types/navigation-item.types";
import { AppSidebar } from "./app-sidebar";
import { SessionUserCard } from "@/modules/auth";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { ChatDock, MessagingUiProvider } from "@/modules/chat";
import { AppHeader } from "./app-header";

export function AppShell({
  children,
  items,
  user,
  fullBleed = false,
  brand,
  sidebarFooter,
  sidebarItemClassName,
  sidebarItemBadges,
  sidebarWidth,
  header,
  contentClassName,
}: AppShellProps) {
  const pathname = usePathname();
  return (
    <MessagingUiProvider>
    <SidebarProvider
      data-app-shell="true"
      className={cn("flex-col bg-background", contentClassName && "h-dvh min-h-0 overflow-hidden")}
      style={
        sidebarWidth
          ? ({
              ...SIDEBAR_STYLE,
              "--sidebar-width": sidebarWidth,
            } as CSSProperties)
          : SIDEBAR_STYLE
      }
    >
      {header ?? <AppHeader brand={brand} />}
      <div className="flex min-h-0 min-w-0 flex-1">
      <AppSidebar
        showBrand={Boolean(header)}
        items={items as NavigationItem[] | undefined}
        user={user}
        brand={brand}
        footer={
          sidebarFooter ??
          (!user && getAccessToken() ? <SessionUserCard /> : undefined)
        }
        itemClassName={sidebarItemClassName}
        itemBadges={sidebarItemBadges}
      />
      <SidebarInset
        className={cn(
          "min-h-0 min-w-0 bg-background",
          contentClassName && "overflow-hidden",
        )}
      >
        <div
          key={pathname}
          className={cn(
            "flex-1 animate-in duration-200 ease-out fade-in",
            contentClassName ??
              (fullBleed ? "flex min-w-0 flex-col" : "px-12 py-10"),
          )}
        >
          {children}
        </div>
      </SidebarInset>
      <ChatDock />
      </div>
    </SidebarProvider>
    </MessagingUiProvider>
  );
}
