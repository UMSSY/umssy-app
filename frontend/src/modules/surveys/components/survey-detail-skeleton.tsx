import { Skeleton } from "@/components/ui/skeleton";

export function SurveyDetailSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
