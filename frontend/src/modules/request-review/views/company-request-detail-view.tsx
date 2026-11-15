"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { companyAccessRequestService } from "@/modules/access-request/services/company-access-request.service";
import type { CompanyAccessRequestItem } from "@/modules/access-request/types/company-access-request.types";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export function CompanyRequestDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<CompanyAccessRequestItem | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docIsImage, setDocIsImage] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdDocUrl: string | null = null;
    let createdLogoUrl: string | null = null;

    async function load() {
      const detailRes = await companyAccessRequestService.getDetail(id);
      if (!active) return;

      if (!detailRes.ok) {
        setError(detailRes.message);
        setLoading(false);
        return;
      }
      setItem(detailRes.data);

      const [docBlob, logoBlob] = await Promise.all([
        companyAccessRequestService.getDocumentBlob(id),
        companyAccessRequestService.getLogoBlob(id),
      ]);

      if (!active) return;
      if (docBlob) {
        createdDocUrl = URL.createObjectURL(docBlob);
        setDocIsImage(docBlob.type.startsWith("image/"));
        setDocUrl(createdDocUrl);
      }
      if (logoBlob) {
        createdLogoUrl = URL.createObjectURL(logoBlob);
        setLogoUrl(createdLogoUrl);
      }
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
      if (createdDocUrl) URL.revokeObjectURL(createdDocUrl);
      if (createdLogoUrl) URL.revokeObjectURL(createdLogoUrl);
    };
  }, [id]);

  async function handleApprove() {
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.approve(id);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push("/backoffice/empresas");
  }

  async function handleReject() {
    if (rejectReason.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.reject(
      id,
      rejectReason.trim(),
    );
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push("/backoffice/empresas");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-text-secondary">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Cargando expediente de empresa...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-red-700">
          {error ?? "Solicitud no encontrada"}
        </p>
      </div>
    );
  }

  const ocr = item.ocrFieldResults;
  const matchedCount = [
    ocr?.companyNameMatched,
    ocr?.departmentMatched,
    ocr?.requestIntentMatched,
  ].filter(Boolean).length;

  const canResolve =
    item.status.title === "PENDING" || item.status.title === "IN_REVIEW";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <div className="border-b border-border pb-5">
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <Link
            href="/backoffice/empresas"
            className="inline-flex items-center gap-1.5 font-medium hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Volver a la bandeja
          </Link>
          <span className="font-mono font-semibold">{item.requestCode}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={item.companyName}
                className="size-14 rounded-xl border border-border bg-white object-contain p-1.5"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-xl border border-border bg-surface-soft text-primary">
                <Building2 className="size-7" />
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-primary">
                {item.companyName}
              </h1>
              <p className="mt-0.5 text-sm text-text-secondary">
                {item.sector} · {item.city.name}. Solicitud enviada el{" "}
                {item.submittedAt
                  ? new Date(item.submittedAt).toLocaleString("es-BO")
                  : "—"}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-ink">
            <Eye className="size-3.5 text-primary" />
            {STATUS_BADGE[item.status.title] ?? "Pendiente"}
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0d1b2a] text-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <FileText className="size-4 text-slate-300" />
                <span>
                  carta-solicitud-{item.requestCode}.
                  {docIsImage ? "png" : "pdf"}
                </span>
              </div>
              {docUrl && (
                <a
                  href={docUrl}
                  download={`carta-${item.requestCode}.${docIsImage ? "png" : "pdf"}`}
                  className="rounded-md p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
                  title="Descargar documento"
                >
                  <Download className="size-4" />
                </a>
              )}
            </div>

            <div className="bg-slate-900 p-4">
              {docUrl ? (
                docIsImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={docUrl}
                    alt="Carta membretada de solicitud"
                    className="mx-auto max-h-[560px] rounded bg-white object-contain"
                  />
                ) : (
                  <iframe
                    src={docUrl}
                    title="Carta membretada de solicitud"
                    className="h-[560px] w-full rounded bg-white"
                  />
                )
              ) : (
                <div className="flex h-[560px] items-center justify-center text-sm text-slate-400">
                  No se pudo previsualizar el documento adjunto.
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 px-4 py-2.5 text-xs text-slate-300">
              Documento: Carta formal en hoja membretada
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-ink">
                Contraste de datos
              </h2>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  {matchedCount} coinciden
                </span>
                <span className="inline-flex items-center gap-1 text-text-secondary">
                  <AlertCircle className="size-3.5" />
                  {3 - matchedCount} por verificar
                </span>
              </div>
            </div>

            <div className="mt-3 divide-y divide-border text-xs">
              <div className="grid grid-cols-12 py-2 font-semibold text-text-secondary uppercase">
                <span className="col-span-4">Dato</span>
                <span className="col-span-6">Declarado</span>
                <span className="col-span-2 text-right">OCR</span>
              </div>

              <div className="grid grid-cols-12 items-center py-2.5">
                <span className="col-span-4 font-medium text-text-secondary">
                  Empresa
                </span>
                <span className="col-span-6 font-semibold text-ink">
                  {item.companyName}
                </span>
                <span className="col-span-2 flex justify-end">
                  {ocr?.companyNameMatched ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600" />
                  )}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center py-2.5">
                <span className="col-span-4 font-medium text-text-secondary">
                  Destinatario
                </span>
                <span className="col-span-6 font-semibold text-ink">
                  Ing. Sistemas · UMSS
                </span>
                <span className="col-span-2 flex justify-end">
                  {ocr?.departmentMatched ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600" />
                  )}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center py-2.5">
                <span className="col-span-4 font-medium text-text-secondary">
                  Solicitud
                </span>
                <span className="col-span-6 font-semibold text-ink">
                  Acceso empresarial
                </span>
                <span className="col-span-2 flex justify-end">
                  {ocr?.requestIntentMatched ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600" />
                  )}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center py-2.5">
                <span className="col-span-4 font-medium text-text-secondary">
                  Correo / Telf.
                </span>
                <span className="col-span-8 font-medium text-ink">
                  {item.email} · {item.phone}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center py-2.5">
                <span className="col-span-4 font-medium text-text-secondary">
                  Sitio web
                </span>
                <a
                  href={item.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="col-span-8 truncate font-medium text-primary hover:underline"
                >
                  {item.websiteUrl}
                </a>
              </div>

              <div className="py-2.5">
                <p className="font-medium text-text-secondary">Descripción</p>
                <p className="mt-1 text-ink">{item.description}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-bold text-ink">Dictamen</h2>

            {canResolve ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => void handleApprove()}
                    disabled={submitting}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Check className="mr-1.5 size-4" />
                    Aprobar solicitud
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowReject((prev) => !prev)}
                    disabled={submitting}
                  >
                    <X className="mr-1.5 size-4" />
                    Rechazar
                  </Button>
                </div>

                {showReject && (
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    <Textarea
                      rows={2}
                      placeholder="Escribe el motivo del rechazo (mín. 5 caracteres)..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={
                        submitting || rejectReason.trim().length < 5
                      }
                      onClick={() => void handleReject()}
                    >
                      Confirmar rechazo
                    </Button>
                  </div>
                )}

                <p className="mt-3 text-xs text-text-secondary">
                  Revisa la carta membretada y el contraste de datos antes de
                  emitir el dictamen. Al aprobar se crea la empresa y se genera
                  el código de activación del reclutador.
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-text-secondary">
                Esta solicitud ya fue resuelta (
                {STATUS_BADGE[item.status.title]}).
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-base font-bold text-ink">
              Historial de esta solicitud
            </h2>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-2 rounded-full bg-primary" />
                <div>
                  <p className="font-semibold text-ink">
                    Abierta para revisión
                  </p>
                  <p className="text-text-secondary">
                    Solicitud recibida con código {item.requestCode}.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}