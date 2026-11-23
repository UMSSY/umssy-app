import type { NotificationsInboxEmptyProps } from "../types/notifications-inbox-empty-props.types";

export function NotificationsInboxEmpty({
  icon: Icon,
  title,
  description,
  titleAs: Title = "h2",
}: NotificationsInboxEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <Title className="mt-2 text-base font-semibold text-foreground">
        {title}
      </Title>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
