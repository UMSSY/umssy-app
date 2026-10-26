"use client";

import type { EventRegistrationActionProps } from '../types/event-registration-action-props.types';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildLoginUrl } from "@/modules/auth/utils/safe-next-path";
import { useRegistration, useRegistrationActions, useRegistrationSession } from "@/modules/registrations";
import { getRegistrationErrorMessage } from "@/modules/registrations";
import { parseApiError } from "@/shared/utils/parse-api-error";
import { RequestFeedback } from "./request-feedback";
import { RegistrationConfirmationDialog } from "./registration-confirmation-dialog";
import { useEventFinished } from "../hooks/use-event-finished";
import { hasValidEventCapacity } from "../utils/has-valid-event-capacity";


export function EventRegistrationAction({ event, onEventNotFound }: EventRegistrationActionProps) {
  const router = useRouter();
  const hasFinished = useEventFinished(event);
  const session = useRegistrationSession();
  const own = useRegistration(event.id);
  const action = useRegistrationActions(event.id);
  const [open, setOpen] = useState(false);
  const [blockedCode, setBlockedCode] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const isRegistered = own.registration?.status === "confirmed" || event.hasSupported === true || blockedCode === "ALREADY_REGISTERED";
  const isFinished = hasFinished || blockedCode === "EVENT_FINISHED";
  const isFull = event.availableSpots === 0 || blockedCode === "EVENT_FULL";
  const isClosed = blockedCode === "REGISTRATION_CLOSED" || blockedCode === "EVENT_CANCELLED" || blockedCode === "EVENT_NOT_OPEN";
  const isUnavailable = !hasValidEventCapacity(event) || event.status === "voting" || event.status === "cancelled";
  const disabled = action.isPending || isRegistered || isFull || isClosed || isFinished || isUnavailable;
  const label = action.isPending ? "Inscribiendo..." : isRegistered ? "Ya estás inscrito" : isFinished ? "El taller ya finalizó" : isFull ? "Taller lleno" : isClosed ? "Inscripción cerrada" : isUnavailable ? "Inscripción no disponible" : "Inscribirme";
  const showInlineError = action.error && !["EVENT_NOT_FOUND", "AUTH_REQUIRED", "UNAUTHENTICATED"].includes(action.errorCode ?? "");
  const retryable = !action.errorCode || ["VALIDATION_ERROR", "INTERNAL_ERROR"].includes(action.errorCode);

  function start() {
    if (disabled) return;
    if (!session) {
      router.push(buildLoginUrl("/events"));
      return;
    }
    action.reset();
    setOpen(true);
  }

  async function confirm() {
    const result = await action.register();
    if (!result || !isMountedRef.current) return;
    setOpen(false);
    if (!result.error) return;
    const code = parseApiError(result.error)?.code;
    if (code && ["EVENT_FINISHED", "EVENT_FULL", "ALREADY_REGISTERED", "REGISTRATION_CLOSED", "EVENT_CANCELLED", "EVENT_NOT_OPEN"].includes(code)) {
      setBlockedCode(code);
    }
    if (code === "EVENT_NOT_FOUND") {
      toast.error(getRegistrationErrorMessage(result.error));
      onEventNotFound?.();
    }
    if (code === "AUTH_REQUIRED" || code === "UNAUTHENTICATED") {
      toast.info(getRegistrationErrorMessage(result.error));
      router.push(buildLoginUrl("/events"));
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="mt-2 min-h-11 w-full bg-brand-red text-white hover:bg-brand-red/90 disabled:bg-muted disabled:text-text-secondary disabled:opacity-100"
        disabled={disabled}
        size="lg"
        type="button"
        onClick={start}
      >
        {action.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {label}
      </Button>
      {action.isSuccess && <RequestFeedback message="Inscripción confirmada." />}
      {showInlineError && <RequestFeedback message={action.error!} isError={!isRegistered && !isClosed} onRetry={retryable && !disabled ? start : undefined} />}
      {own.error && session && <RequestFeedback message={own.error} isError onRetry={() => { void own.retry(); }} />}
      <RegistrationConfirmationDialog event={event} open={open} pending={action.isPending} onClose={() => setOpen(false)} onConfirm={() => { void confirm(); }} />
    </div>
  );
}
