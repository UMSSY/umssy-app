import { Skeleton } from "@/components/ui/skeleton";

export function CompanyCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col rounded-lg border border-border bg-surface p-6">
      <Skeleton className="mb-3 h-3 w-24" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-12" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <Skeleton className="mt-5 h-4 w-40" />
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-8 rounded-full" />
      </div>
    </div>
  );
}
