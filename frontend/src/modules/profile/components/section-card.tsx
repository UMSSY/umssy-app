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

export function SectionCard({ title, description, action, children, className, contentClassName }: SectionCardProps) {
  const isEmbedded = useProfileSurface();
  if (isEmbedded) return <section className={cn("border-t border-border px-8 py-7", className)}>
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0"><h2 className="text-xl font-bold text-ink">{title}</h2>{description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
      <CardHeader className="gap-1.5 rounded-t-lg border-b border-accent/15 bg-interaction px-5 py-4">
        <CardTitle className="font-tight text-lg font-bold text-accent">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-sm leading-relaxed text-availability-foreground">{description}</CardDescription>
        ) : null}
        {action ? <CardAction className="row-span-2">{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("px-5 pb-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
