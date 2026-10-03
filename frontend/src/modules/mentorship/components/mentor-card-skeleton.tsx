import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export function MentorCardSkeleton() {
  return (
    <Card
      aria-hidden="true"
      className="h-full border-border bg-surface shadow-sm"
      data-testid="mentor-card-skeleton"
    >
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
        </div>

        <div>
          <Skeleton className="mb-3 h-4 w-24" />

          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto bg-surface">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}
