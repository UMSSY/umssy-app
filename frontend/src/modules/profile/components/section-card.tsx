import type { ReactNode } from "react";

interface SectionCardProps {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 md:p-7 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <span aria-hidden="true" className="mb-3 block h-0.75 w-6.5 bg-gold" />
          <h2 className="font-tight text-[20px] font-bold text-ink md:text-[22px]">{title}</h2>
          {description ? (
            <p className="mt-2 text-[14px] text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
