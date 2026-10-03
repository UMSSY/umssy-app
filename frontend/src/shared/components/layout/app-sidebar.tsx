"use client";

import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { SIDEBAR_NAVIGATION } from "@/shared/config/navigation.config";
import { TEMPORARY_SIDEBAR_USER } from "@/shared/config/sidebar-user.config";
import type { AppSidebarProps } from "@/shared/types/app-sidebar-props.types";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarUserCard } from "./sidebar-user-card";

export function AppSidebar({
  items = SIDEBAR_NAVIGATION,
  user = TEMPORARY_SIDEBAR_USER,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-ink bg-ink text-surface *:data-[slot=sidebar-inner]:bg-ink"
    >
      <SidebarHeader className="p-2">
        <SidebarBrand />
      </SidebarHeader>

      <SidebarContent className="px-3">
        <nav aria-label="Menú principal">
          <SidebarMenu className="gap-1">
            {items.map((item) => (
              <SidebarNavItem key={item.label} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        </nav>
      </SidebarContent>

      <SidebarFooter className="px-3 py-4">
        <SidebarUserCard user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
