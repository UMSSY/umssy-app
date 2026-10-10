import type { ReactNode } from "react";
import Link from "next/link";

export interface PageHeaderBreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  breadcrumb: PageHeaderBreadcrumbItem[];
  title: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ breadcrumb, title, actions, children }: PageHeaderProps) {
  return (
    <header className="-mx-8 bg-surface border-b border-border shadow-[0_1px_2px_rgba(11,31,46,0.05)]">
      <div className="flex min-h-[64px] items-center gap-4 px-8 py-3">
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;
                return (
                  <li key={item.label} className="flex items-center gap-1">
                    {!isLast && item.href ? (
                      <Link href={item.href} className="hover:text-ink">
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? "page" : undefined}
                        className={isLast ? "font-medium text-ink" : undefined}
                      >
                        {item.label}
                      </span>
                    )}
                    {!isLast && (
                      <span aria-hidden="true" className="select-none text-text-secondary">
                        ›
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="mt-0.5">
            <div className="mb-0.5 h-px w-8 rounded-full bg-gold" aria-hidden="true" />
            <h1 className="font-heading text-xl font-bold text-ink">{title}</h1>
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {children && (
        <div className="border-t border-border px-8 pb-4">{children}</div>
      )}
    </header>
  );
}
