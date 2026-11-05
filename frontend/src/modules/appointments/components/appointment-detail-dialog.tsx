"use client";

import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize } from "@/modules/profile";
import { BOLIVIA_TIME_LABEL } from "@/shared/constants/date-time.constants";
import { formatBlockRange } from "@/shared/utils/date-time";
import { getInitials } from "@/shared/utils/get-initials";
import {
  APPOINTMENTS_TEXT,
  APPOINTMENT_DETAIL_TEXT,
  APPOINTMENT_ROLE_LABELS,
  APPOINTMENT_STATUS_CLASSES,
  APPOINTMENT_STATUS_LABELS,
} from "../constants/appointments.constants";
import { useAppointment } from "../hooks/use-appointment";
import { useCounterpartPhoto } from "../hooks/use-counterpart-photo";
import { useDownloadAppointmentDocument } from "../hooks/use-download-appointment-document";
import type { AppointmentDetailDialogProps } from "../types/appointment-detail-dialog-props.types";
import {
  formatAppointmentDate,
  formatAppointmentRequestedAt,
  getAppointmentDocumentTypeLabel,
} from "../utils/appointment-detail.utils";

export function AppointmentDetailDialog({ appointmentId, onClose }: AppointmentDetailDialogProps) {
  const { appointment, isLoading, error } = useAppointment(appointmentId);
  const photoUrl = useCounterpartPhoto(appointment ? appointmentId : null);
  const downloadDocument = useDownloadAppointmentDocument();

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={appointmentId !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto sm:max-w-md">
        {appointment ? (
          <>
            <DialogHeader className="flex-row items-start gap-3 pr-8">
              <Avatar size="lg" className="size-11">
                {photoUrl ? (
                  <AvatarImage
                    src={photoUrl}
                    alt={`${APPOINTMENT_DETAIL_TEXT.photoAlt} ${appointment.counterpart.fullName}`}
                  />
                ) : null}
                <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
                  {getInitials(appointment.counterpart.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1.5">
                <DialogTitle className="text-lg leading-snug font-bold wrap-anywhere text-ink">
                  {`${APPOINTMENT_DETAIL_TEXT.titlePrefix} ${appointment.counterpart.fullName}`}
                </DialogTitle>
                <DialogDescription className="wrap-anywhere">
                  {APPOINTMENT_ROLE_LABELS[appointment.counterpart.role]}
                  {" · "}
                  {appointment.orientationType?.name ?? APPOINTMENTS_TEXT.noTopic}
                </DialogDescription>
                <Badge
                  variant="outline"
                  className={APPOINTMENT_STATUS_CLASSES[appointment.status]}
                >
                  {APPOINTMENT_STATUS_LABELS[appointment.status]}
                </Badge>
              </div>
            </DialogHeader>

            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[7rem_minmax(0,1fr)]">
              <dt className="text-text-secondary">{APPOINTMENT_DETAIL_TEXT.dateLabel}</dt>
              <dd className="font-medium text-ink">
                <time dateTime={appointment.startAt}>
                  {formatAppointmentDate(appointment.startAt)}
                </time>
              </dd>
              <dt className="text-text-secondary">{APPOINTMENT_DETAIL_TEXT.scheduleLabel}</dt>
              <dd className="font-medium text-ink">
                {`${formatBlockRange(appointment.startAt, appointment.endAt)} · ${BOLIVIA_TIME_LABEL}`}
              </dd>
              <dt className="text-text-secondary">{APPOINTMENT_DETAIL_TEXT.topicLabel}</dt>
              <dd className="font-medium wrap-anywhere text-ink">
                {appointment.orientationType?.name ?? APPOINTMENTS_TEXT.noTopic}
              </dd>
              <dt className="text-text-secondary">{APPOINTMENT_DETAIL_TEXT.requestedAtLabel}</dt>
              <dd className="font-medium text-ink">
                <time dateTime={appointment.requestedAt}>
                  {formatAppointmentRequestedAt(appointment.requestedAt)}
                </time>
              </dd>
            </dl>

            <Separator />

            <section className="space-y-2" aria-labelledby="appointment-message-title">
              <h3 id="appointment-message-title" className="text-sm font-semibold text-ink">
                {APPOINTMENT_DETAIL_TEXT.messageTitle}
              </h3>
              {appointment.message ? (
                <p className="rounded-lg bg-surface-soft p-3 text-sm wrap-anywhere whitespace-pre-line text-ink">
                  {appointment.message}
                </p>
              ) : (
                <p className="text-sm text-text-secondary italic">{APPOINTMENT_DETAIL_TEXT.noMessage}</p>
              )}
            </section>

            {appointment.document ? (
              <section className="space-y-2" aria-labelledby="appointment-document-title">
                <h3 id="appointment-document-title" className="text-sm font-semibold text-ink">
                  {APPOINTMENT_DETAIL_TEXT.documentTitle}
                </h3>
                <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                  <span className="flex shrink-0 items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[0.625rem] font-bold text-accent-foreground">
                    <FileText aria-hidden="true" className="size-3" />
                    {getAppointmentDocumentTypeLabel(appointment.document.mimeType)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink" title={appointment.document.fileName}>
                      {appointment.document.fileName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formatFileSize(appointment.document.sizeBytes)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={downloadDocument.isPending}
                    onClick={() =>
                      downloadDocument.mutate({
                        appointmentId: appointment.id,
                        fileName: appointment.document?.fileName ?? "",
                      })
                    }
                  >
                    <Download aria-hidden="true" className="size-4" />
                    {downloadDocument.isPending
                      ? APPOINTMENT_DETAIL_TEXT.downloading
                      : APPOINTMENT_DETAIL_TEXT.download}
                  </Button>
                </div>
              </section>
            ) : null}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                {APPOINTMENT_DETAIL_TEXT.close}
              </DialogClose>
              {appointment.counterpart.role === "mentor" ? (
                <Link
                  href={`/mentors/${appointment.counterpart.id}`}
                  className={buttonVariants()}
                >
                  {APPOINTMENT_DETAIL_TEXT.mentorProfile}
                </Link>
              ) : null}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{APPOINTMENT_DETAIL_TEXT.fallbackTitle}</DialogTitle>
            </DialogHeader>
            {isLoading ? (
              <div role="status" aria-label={APPOINTMENT_DETAIL_TEXT.loading} className="space-y-3">
                <Skeleton aria-hidden="true" className="h-11 w-full rounded-lg" />
                <Skeleton aria-hidden="true" className="h-24 w-full rounded-lg" />
                <Skeleton aria-hidden="true" className="h-16 w-full rounded-lg" />
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
