import type { CSSProperties } from "react";

export const SIDEBAR_STYLE = { "--sidebar-width": "16.5rem" } as CSSProperties;

export const SIDEBAR_ITEM_CLASS =
  "relative h-auto min-h-10 gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-active:bg-sidebar-accent data-active:font-semibold data-active:text-sidebar-accent-foreground data-active:before:absolute data-active:before:left-0 data-active:before:top-1/2 data-active:before:h-5 data-active:before:w-0.5 data-active:before:-translate-y-1/2 data-active:before:rounded-full data-active:before:bg-brand-red [&_svg]:size-4 [&_svg]:shrink-0";

export const SIDEBAR_SUB_ITEM_CLASS =
  "h-auto min-h-9 gap-2 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-semibold data-active:text-sidebar-accent-foreground [&>span:last-child]:whitespace-normal";

export const SIDEBAR_TOGGLE_ID = "workspace-sidebar-trigger";
