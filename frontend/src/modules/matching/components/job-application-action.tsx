"use client";

import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JOB_APPLICATION_MESSAGES } from "../constants/job-application.constants";
import { useJobApplication } from "../hooks/use-job-application";
import type { JobApplicationActionProps } from "../types/job-application-action-props.types";
import { formatApplicationDate } from "../utils/format-application-date";

export function JobApplicationAction({
  jobOfferId,
}: JobApplicationActionProps) {
  const {
    myApplication,
    isLoading,
    apply,
    isApplying,
    applyError,
    submittedApplication,
    resetSubmission,
  } = useJobApplication(jobOfferId);

  const application = myApplication?.application ?? null;
  const [consentJobId, setConsentJobId] = useState<string | null>(null);
  const [consentCv, setConsentCv] = useState(false);
  const [consentRadar, setConsentRadar] = useState(false);
  const [consentContact, setConsentContact] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      {application ? (
        <>
          <Button size="sm" variant="secondary" disabled>
            <CircleCheck className="size-4" aria-hidden="true" />
            {JOB_APPLICATION_MESSAGES.alreadyApplied}
          </Button>
          <p className="flex items-center gap-2 text-xs text-text-secondary">
            {JOB_APPLICATION_MESSAGES.appliedOn}{" "}
            {formatApplicationDate(application.appliedAt)} ·
            <Badge variant="outline">{application.status}</Badge>
          </p>
        </>
      ) : (
        <Button
          size="sm"
          onClick={() => {
            setConsentCv(false);
            setConsentRadar(false);
            setConsentContact(false);
            setConsentJobId(jobOfferId);
          }}
          disabled={isLoading || isApplying}
        >
          {isApplying
            ? JOB_APPLICATION_MESSAGES.applying
            : JOB_APPLICATION_MESSAGES.apply}
        </Button>
      )}

      {applyError && consentJobId !== jobOfferId && (
        <p role="alert" className="text-xs text-destructive">
          {JOB_APPLICATION_MESSAGES.applyError}
        </p>
      )}

      <Dialog
        open={consentJobId === jobOfferId && !application}
        onOpenChange={(open) => {
          if (!open) setConsentJobId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Autoriza la revisión de tu postulación</DialogTitle>
            <DialogDescription>
              La empresa de esta vacante necesita tu autorización para revisar
              tu CV actual, tu radar publicado y tu información de contacto.
              Marca las tres casillas para enviar la postulación.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={consentCv}
              disabled={isApplying}
              onCheckedChange={(checked) => setConsentCv(checked === true)}
            />
            Permito que los reclutadores de esta empresa revisen mi CV actual.
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={consentRadar}
              disabled={isApplying}
              onCheckedChange={(checked) => setConsentRadar(checked === true)}
            />
            Permito que los reclutadores de esta empresa revisen mi radar de
            afinidad publicado.
          </label>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={consentContact}
              disabled={isApplying}
              onCheckedChange={(checked) => setConsentContact(checked === true)}
            />
            Permito que los reclutadores de esta empresa vean mi información de
            contacto (correo electrónico y teléfono).
          </label>
          {applyError && (
            <p role="alert" className="text-sm text-destructive">
              {JOB_APPLICATION_MESSAGES.applyError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isApplying}
              onClick={() => setConsentJobId(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={
                !consentCv || !consentRadar || !consentContact || isApplying
              }
              onClick={() =>
                apply({ consent: consentRadar, consentCv, consentContact })
              }
            >
              {isApplying
                ? JOB_APPLICATION_MESSAGES.applying
                : "Confirmar postulación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={submittedApplication !== null}
        onOpenChange={(isOpen) => !isOpen && resetSubmission()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <CircleCheck className="size-6 text-ink" aria-hidden="true" />
            <DialogTitle>{JOB_APPLICATION_MESSAGES.successTitle}</DialogTitle>
            <DialogDescription>
              {JOB_APPLICATION_MESSAGES.successDescription}
            </DialogDescription>
          </DialogHeader>

          {submittedApplication && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-lg border border-border bg-surface-soft p-4 text-sm">
              <dt className="text-text-secondary">
                {JOB_APPLICATION_MESSAGES.summaryJob}
              </dt>
              <dd className="font-semibold text-ink">
                {submittedApplication.jobTitle}
              </dd>
              <dt className="text-text-secondary">
                {JOB_APPLICATION_MESSAGES.summaryCompany}
              </dt>
              <dd className="font-semibold text-ink">
                {submittedApplication.companyName}
              </dd>
              <dt className="text-text-secondary">
                {JOB_APPLICATION_MESSAGES.summaryDate}
              </dt>
              <dd className="font-semibold text-ink">
                {formatApplicationDate(submittedApplication.appliedAt)}
              </dd>
              <dt className="text-text-secondary">
                {JOB_APPLICATION_MESSAGES.summaryStatus}
              </dt>
              <dd>
                <Badge variant="outline">{submittedApplication.status}</Badge>
              </dd>
            </dl>
          )}

          <DialogFooter>
            <Button onClick={() => resetSubmission()}>
              {JOB_APPLICATION_MESSAGES.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
