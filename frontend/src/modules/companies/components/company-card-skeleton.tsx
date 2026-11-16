export function CompanyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-surface p-6" aria-hidden="true">
      <div className="mb-4 flex items-center gap-4">
        <div className="size-12 rounded-md bg-border" />
        <div className="h-5 w-40 rounded bg-border" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-border" />
        <div className="h-3 w-5/6 rounded bg-border" />
        <div className="h-3 w-2/3 rounded bg-border" />
      </div>
      <div className="mt-5 h-7 w-44 rounded-full bg-border" />
      <div className="mt-6 h-5 w-full border-t border-border pt-4" />
    </div>
  );
}