import type { NavigationItem } from "./navigation-item.types";
import type { NavigationSection } from "./navigation-section.types";
import type { SidebarUser } from "./sidebar-user.types";

export type NavigationEntry = NavigationItem | NavigationSection;

export interface AppSidebarProps {
  items?: NavigationEntry[];
  user?: SidebarUser;
}
