"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RequestAccessHeader } from "../components/request-steps/request-access-header";
import { CompanyDocumentCorrectionForm } from "../components/request-status/company-document-correction-form";
import { CompanyRequestStatusDetails } from "../components/request-status/company-request-status-details";
import { RequestStatusForm } from "../components/request-status/request-status-form";
import {
  COMPANY_CORRECTION_AUTHORIZATION_MESSAGE,
  COMPANY_CORRECTION_SUCCESS_MESSAGE,
} from "../constants/company-request-status.constants";
import { useCompanyCorrectionToken } from "../hooks/use-company-correction-token";
import { useCompanyRequestStatus } from "../hooks/use-company-request-status";
import type { CompanyMyRequestViewProps } from "../types/company-my-request-view-props.types";
import type { CompanyRequestStatusResponse } from "../types/company-request-status.types";
import { getCompanyRequestCodeFromLink } from "../utils/get-company-request-code-from-link";

function CompanyRequestLookup({ requestCode, email }: CompanyMyRequestViewProps) {
  const { request, error, isLoading, lookupRequest } = useCompanyRequestStatus();
  const { token, discardToken } = useCompanyCorrectionToken();
  const [isEditing, setIsEditing] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [authorizationLost, setAuthorizationLost] = useState(false);

  useEffect(() => {
    if (requestCode && email) void lookupRequest(requestCode, email);
  }, [requestCode, email, lookupRequest]);

  const responseMismatch = request !== null && request.requestCode !== requestCode;
  const lookupFailed = error !== null || responseMismatch;
  const visibleRequest = !isLoading && !lookupFailed ? request : null;
  const displayedRequest: CompanyRequestStatusResponse | null =
    visibleRequest && wasSubmitted
      ? { ...visibleRequest, status: "PENDING", reason: null, rejectionReason: null, reviewedAt: null, canResubmit: false }
      : visibleRequest;

  async function handleLookup(typedEmail: string) {
    if (requestCode) await lookupRequest(requestCode, typedEmail);
  }

  function handleAuthorizationLost() {
    discardToken();
    setIsEditing(false);
    setAuthorizationLost(true);
  }

  function handleSubmitted() {
    discardToken();
    setIsEditing(false);
    setWasSubmitted(true);
  }

  return (
    <main data-app-shell="true" className="min-h-dvh bg-background">
      <div className="flex min-h-dvh flex-col">
        <RequestAccessHeader />
        <section className="flex min-w-0 flex-1 flex-col px-4 py-6 md:p-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink 2xl:text-4xl">
              Mi solicitud de empresa
            </h1>

            {!requestCode ? (
              <Alert>
                <AlertTitle>No se pudo abrir la solicitud</AlertTitle>
                <AlertDescription>
                  El enlace está incompleto o no es válido. Usa el botón del correo de revisión.
                </AlertDescription>
              </Alert>
            ) : displayedRequest ? (
              isEditing && token && displayedRequest.canResubmit ? (
                <CompanyDocumentCorrectionForm
                  requestCode={requestCode}
                  token={token}
                  onSubmitted={handleSubmitted}
                  onCancel={() => setIsEditing(false)}
                  onAuthorizationLost={handleAuthorizationLost}
                />
              ) : (
                <>
                  {wasSubmitted ? (
                    <Alert role="status">
                      <AlertTitle>Documento enviado correctamente</AlertTitle>
                      <AlertDescription>{COMPANY_CORRECTION_SUCCESS_MESSAGE}</AlertDescription>
                    </Alert>
                  ) : null}
                  {authorizationLost ? (
                    <Alert className="border-danger/25 bg-surface text-danger">
                      <AlertTitle>No se pudo autorizar la corrección</AlertTitle>
                      <AlertDescription className="text-danger">
                        {COMPANY_CORRECTION_AUTHORIZATION_MESSAGE}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <CompanyRequestStatusDetails
                    request={displayedRequest}
                    onStartCorrection={token ? () => setIsEditing(true) : undefined}
                  />
                </>
              )
            ) : (
              <>
                {!email || lookupFailed ? (
                  <RequestStatusForm isLoading={isLoading} onLookup={handleLookup} />
                ) : null}

                {isLoading ? (
                  <p role="status" className="text-sm text-text-secondary">
                    Consultando tu solicitud...
                  </p>
                ) : null}

                {lookupFailed ? (
                  <Alert className="border-danger/25 bg-surface text-danger">
                    <AlertTitle>No se pudo consultar la solicitud</AlertTitle>
                    <AlertDescription className="text-danger">
                      {error ?? "Revisa el correo e inténtalo de nuevo."}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export function CompanyMyRequestView({ requestCode = null, email = null }: CompanyMyRequestViewProps = {}) {
  const code = getCompanyRequestCodeFromLink(requestCode);

  return (
    <CompanyRequestLookup
      key={`${code ?? "invalid-link"}:${email ?? ""}`}
      requestCode={code}
      email={email}
    />
  );
}
