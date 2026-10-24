import { cn } from "cn";
import type { PageHeadingProps } from "@/shared/types/page-heading-props.types";

export function PageHeading({ title, description, actions, className }: PageHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4 border-b border-accent/20 pb-5", className)}>
      <div className="max-w-3xl min-w-0">
        <h1 className="font-tight text-3xl leading-tight font-bold tracking-tight text-accent">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
