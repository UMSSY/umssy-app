import { SECONDARY_BUTTON_CLASS } from "../utils/ui-classes";

interface ProfileLoadStateProps {
  status: "loading" | "error";
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function ProfileLoadState({ status, errorMessage, onRetry }: ProfileLoadStateProps) {
  if (status === "loading") {
    return (
      <p role="status" className="rounded-xl border border-border bg-surface p-6 text-[15px] text-text-secondary">
        Cargando tu perfil...
      </p>
    );
  }

  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-6">
      <p className="text-[15px] text-danger">{errorMessage}</p>
      <button type="button" className={SECONDARY_BUTTON_CLASS} onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}
