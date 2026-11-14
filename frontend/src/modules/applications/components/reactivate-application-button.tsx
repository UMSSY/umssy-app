import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReactivateApplicationButtonProps {
  applicationId: string;
  reactivatingId?: string | null;
  onReactivate: (applicationId: string) => void;
  className?: string;
}

export function ReactivateApplicationButton({
  applicationId,
  reactivatingId,
  onReactivate,
  className,
}: ReactivateApplicationButtonProps) {
  const isReactivating = reactivatingId === applicationId;

  return (
    <Button
      type="button"
      size="sm"
      className={cn("bg-success text-surface hover:brightness-90", className)}
      disabled={isReactivating}
      onClick={() => onReactivate(applicationId)}
    >
      {isReactivating ? "Reactivando…" : "Volver a postular"}
    </Button>
  );
}
