import type { CSSProperties } from "react";

export const SIDEBAR_STYLE = { "--sidebar-width": "13rem" } as CSSProperties;

export const SIDEBAR_ITEM_CLASS =
  "h-auto gap-3 rounded-md px-3 py-2 text-[13px] text-surface/60 transition-all duration-150 hover:bg-surface/5 hover:text-surface data-active:bg-surface/10 data-active:text-surface focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0";

export const SIDEBAR_SUB_ITEM_CLASS =
  "h-auto gap-3 rounded-md px-3 py-1.5 text-[13px] text-surface/60 transition-colors hover:bg-surface/5 hover:text-surface data-active:bg-surface/10 data-active:text-surface focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none";
