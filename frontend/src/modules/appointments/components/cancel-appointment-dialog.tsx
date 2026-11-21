'use client';

import { useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BOLIVIA_TIME_LABEL } from '@/shared/constants/date-time.constants';
import { formatBlockRange } from '@/shared/utils/date-time';
import { getApiErrorDetail } from '@/shared/utils/api-error-detail';
import {
  CANCEL_APPOINTMENT_TEXT as TEXT,
  CANCELLATION_REASON_MAX_LENGTH,
  CANCELLATION_REASON_WINDOW_MS,
} from '../constants/cancel-appointment.constants';
import { useCancelAppointment } from '../hooks/use-cancel-appointment';
import type { CancelAppointmentDialogProps } from '../types/cancel-appointment-dialog-props.types';
import { formatAppointmentDate } from '../utils/appointment-detail.utils';

export function CancelAppointmentDialog({
  appointment,
}: CancelAppointmentDialogProps) {
  const [now, setNow] = useState(() => Date.now());
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const cancel = useCancelAppointment();
  const startAt = new Date(appointment.startAt).getTime();
  const reasonRequired = startAt - now < CANCELLATION_REASON_WINDOW_MS;

  const changeOpen = (nextOpen: boolean) => {
    if (sendingRef.current) return;
    if (nextOpen) setNow(Date.now());
    setOpen(nextOpen);
    setReason('');
    setError(null);
  };

  const confirm = async () => {
    if (sendingRef.current) return;
    const remaining = startAt - Date.now();
    const trimmedReason = reason.trim();
    const validationError =
      remaining <= 0
        ? TEXT.unavailable
        : trimmedReason.length > CANCELLATION_REASON_MAX_LENGTH
          ? TEXT.reasonTooLong
          : remaining < CANCELLATION_REASON_WINDOW_MS && !trimmedReason
            ? TEXT.reasonRequired
            : null;
    if (validationError) {
      setError(validationError);
      inputRef.current?.focus();
      return;
    }
    sendingRef.current = true;
    setError(null);
    try {
      await cancel.mutateAsync({
        appointmentId: appointment.id,
        reason: trimmedReason || undefined,
      });
      setOpen(false);
      setReason('');
    } catch (cause) {
      setError(getApiErrorDetail(cause) ?? TEXT.error);
      inputRef.current?.focus();
    } finally {
      sendingRef.current = false;
    }
  };

  if (appointment.status !== 'CONFIRMED' || startAt <= now) return null;

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        {TEXT.title}
      </AlertDialogTrigger>
      <AlertDialogContent
        overlayProps={{ forceRender: true, className: 'bg-black/50' }}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] min-w-0 overflow-y-auto"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{TEXT.title}</AlertDialogTitle>
          <AlertDialogDescription>{TEXT.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="min-w-0 space-y-1 text-sm wrap-anywhere">
          <p className="font-medium">{appointment.counterpart.fullName}</p>
          <p>{formatAppointmentDate(appointment.startAt)}</p>
          <p>
            {formatBlockRange(appointment.startAt, appointment.endAt)} ·{' '}
            {BOLIVIA_TIME_LABEL}
          </p>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="cancel-appointment-reason">{TEXT.reason}</Label>
          <p
            id="cancel-appointment-help"
            className="text-sm text-muted-foreground"
          >
            {TEXT.required}
          </p>
          <Textarea
            ref={inputRef}
            id="cancel-appointment-reason"
            value={reason}
            required={reasonRequired}
            aria-invalid={!!error}
            aria-describedby={`cancel-appointment-help cancel-appointment-counter${error ? ' cancel-appointment-error' : ''}`}
            disabled={cancel.isPending}
            className="min-w-0 resize-y"
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
          />
          <p
            id="cancel-appointment-counter"
            className="text-right text-sm text-muted-foreground"
          >
            {reason.length}/{CANCELLATION_REASON_MAX_LENGTH}
          </p>
          {error ? (
            <p
              id="cancel-appointment-error"
              role="alert"
              className="text-sm wrap-anywhere text-destructive"
            >
              {error}
            </p>
          ) : null}
        </div>
        <AlertDialogFooter>
          <Button
            variant="outline"
            disabled={cancel.isPending}
            onClick={() => changeOpen(false)}
          >
            {TEXT.back}
          </Button>
          <Button
            variant="destructive"
            disabled={cancel.isPending}
            onClick={confirm}
          >
            {cancel.isPending ? TEXT.pending : TEXT.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
