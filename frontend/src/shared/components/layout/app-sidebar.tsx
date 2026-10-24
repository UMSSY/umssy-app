"use client";

import { useEffect, useRef } from "react";
import { SIDEBAR_TOGGLE_ID } from "@/shared/constants/sidebar.constants";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/shared/contexts/auth-context";
import { filterNavigationByRoles } from "@/shared/utils/filter-navigation-by-roles";
import { SIDEBAR_NAVIGATION } from "@/shared/config/navigation.config";
import type { AppSidebarProps } from "@/shared/types/app-sidebar-props.types";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarUserCard } from "./sidebar-user-card";

export function AppSidebar({
  showBrand = true,
  items = SIDEBAR_NAVIGATION,
  user,
  brand,
  footer,
  itemClassName,
  itemBadges,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { roles } = useAuth();
  const { open, setOpen } = useSidebar();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousOpen = useRef(open);
  useEffect(() => {
    if (previousOpen.current !== open) {
      if (open) closeRef.current?.focus();
      else document.getElementById(SIDEBAR_TOGGLE_ID)?.focus();
      previousOpen.current = open;
    }
  }, [open]);
  const visibleItems = filterNavigationByRoles(items, roles);

  return (
    <Sidebar
      collapsible="offcanvas"
      onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) { event.preventDefault(); setOpen(false); } }}
      className="top-0 z-40 h-svh border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="h-app-header shrink-0 justify-center border-b border-sidebar-border px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          {showBrand ? brand ?? <SidebarBrand /> : <SidebarBrand />}
          <Button ref={closeRef} type="button" variant="ghost" size="icon-sm" aria-label="Cerrar barra lateral" onClick={() => setOpen(false)} className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><X aria-hidden="true" /></Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <nav aria-label="Menú principal">
          <SidebarMenu className="gap-1">
            {visibleItems.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                pathname={pathname}
                className={itemClassName}
                badge={itemBadges?.[item.label]}
              />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      {footer ? (
        <SidebarFooter className="border-t border-sidebar-border px-3 py-4">{footer}</SidebarFooter>
      ) : (
        user && (
          <SidebarFooter className="border-t border-sidebar-border px-3 py-4">
            <SidebarUserCard user={user} />
          </SidebarFooter>
        )
      )}
    </Sidebar>
  );
}
