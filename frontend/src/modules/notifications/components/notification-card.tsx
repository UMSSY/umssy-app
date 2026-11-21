import { cn } from "@/lib/utils";
import type { NotificationCardProps } from "../types/notification-card-props.types";

export function NotificationCard({
  icon: Icon,
  title,
  description,
  isHighlighted,
  action,
  dateTime,
  timeLabel,
  iconClassName = "border-border bg-muted/80 text-foreground",
}: NotificationCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between",
        isHighlighted
          ? "border-border bg-card shadow-xs"
          : "border-border/80 bg-muted/40",
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span
          aria-hidden="true"
          className={cn(
            "mt-2 size-2 shrink-0 rounded-full sm:mt-0",
            isHighlighted ? "bg-brand-red" : "bg-transparent",
          )}
        />
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border",
            iconClassName,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 pl-5 sm:pl-0">
        {timeLabel ? (
          <time
            dateTime={dateTime}
            className="text-xs whitespace-nowrap text-muted-foreground"
          >
            {timeLabel}
          </time>
        ) : null}
        {action}
      </div>
    </article>
  );
}
