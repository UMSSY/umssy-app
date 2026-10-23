import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SidebarUserCardProps } from "@/shared/types/sidebar-user-card-props.types";
import { getInitials } from "@/shared/utils/get-initials";

export function SidebarUserCard({ user, action, onLogout }: SidebarUserCardProps) {
  const userAction = action ?? (onLogout ? (
    <Button type="button" variant="ghost" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={onLogout} className="w-full justify-start text-brand-red hover:bg-brand-soft hover:text-brand-red">
      <LogOut strokeWidth={1.75} aria-hidden="true" />Cerrar sesión
    </Button>
  ) : null);
  return (
    <div className="flex w-full flex-wrap items-center gap-3 rounded-md p-2">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-sidebar-border bg-interaction text-sm font-semibold text-accent"
        aria-hidden="true"
      >
        {getInitials(user.fullName)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold break-words text-sidebar-foreground">{user.fullName}</span>
        <span className="mt-0.5 text-xs break-words text-text-secondary">{user.role}</span>
      </div>
      {userAction ? <div className="w-full border-t border-sidebar-border pt-3">{userAction}</div> : null}
    </div>
  );
}
