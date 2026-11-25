import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CredentialRestrictionNoticeProps } from "../types/credential-restriction.types";
import { formatRemainingTime } from "../utils/format-remaining-time";

export function CredentialRestrictionNotice({ restriction }: CredentialRestrictionNoticeProps) {
  if (!restriction) return null;
  return (
    <Alert role="group" className="my-4 border-danger/25 bg-surface text-danger">
      <AlertDescription className="text-danger">
      <p role="alert" className="text-sm font-medium">{restriction.message}</p>
      <p className="mt-1 text-sm">
        Podrás volver a intentarlo en <span role="timer" aria-live="off">{formatRemainingTime(restriction.remainingSeconds)}</span>.
      </p>
      </AlertDescription>
    </Alert>
  );
}
