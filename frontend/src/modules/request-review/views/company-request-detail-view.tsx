"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  Loader2,
  Maximize2,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyRequestDocumentPanel } from "../components/company/company-request-document-panel";
import { CompanyRequestLogoCard } from "../components/company/company-request-logo-card";
import { CompanyRequestLogoModal } from "../components/company/company-request-logo-modal";
import { CompanyRequestMetadataCard } from "../components/company/company-request-metadata-card";
import { CompanyRequestOcrComparison } from "../components/company/company-request-ocr-comparison";
import { CompanyRequestResolutionDialog } from "../components/company/company-request-resolution-dialog";
import { COMPANY_DETAIL_STATUS_CONFIG } from "../constants/company-request.constants";
import { useCompanyRequestDetail } from "../hooks/use-company-request-detail";
import { buildCompanyOcrComparison } from "../utils/build-company-ocr-comparison";

export function CompanyRequestDetailView({ id }: { id: string }) {
  const detail = useCompanyRequestDetail(id);

  if (detail.loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-16 text-text-secondary">
        <Loader2 className="mb-3 size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm font-medium">
          Cargando expediente de la solicitud de empresa...
        </p>
      </div>
    );
  }

  if (!detail.item) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Card className="border-rose-200 bg-rose-50 text-rose-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Error al cargar la solicitud
            </CardTitle>
            <CardDescription className="text-rose-700">
              {detail.error ??
                "La solicitud de empresa no fue encontrada o no existe."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/backoffice/empresas"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-800 hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Volver a la
              bandeja de empresas
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { item } = detail;
  const cityName = item.city.title || item.city.name || "No especificada";
  const comparisonList = buildCompanyOcrComparison(item, cityName);
  const confirmedCount = comparisonList.filter((c) => c.data.matched).length;
  const unconfirmedCount = comparisonList.length - confirmedCount;
  const ocrPercentage =
    item.ocrMatchScore !== null && item.ocrMatchScore !== undefined
      ? item.ocrMatchScore
      : Math.round((confirmedCount / comparisonList.length) * 100);

  const canResolve =
    item.status.title === "PENDING" ||
    item.status.title === "IN_REVIEW" ||
    item.status.title === "OBSERVED";

  const statusConfig = COMPANY_DETAIL_STATUS_CONFIG[item.status.title] ?? {
    label: item.status.title,
    variant: "secondary" as const,
    bgClass: "bg-surface-soft text-ink",
    textClass: "text-primary",
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <header className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
          <Link
            href="/backoffice/empresas"
            className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Volver a la
            bandeja de empresas
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Código de solicitud:</span>
            <span className="rounded-md bg-surface-soft px-2.5 py-1 text-xs font-bold text-ink">
              {item.requestCode ?? "S/C"}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            {detail.logoUrl ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => detail.setShowLogoModal(true)}
                className="group relative h-auto overflow-hidden rounded-xl bg-white p-1.5 shadow-2xs"
                title="Hacer clic para ver el logo en detalle"
                aria-label={`Ampliar logo de ${item.companyName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detail.logoUrl}
                  alt={`Logo de ${item.companyName}`}
                  className="size-16 object-contain"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="size-5 text-white" aria-hidden="true" />
                </span>
              </Button>
            ) : (
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-soft text-primary shadow-2xs"
                title="Logotipo opcional no adjuntado"
              >
                <Building2 className="size-8" aria-hidden="true" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
                  {item.companyName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bgClass}`}
                >
                  <Eye
                    className={`size-3 ${statusConfig.textClass}`}
                    aria-hidden="true"
                  />
                  {statusConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-ink">
                  <ShieldCheck
                    className="size-3.5 text-emerald-600"
                    aria-hidden="true"
                  />
                  {ocrPercentage}% Afinidad OCR
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                <span className="font-medium text-ink">{item.sector}</span> ·{" "}
                {cityName}
                {item.submittedAt && (
                  <span>
                    {" "}
                    · Solicitud enviada el{" "}
                    {new Date(item.submittedAt).toLocaleDateString("es-BO", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>

          {canResolve && (
            <div className="shrink-0 self-start sm:self-center">
              <Button
                type="button"
                variant="institutional"
                onClick={() => {
                  detail.setActiveAction(null);
                  detail.setShowResolutionModal(true);
                }}
              >
                Emitir resolución
              </Button>
            </div>
          )}
        </div>
      </header>

      {detail.error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-xs text-ink shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertCircle className="size-3.5" aria-hidden="true" />
            </div>
            <p className="font-medium text-rose-700 dark:text-rose-400">
              {detail.error}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => detail.setError(null)}
            className="size-6 p-0 text-text-secondary hover:text-ink"
            aria-label="Cerrar error"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      {detail.successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-xs text-ink shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            </div>
            <p className="font-medium text-ink">{detail.successMessage}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => detail.setSuccessMessage(null)}
            className="size-6 p-0 text-text-secondary hover:text-ink"
            aria-label="Cerrar notificación"
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <CompanyRequestDocumentPanel
          requestCode={item.requestCode}
          docUrl={detail.docUrl}
          docIsImage={detail.docIsImage}
          docMimeType={detail.docMimeType}
          docError={detail.docError}
          isRetrying={detail.retryingDoc}
          onRetry={() => void detail.retryDocument()}
        />

        <CompanyRequestOcrComparison
          comparisons={comparisonList}
          ocrPercentage={ocrPercentage}
          confirmedCount={confirmedCount}
          unconfirmedCount={unconfirmedCount}
          reEvaluatingOcr={detail.reEvaluatingOcr}
          submitting={detail.submitting}
          onReEvaluateOcr={() => void detail.handleReEvaluateOcr()}
        />
      </div>

      <section
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        aria-labelledby="section-optional-data"
      >
        <h2 id="section-optional-data" className="sr-only">
          Información adicional y logotipo
        </h2>
        <CompanyRequestLogoCard
          companyName={item.companyName}
          requestCode={item.requestCode}
          logoUrl={detail.logoUrl}
          logoError={detail.logoError}
          logoBg={detail.logoBg}
          isRetrying={detail.retryingLogo}
          onChangeLogoBg={detail.setLogoBg}
          onRetry={() => void detail.retryLogo()}
        />

        <CompanyRequestMetadataCard
          statusLabel={statusConfig.label}
          requestCode={item.requestCode}
          submittedAt={item.submittedAt}
          ocrPercentage={ocrPercentage}
          canResolve={canResolve}
          onOpenResolution={() => {
            detail.setActiveAction(null);
            detail.setShowResolutionModal(true);
          }}
        />
      </section>

      <CompanyRequestResolutionDialog
        open={detail.showResolutionModal}
        onOpenChange={detail.setShowResolutionModal}
        item={item}
        cityName={cityName}
        ocrPercentage={ocrPercentage}
        canResolve={canResolve}
        submitting={detail.submitting}
        activeAction={detail.activeAction}
        onSelectAction={detail.setActiveAction}
        correctionCategory={detail.correctionCategory}
        onChangeCorrectionCategory={detail.setCorrectionCategory}
        correctionDetails={detail.correctionDetails}
        onChangeCorrectionDetails={detail.setCorrectionDetails}
        rejectionCategory={detail.rejectionCategory}
        onChangeRejectionCategory={detail.setRejectionCategory}
        rejectionDetails={detail.rejectionDetails}
        onChangeRejectionDetails={detail.setRejectionDetails}
        onApprove={() => void detail.handleApprove()}
        onCorrection={() => void detail.handleCorrection()}
        onReject={() => void detail.handleReject()}
        isEditingFicha={detail.isEditingFicha}
        isSavingEdit={detail.isSavingEdit}
        isDataModifiedFromInitial={detail.isDataModifiedFromInitial}
        editForm={detail.editForm}
        onChangeEditForm={detail.setEditForm}
        onStartEdit={() => detail.setIsEditingFicha(true)}
        onCancelEdit={() => detail.setIsEditingFicha(false)}
        onSaveEdit={() => void detail.handleSaveEdit()}
        onResetInitialData={() => void detail.handleResetInitialData()}
      />

      {detail.logoUrl && (
        <CompanyRequestLogoModal
          open={detail.showLogoModal}
          onOpenChange={detail.setShowLogoModal}
          companyName={item.companyName}
          requestCode={item.requestCode}
          logoUrl={detail.logoUrl}
          logoBg={detail.logoBg}
          onChangeLogoBg={detail.setLogoBg}
        />
      )}
    </main>
  );
}
