import type { NavigationItem } from "./navigation-item.types";
import type { SidebarUser } from "./sidebar-user.types";

export interface AppSidebarProps {
  items?: NavigationItem[];
  user?: SidebarUser;
}
