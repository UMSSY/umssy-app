import { Skeleton } from "@/components/ui/skeleton";

export function SurveyStatisticsSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Cargando analíticas">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
            <Skeleton className="size-11 shrink-0 rounded-lg bg-border" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-24 bg-border" />
              <Skeleton className="h-6 w-12 bg-border" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
            <Skeleton className="h-4 w-2/3 bg-border" />
            <Skeleton className="h-3 w-full bg-border" />
            <Skeleton className="h-3 w-5/6 bg-border" />
            <Skeleton className="h-3 w-3/4 bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
