import { Badge } from "@/components/ui/badge";
import type { ReviewProfileStatus } from "../types/review-queue.types";

interface ReviewStatusBadgeProps {
  status: ReviewProfileStatus;
}

function getStatusClasses(status: ReviewProfileStatus): string {
  switch (status) {
    case "Completado":
      return "border-availability-border bg-availability text-availability-foreground";

    case "Procesando":
      return "border-availability-border text-availability-foreground";

    case "Pendiente":
      return "border-notice-border bg-notice text-notice-foreground";
  }
}

export function ReviewStatusBadge({
  status,
}: ReviewStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={getStatusClasses(status)}
    >
      {status}
    </Badge>
  );
}