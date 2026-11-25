"use client";

import { useProfileSurface } from "../contexts/profile-surface-context";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SectionCardProps } from "../types/section-card-props.types";

export function SectionCard({ title, description, icon, action, children, className, contentClassName }: SectionCardProps) {
  const isEmbedded = useProfileSurface();
  if (isEmbedded) return <section className={cn("border-t border-border px-4 py-5 sm:p-6 lg:px-8 lg:py-7", className)}>
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0"><h2 className="text-xl font-bold text-ink">{title}</h2>{description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}</div>
      {action ? <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-start">{action}</div> : null}
    </header>
    <div className={contentClassName}>{children}</div>
  </section>;
  return (
    <Card
      className={cn(
        "gap-5 rounded-lg border border-border bg-surface py-0 text-ink shadow-none ring-0",
        className,
      )}
    >
      <CardHeader className="gap-1.5 rounded-t-lg border-b border-accent/15 bg-interaction px-4 py-3.5 sm:px-5 sm:py-4">
        <CardTitle className="flex items-center gap-2 font-tight text-lg font-bold text-accent">
          {icon}
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-sm leading-relaxed text-availability-foreground">{description}</CardDescription>
        ) : null}
        {action ? <CardAction className="row-span-2">{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("px-4 pb-4 sm:px-5 sm:pb-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}