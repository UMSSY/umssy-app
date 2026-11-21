import { Skeleton } from "@/components/ui/skeleton";
import type { NotificationsInboxLoadingProps } from "../types/notifications-inbox-loading-props.types";

export function NotificationsInboxLoading({ rows = 4 }: NotificationsInboxLoadingProps) {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className="h-18 rounded-xl border border-border bg-muted/60"
        />
      ))}
    </div>
  );
}
