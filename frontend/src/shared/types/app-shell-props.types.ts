import type { ReactNode } from "react";
import type { NavigationEntry } from "./app-sidebar-props.types";
import type { SidebarUser } from "./sidebar-user.types";

export interface AppShellProps {
  children: ReactNode;
  items?: NavigationEntry[];
  user?: SidebarUser;
  fullBleed?: boolean;
}
