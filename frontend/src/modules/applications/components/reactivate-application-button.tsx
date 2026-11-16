import { Button } from "@/components/ui/button";

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
      variant="success"
      className={className}
      disabled={isReactivating}
      onClick={() => onReactivate(applicationId)}
    >
      {isReactivating ? "Reactivando…" : "Volver a postular"}
    </Button>
  );
}
