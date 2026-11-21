import type { ReactNode } from "react";
import type { NavigationItem } from "./navigation-item.types";

export interface SidebarNavItemProps {
  item: NavigationItem;
  pathname: string;
  childBadges?: Record<string, ReactNode>;
}
