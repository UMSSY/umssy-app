"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "cn";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { SIDEBAR_ITEM_CLASS, SIDEBAR_SUB_ITEM_CLASS } from "@/shared/constants/sidebar.constants";
import type { SidebarNavItemProps } from "@/shared/types/sidebar-nav-item-props.types";
import { isRouteActive } from "@/shared/utils/is-route-active";

export function SidebarNavItem({
  item,
  pathname,
  className,
  badge,
}: SidebarNavItemProps & { className?: string; badge?: ReactNode }) {
  const Icon = item.icon;
  const submenuId = useId();
  const hasActiveChild = item.activePathPatterns?.some((pattern) => pattern.test(pathname)) === true ||
    item.children?.some((child) =>
      isRouteActive(pathname, child.href, child.activePathPatterns),
    ) === true;
  const [collapsedPath, setCollapsedPath] = useState<string | null>(null);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const isExpanded = hasActiveChild ? collapsedPath !== pathname : isManuallyExpanded;

  if (!item.children) {
    const isActive = item.href ? isRouteActive(pathname, item.href, item.activePathPatterns) : false;

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<Link href={item.href ?? "#"} />}
          isActive={isActive}
          aria-current={isActive ? "page" : undefined}
          className={cn(SIDEBAR_ITEM_CLASS, className)}
        >
          <Icon strokeWidth={1.5} aria-hidden="true" />
          <span className={badge ? "flex-1" : undefined}>{item.label}</span>
          {badge}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={hasActiveChild}
        aria-expanded={isExpanded}
        aria-controls={submenuId}
        onClick={() => {
          if (hasActiveChild) setCollapsedPath(isExpanded ? pathname : null);
          else setIsManuallyExpanded(!isExpanded);
        }}
        className={cn(SIDEBAR_ITEM_CLASS, className)}
      >
        <Icon strokeWidth={1.5} aria-hidden="true" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          className={cn("ml-auto text-text-secondary transition-transform duration-150", isExpanded && "rotate-180")}
          aria-hidden="true"
        />
      </SidebarMenuButton>

      <div id={submenuId} aria-hidden={!isExpanded} inert={!isExpanded} className={cn("grid transition-all duration-200 ease-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="min-h-0 overflow-hidden">
        <SidebarMenuSub className="mr-0 mb-2 ml-5 gap-0.5 border-sidebar-border py-1 pr-0 pl-3">
          {item.children.map((child) => {
            const isChildActive = isRouteActive(
              pathname,
              child.href,
              child.activePathPatterns,
            ) && !item.children?.some((other) =>
              other.href !== child.href &&
              other.href.startsWith(`${child.href}/`) &&
              isRouteActive(pathname, other.href, other.activePathPatterns),
            );
            const ChildIcon = child.icon;

            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  render={<Link href={child.href} />}
                  isActive={isChildActive}
                  aria-current={isChildActive ? "page" : undefined}
                  className={SIDEBAR_SUB_ITEM_CLASS}
                >
                  {ChildIcon ? (
                    <ChildIcon size={16} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <span
                      className={cn("size-1 shrink-0 rounded-full", isChildActive ? "bg-accent" : "bg-border-strong")}
                      aria-hidden="true"
                    />
                  )}
                  <span>{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
        </div>
      </div>
    </SidebarMenuItem>
  );
}
