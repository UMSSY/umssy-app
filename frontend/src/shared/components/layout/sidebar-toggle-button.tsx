"use client";

import { cn } from "@/lib/utils";
import { SIDEBAR_TOGGLE_ID } from "@/shared/constants/sidebar.constants";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarToggleButton() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const expanded = isMobile ? openMobile : open;

  return (
    <Button
      id={SIDEBAR_TOGGLE_ID}
      variant="ghost"
      size="icon-sm"
      type="button"
      onClick={toggleSidebar}
      aria-label="Abrir menú"
      aria-hidden={expanded || undefined}
      tabIndex={expanded ? -1 : 0}
      aria-expanded={expanded}
      className={cn("border-app-header-foreground/70 bg-transparent text-app-header-foreground hover:border-app-header-foreground hover:bg-transparent hover:text-app-header-foreground focus-visible:ring-app-header-foreground aria-expanded:bg-transparent aria-expanded:text-app-header-foreground", expanded && "invisible")}
    >
      <Menu className="size-5" aria-hidden="true" />
    </Button>
  );
}
