"use client";

import { useState } from "react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { RequestAccessHeader } from "../components/request-steps/request-access-header";
import { RequestAccessShell } from "../components/request-steps/request-access-shell";
import { RequestStatusDetails } from "../components/request-status/request-status-details";
import { RequestStatusForm } from "../components/request-status/request-status-form";
import { DocumentCorrectionForm } from "../components/request-status/document-correction-form";
import { useDocumentCorrectionGrant } from "../hooks/use-document-correction-grant";
import type { RequestStatusResponse } from "../types/access-request.types";
import type { DocumentCorrectionResponse } from "../types/document-correction.types";
import { useRequestStatus } from "../hooks/use-request-status";
import type { MyRequestViewProps } from "../types/my-request-view-props.types";
import { getRequestCodeFromLink } from "../utils/get-request-code-from-link";

function RequestStatusLookup({ requestCode }: MyRequestViewProps) {
  const { request: queriedRequest, error, isLoading, lookupRequest } = useRequestStatus();
  const { token, clearConfirmedToken } = useDocumentCorrectionGrant();
  const [editingGrant, setEditingGrant] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<RequestStatusResponse | null>(null);
  const request = submittedRequest ?? queriedRequest;
  const responseMismatch =
    request !== null && request.requestCode !== requestCode;
  const lookupFailed = error !== null || responseMismatch;
  const visibleRequest =
    !isLoading && !lookupFailed ? request : null;
  const showReviewHeading =
    visibleRequest === null || visibleRequest.status === "rejected";

  async function handleLookup(email: string) {
    if (requestCode) {
      await lookupRequest(requestCode, email);
    }
  }

  function handleCorrectionSubmitted(response: DocumentCorrectionResponse) {
    if (!visibleRequest || response.requestCode !== requestCode || response.status !== "pending") return;
    setSubmittedRequest({
      requestCode: response.requestCode,
      status: "pending",
      submittedAt: visibleRequest.submittedAt,
      reviewedAt: null,
      rejectionReason: null,
      document: null,
    });
    setEditingGrant(null);
    if (editingGrant) clearConfirmedToken(editingGrant);
  }

  return (
    <main data-app-shell="true" className="min-h-screen bg-background">
      <RequestAccessShell
        currentStep={3}
        header={<RequestAccessHeader />}
      >
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-2">
            {showReviewHeading ? (
              <p className="text-sm text-text-secondary">
                Solicitud de acceso
                <span aria-hidden="true"> / </span>
                <span className="font-semibold text-ink">
                  Revisión de la carrera
                </span>
              </p>
            ) : null}

            <h1 className="text-3xl font-extrabold tracking-tight text-ink 2xl:text-4xl">
              {showReviewHeading
                ? "Revisión de la carrera"
                : "Mi solicitud"}
            </h1>
          </div>

          {!requestCode ? (
            <Alert>
              <AlertTitle>No se pudo abrir la solicitud</AlertTitle>
              <AlertDescription>
                El enlace está incompleto o no es válido. Usa el botón
                «Mi solicitud» del correo de revisión.
              </AlertDescription>
            </Alert>
          ) : visibleRequest ? (
            editingGrant !== null && editingGrant === token && visibleRequest.status === "rejected" ? (
              <DocumentCorrectionForm
                requestCode={visibleRequest.requestCode}
                token={editingGrant}
                initialDocumentType={visibleRequest.document?.type}
                onSubmitted={handleCorrectionSubmitted}
                onCancel={() => setEditingGrant(null)}
              />
            ) : (
              <>
                {submittedRequest ? (
                  <Alert role="status">
                    <AlertTitle>Documento enviado correctamente</AlertTitle>
                    <AlertDescription>Tu solicitud está pendiente de una nueva revisión.</AlertDescription>
                  </Alert>
                ) : null}
                <RequestStatusDetails
                  {...visibleRequest}
                  onStartCorrection={visibleRequest.status === "rejected" && token ? () => setEditingGrant(token) : undefined}
                />
                {visibleRequest.status === "rejected" && !token ? (
                  <p className="text-sm text-text-secondary">
                    Para corregir el documento, abre el enlace de tu correo de revisión.
                  </p>
                ) : null}
              </>
            )
          ) : (
            <>
              <RequestStatusForm
                isLoading={isLoading}
                onLookup={handleLookup}
              />

              {isLoading ? (
                <p role="status" className="text-sm text-text-secondary">
                  Consultando tu solicitud...
                </p>
              ) : null}

              {lookupFailed ? (
                <Alert className="border-danger/25 bg-surface text-danger">
                  <AlertTitle>No se pudo consultar la solicitud</AlertTitle>
                  <AlertDescription className="text-danger">
                    Revisa el correo e inténtalo de nuevo.
                  </AlertDescription>
                </Alert>
              ) : null}
            </>
          )}
        </div>
      </RequestAccessShell>
    </main>
  );
}

export function MyRequestView({
  requestCode = null,
}: MyRequestViewProps = {}) {
  const code = getRequestCodeFromLink(requestCode);

  // Al cambiar de enlace se descartan correo, errores y datos de la solicitud anterior.
  return (
    <RequestStatusLookup
      key={code ?? "invalid-link"}
      requestCode={code}
    />
  );
}
