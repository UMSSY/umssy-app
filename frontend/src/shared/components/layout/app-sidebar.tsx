"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { SIDEBAR_NAVIGATION } from "@/shared/config/navigation.config";
import type { AppSidebarProps } from "@/shared/types/app-sidebar-props.types";
import { isNavigationSection } from "@/shared/types/navigation-section.types";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarUserCard } from "./sidebar-user-card";

interface AppSidebarExtras {
  brand?: ReactNode;
  footer?: ReactNode;
  itemClassName?: string;
  itemBadges?: Record<string, ReactNode>;
}

export function AppSidebar({
  items = SIDEBAR_NAVIGATION,
  user,
  brand,
  footer,
  itemClassName,
  itemBadges,
}: AppSidebarProps & AppSidebarExtras) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-ink bg-ink text-surface *:data-[slot=sidebar-inner]:bg-ink"
    >
      <SidebarHeader className="border-b border-surface/10 p-2">
        {brand ?? <SidebarBrand role={user?.role} />}
      </SidebarHeader>

      <SidebarContent className="px-3 py-2">
        <nav aria-label="Menú principal">
          <SidebarMenu className="gap-1">
            {items.map((entry) => {
              if (isNavigationSection(entry)) {
                return (
                  <li key={entry.sectionLabel} role="none" className="mt-3">
                    <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-surface/40">
                      {entry.sectionLabel}
                    </p>
                    <SidebarMenu className="gap-1">
                      {entry.items.map((item) => (
                        <SidebarNavItem
                          key={item.label}
                          item={item}
                          pathname={pathname}
                          className={itemClassName}
                          badge={itemBadges?.[item.label]}
                        />
                      ))}
                    </SidebarMenu>
                  </li>
                );
              }

              return (
                <SidebarNavItem
                  key={entry.label}
                  item={entry}
                  pathname={pathname}
                  className={itemClassName}
                  badge={itemBadges?.[entry.label]}
                />
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      {footer ? (
        <SidebarFooter className="border-t border-surface/10 px-3 py-4">
          {footer}
        </SidebarFooter>
      ) : (
        user && (
          <SidebarFooter className="border-t border-surface/10 px-3 py-4">
            <SidebarUserCard user={user} />
          </SidebarFooter>
        )
      )}
    </Sidebar>
  );
}
