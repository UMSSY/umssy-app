'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  ImageIcon,
  Loader2,
  Maximize2,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { companyAccessRequestService } from '@/modules/access-request/services/company-access-request.service';
import type { CompanyAccessRequestItem } from '@/modules/access-request/types/company-access-request.types';
import { DocumentViewer } from '../components/detail/document-viewer';

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    bgClass: string;
    textClass: string;
  }
> = {
  PENDING: {
    label: 'Pendiente',
    variant: 'secondary',
    bgClass:
      'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    textClass: 'text-amber-600',
  },
  IN_REVIEW: {
    label: 'En revisión',
    variant: 'outline',
    bgClass:
      'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
    textClass: 'text-blue-600',
  },
  APPROVED: {
    label: 'Aprobada',
    variant: 'default',
    bgClass:
      'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    textClass: 'text-emerald-600',
  },
  REJECTED: {
    label: 'Rechazada',
    variant: 'destructive',
    bgClass:
      'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400',
    textClass: 'text-rose-600',
  },
};

export function CompanyRequestDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<CompanyAccessRequestItem | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docIsImage, setDocIsImage] = useState(false);
  const [docMimeType, setDocMimeType] = useState('application/pdf');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoBg, setLogoBg] = useState<'light' | 'dark' | 'checkered'>('light');
  const [rejectReason, setRejectReason] = useState('');
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
        const isImg = docBlob.type.startsWith('image/');
        setDocIsImage(isImg);
        setDocMimeType(
          docBlob.type || (isImg ? 'image/png' : 'application/pdf'),
        );
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
    setShowApproveDialog(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push('/backoffice/empresas');
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
    setShowRejectDialog(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.push('/backoffice/empresas');
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-16 text-text-secondary">
        <Loader2 className="mb-3 size-8 animate-spin text-primary" />
        <p className="text-sm font-medium">
          Cargando expediente de la solicitud de empresa...
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Card className="border-rose-200 bg-rose-50 text-rose-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Error al cargar la solicitud
            </CardTitle>
            <CardDescription className="text-rose-700">
              {error ??
                'La solicitud de empresa no fue encontrada o no existe.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/backoffice/empresas"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-800 hover:underline"
            >
              <ArrowLeft className="size-4" /> Volver a la bandeja de empresas
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const ocr = item.ocrFieldResults;
  const matchedCount = [
    ocr?.companyNameMatched,
    ocr?.departmentMatched,
    ocr?.requestIntentMatched,
  ].filter(Boolean).length;

  // Calculamos el score OCR en porcentaje (%)
  const ocrPercentage =
    item.ocrMatchScore !== null && item.ocrMatchScore !== undefined
      ? item.ocrMatchScore
      : Math.round((matchedCount / 3) * 100);

  const canResolve =
    item.status.title === 'PENDING' || item.status.title === 'IN_REVIEW';

  const statusConfig = STATUS_CONFIG[item.status.title] ?? {
    label: item.status.title,
    variant: 'secondary' as const,
    bgClass: 'bg-surface-soft text-ink',
    textClass: 'text-primary',
  };

  const formattedWebsite = item.websiteUrl?.trim();
  const safeWebUrl = formattedWebsite
    ? formattedWebsite.startsWith('http://') ||
      formattedWebsite.startsWith('https://')
      ? formattedWebsite
      : `https://${formattedWebsite}`
    : null;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* ─── Encabezado principal y navegación ─── */}
      <header className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
          <Link
            href="/backoffice/empresas"
            className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" /> Volver a la bandeja de empresas
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Código de solicitud:</span>
            <span className="rounded-md bg-surface-soft px-2.5 py-1 font-mono text-xs font-bold text-ink">
              {item.requestCode ?? 'S/C'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <div
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-2xs transition-transform hover:scale-105"
                onClick={() => setShowLogoModal(true)}
                title="Hacer clic para ver el logo en detalle"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={`Logo de ${item.companyName}`}
                  className="size-16 object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="size-5 text-white" />
                </div>
              </div>
            ) : (
              <div
                className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-soft text-primary shadow-2xs"
                title="Logotipo opcional no adjuntado"
              >
                <Building2 className="size-8" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
                  {item.companyName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${statusConfig.bgClass}`}
                >
                  <Eye className={`size-3.5 ${statusConfig.textClass}`} />
                  {statusConfig.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                <span className="font-medium text-ink">{item.sector}</span> ·{' '}
                {item.city.name}
                {item.submittedAt && (
                  <span>
                    {' '}
                    · Solicitud enviada el{' '}
                    {new Date(item.submittedAt).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Acciones principales de dictamen en el encabezado */}
          {canResolve && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => setShowApproveDialog(true)}
                disabled={submitting}
                className="bg-primary font-medium text-white shadow-xs hover:bg-primary/90"
              >
                <Check className="mr-1.5 size-4" /> Aprobar solicitud
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={submitting}
                className="border-border font-medium hover:bg-surface-soft"
              >
                <X className="mr-1.5 size-4 text-destructive" /> Rechazar
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Alerta de error global si aplica */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <AlertCircle className="size-5 shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. SECCIÓN SUPERIOR: DOCUMENTO DE RESPALDO (CARTA MEMBRETADA)
          Colocado en la parte superior, amplio y legible
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="section-document">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <h2 id="section-document" className="text-lg font-bold text-ink">
              Documento de Respaldo Oficial (Carta Membretada)
            </h2>
          </div>
          {docUrl && (
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <ExternalLink className="size-3.5" /> Abrir documento en nueva
              pestaña
            </a>
          )}
        </div>

        <Card className="overflow-hidden border-border bg-surface shadow-xs">
          <CardContent className="p-0">
            {docUrl ? (
              <DocumentViewer
                url={docUrl}
                mimeType={docMimeType}
                fileName={`carta-solicitud-${item.requestCode ?? 'doc'}.${docIsImage ? 'png' : 'pdf'}`}
                caption="Carta formal con membrete y sello presentada para la solicitud de acceso institucional a UMSSY."
              />
            ) : (
              <div className="flex h-96 flex-col items-center justify-center p-8 text-center text-text-secondary">
                <FileText className="mb-2 size-12 text-slate-300" />
                <p className="text-sm font-medium">
                  No se pudo cargar la vista previa del documento adjunto.
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  El archivo podría estar en procesamiento o no encontrarse
                  disponible.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. SECCIÓN INFERIOR: CONTRASTE PROFESIONAL Y VALIDACIÓN OCR
          Colocado debajo del documento para cotejar datos declarados vs documento
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-6" aria-labelledby="section-contrast">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 id="section-contrast" className="text-lg font-bold text-ink">
              Contraste de Datos y Verificación OCR
            </h2>
            <p className="text-xs text-text-secondary">
              Cotejo minucioso entre la información declarada en el formulario y
              el contenido extraído del documento adjunto.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              {matchedCount} criterios confirmados
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <AlertCircle className="size-4" />
              {3 - matchedCount} por verificar
            </span>
          </div>
        </div>

        {/* Tarjeta de métricas del Score OCR */}
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <CardTitle className="text-base font-bold text-ink">
                  Porcentaje de Coincidencia OCR
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-ink">
                  {ocrPercentage}%
                </span>
                <Badge
                  variant={
                    ocrPercentage >= 70
                      ? 'default'
                      : ocrPercentage >= 40
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="font-semibold"
                >
                  {ocrPercentage >= 70
                    ? 'Alta Coincidencia'
                    : ocrPercentage >= 40
                      ? 'Coincidencia Media'
                      : 'Baja Coincidencia'}
                </Badge>
              </div>
            </div>
            <CardDescription className="text-xs text-text-secondary">
              Nivel de certidumbre basado en el análisis del texto extraído de
              la carta membretada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full">
              <Progress value={ocrPercentage} className="h-2.5" />
            </div>

            {/* Píldoras de verificación desglosadas */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                  ocr?.companyNameMatched
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'
                }`}
              >
                {ocr?.companyNameMatched ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="font-semibold">Nombre de la Empresa</p>
                  <p className="mt-0.5 text-text-secondary">
                    {ocr?.companyNameMatched
                      ? 'Identificado en el texto de la carta'
                      : 'No identificado en el documento'}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                  ocr?.departmentMatched
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'
                }`}
              >
                {ocr?.departmentMatched ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="font-semibold">Destinatario / Carrera</p>
                  <p className="mt-0.5 text-text-secondary">
                    {ocr?.departmentMatched
                      ? 'Menciona Sistemas / Informática / UMSS'
                      : 'Sin mención explícita a la carrera'}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                  ocr?.requestIntentMatched
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300'
                }`}
              >
                {ocr?.requestIntentMatched ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="font-semibold">Intención de la Solicitud</p>
                  <p className="mt-0.5 text-text-secondary">
                    {ocr?.requestIntentMatched
                      ? 'Petición explícita de acceso detectada'
                      : 'Petición no identificada con claridad'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla comparativa estructurada */}
        <Card className="overflow-hidden border-border bg-surface shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base font-bold text-ink">
              Tabla Comparativa de Información
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Detalle de cada atributo registrado frente a la validación en el
              documento adjunto.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-surface-soft">
                <TableRow>
                  <TableHead className="w-1/4 font-semibold text-text-secondary">
                    Campo
                  </TableHead>
                  <TableHead className="w-1/3 font-semibold text-text-secondary">
                    Dato Declarado
                  </TableHead>
                  <TableHead className="w-1/3 font-semibold text-text-secondary">
                    Evidencia en Documento (OCR)
                  </TableHead>
                  <TableHead className="w-28 text-right font-semibold text-text-secondary">
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* 1. Razón Social */}
                <TableRow>
                  <TableCell className="font-medium text-ink">
                    Razón Social / Empresa
                  </TableCell>
                  <TableCell className="font-semibold text-ink">
                    {item.companyName}
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    {ocr?.companyNameMatched ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Coincidencia exacta o parcial detectada en la carta
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">
                        No se identificó el nombre en el texto extraído
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {ocr?.companyNameMatched ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" /> Coincide
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertCircle className="size-3.5" /> Revisar
                      </span>
                    )}
                  </TableCell>
                </TableRow>

                {/* 2. Destinatario */}
                <TableRow>
                  <TableCell className="font-medium text-ink">
                    Destinatario Institucional
                  </TableCell>
                  <TableCell className="text-ink">
                    Ing. Sistemas / Informática · UMSS
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    {ocr?.departmentMatched ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Referencia institucional formal identificada
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">
                        Sin mención clara a la carrera o universidad
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {ocr?.departmentMatched ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" /> Coincide
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertCircle className="size-3.5" /> Revisar
                      </span>
                    )}
                  </TableCell>
                </TableRow>

                {/* 3. Propósito */}
                <TableRow>
                  <TableCell className="font-medium text-ink">
                    Intención de Solicitud
                  </TableCell>
                  <TableCell className="text-ink">
                    Acceso y registro de cuenta empresarial
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    {ocr?.requestIntentMatched ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Palabras clave de solicitud formal reconocidas
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400">
                        Vocabulario de solicitud no reconocido
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {ocr?.requestIntentMatched ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" /> Coincide
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                        <AlertCircle className="size-3.5" /> Revisar
                      </span>
                    )}
                  </TableCell>
                </TableRow>

                {/* 4. Rubro y Ciudad */}
                <TableRow>
                  <TableCell className="font-medium text-ink">
                    Rubro y Ubicación
                  </TableCell>
                  <TableCell className="text-ink">
                    {item.sector} · {item.city.name}
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    Dato declarativo en registro
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-soft px-2 py-0.5 text-xs font-medium text-ink">
                      Declarado
                    </span>
                  </TableCell>
                </TableRow>

                {/* 5. Contacto corporativo */}
                <TableRow>
                  <TableCell className="font-medium text-ink">
                    Correo y Teléfono
                  </TableCell>
                  <TableCell className="text-ink">
                    {item.email} · {item.phone}
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    Canal corporativo de contacto
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-soft px-2 py-0.5 text-xs font-medium text-ink">
                      Declarado
                    </span>
                  </TableCell>
                </TableRow>

                {/* 6. Usuario inicial */}
                <TableRow>
                  <TableCell className="font-medium text-ink">
                    Usuario Reclutador
                  </TableCell>
                  <TableCell className="font-mono text-ink">
                    @{item.username}
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary">
                    Cuenta administrativa a crear
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-soft px-2 py-0.5 text-xs font-medium text-ink">
                      Pendiente
                    </span>
                  </TableCell>
                </TableRow>

                {/* 7. Descripción */}
                <TableRow>
                  <TableCell className="font-medium text-ink">
                    Descripción Institucional
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className="text-xs leading-relaxed text-ink"
                  >
                    {item.description}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. SECCIÓN DE DATOS OPCIONALES: LOGOTIPO CORPORATIVO Y SITIO WEB
          Inspección detallada del logo y redirección con prueba de portal web
          ───────────────────────────────────────────────────────────────────────────── */}
      <section
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        aria-labelledby="section-optional-data"
      >
        {/* Card: Logotipo Corporativo Detallado */}
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-5 text-primary" />
                <CardTitle className="text-base font-bold text-ink">
                  Logotipo Corporativo
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {logoUrl ? 'Adjuntado' : 'Opcional (No adjunto)'}
              </Badge>
            </div>
            <CardDescription className="text-xs text-text-secondary">
              Inspección visual del logotipo que representará a la empresa en la
              plataforma.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {logoUrl ? (
              <div className="space-y-4">
                <div
                  className={`flex h-44 items-center justify-center rounded-xl border border-border p-4 transition-colors ${
                    logoBg === 'light'
                      ? 'bg-white'
                      : logoBg === 'dark'
                        ? 'bg-slate-900'
                        : 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:12px_12px]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={`Logo de ${item.companyName}`}
                    className="max-h-36 max-w-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-xs text-text-secondary">
                    <span>Fondo:</span>
                    <Button
                      type="button"
                      variant={logoBg === 'light' ? 'secondary' : 'ghost'}
                      size="xs"
                      onClick={() => setLogoBg('light')}
                    >
                      Claro
                    </Button>
                    <Button
                      type="button"
                      variant={logoBg === 'dark' ? 'secondary' : 'ghost'}
                      size="xs"
                      onClick={() => setLogoBg('dark')}
                    >
                      Oscuro
                    </Button>
                    <Button
                      type="button"
                      variant={logoBg === 'checkered' ? 'secondary' : 'ghost'}
                      size="xs"
                      onClick={() => setLogoBg('checkered')}
                    >
                      Malla
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLogoModal(true)}
                      className="gap-1.5 text-xs"
                    >
                      <Maximize2 className="size-3.5" /> Ver en tamaño completo
                    </Button>
                    <a
                      href={logoUrl}
                      download={`logo-${item.requestCode ?? 'empresa'}.png`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-soft"
                    >
                      <Download className="size-3.5" /> Descargar
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-soft/50 p-6 text-center text-text-secondary">
                <Building2 className="mb-2 size-8 text-text-secondary/60" />
                <p className="text-sm font-semibold text-ink">
                  Sin logotipo adjuntado
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  La empresa no subió un logo durante su registro. Este dato es
                  opcional y podrá cargarlo posteriormente en su perfil.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Sitio Web Corporativo con Redirección */}
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-primary" />
                <CardTitle className="text-base font-bold text-ink">
                  Sitio Web Corporativo
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {safeWebUrl ? 'Especificado' : 'Opcional (No especificado)'}
              </Badge>
            </div>
            <CardDescription className="text-xs text-text-secondary">
              Verificación del portal oficial de la empresa para comprobar su
              existencia en línea.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {safeWebUrl ? (
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface-soft/40 p-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-text-secondary">
                    URL declarada:
                  </span>
                  <p className="truncate font-mono text-sm font-semibold text-primary">
                    {item.websiteUrl}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Haz clic en el botón inferior para abrir la página en una
                    nueva pestaña y verificar si responde correctamente.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href={safeWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary/90"
                  >
                    <ExternalLink className="size-4" />
                    Probar y abrir sitio web en otra ventana
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-soft/50 p-6 text-center text-text-secondary">
                <Globe className="mb-2 size-8 text-text-secondary/60" />
                <p className="text-sm font-semibold text-ink">
                  Sin dirección web registrada
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  No se proporcionó un enlace web durante el registro. Este dato
                  es opcional y no impide la aprobación del acceso.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. HISTORIAL Y SECCIÓN DE AUDITORÍA
          ───────────────────────────────────────────────────────────────────────────── */}
      <Card className="border-border bg-surface shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <CardTitle className="text-base font-bold text-ink">
              Historial del Trámite
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-soft/30 p-3">
              <span className="mt-0.5 size-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="font-semibold text-ink">Solicitud ingresada</p>
                <p className="text-text-secondary">
                  Generada con el código{' '}
                  <span className="font-mono font-medium text-ink">
                    {item.requestCode}
                  </span>{' '}
                  para la empresa {item.companyName}.
                </p>
              </div>
              {item.submittedAt && (
                <span className="text-text-secondary">
                  {new Date(item.submittedAt).toLocaleDateString('es-BO')}
                </span>
              )}
            </div>

            {item.reviewedAt && (
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-soft/30 p-3">
                <span
                  className={`mt-0.5 size-2 rounded-full ${
                    item.status.title === 'APPROVED'
                      ? 'bg-emerald-600'
                      : 'bg-rose-600'
                  }`}
                />
                <div className="flex-1">
                  <p className="font-semibold text-ink">
                    Dictamen emitido:{' '}
                    {STATUS_CONFIG[item.status.title]?.label ??
                      item.status.title}
                  </p>
                  {item.rejectionReason && (
                    <p className="mt-1 font-medium text-rose-700 dark:text-rose-400">
                      Motivo de observación: {item.rejectionReason}
                    </p>
                  )}
                </div>
                <span className="text-text-secondary">
                  {new Date(item.reviewedAt).toLocaleDateString('es-BO')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: APROBACIÓN DE SOLICITUD
          ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-ink">
              <CheckCircle2 className="size-5 text-emerald-600" />
              Aprobar Solicitud de Empresa
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Estás por dictaminar favorablemente la solicitud de{' '}
              <strong className="text-ink">{item.companyName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-text-secondary">
              Al confirmar la aprobación, el sistema ejecutará automáticamente:
            </p>
            <ul className="space-y-2 rounded-lg bg-surface-soft p-3">
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 text-emerald-600" />
                Creación del registro de empresa y su perfil oficial.
              </li>
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 text-emerald-600" />
                Creación del usuario reclutador asociado (@{item.username}).
              </li>
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 text-emerald-600" />
                Generación del código OTP de activación temporal (24h).
              </li>
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 text-emerald-600" />
                Envío de correo con código y enlace a{' '}
                <span className="font-semibold text-primary">{item.email}</span>
                .
              </li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleApprove()}
              disabled={submitting}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Aprobando...
                </>
              ) : (
                'Confirmar Aprobación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: RECHAZO DE SOLICITUD
          ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
              <XCircle className="size-5 text-destructive" />
              Rechazar Solicitud de Empresa
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Ingresa el motivo fundamentado del rechazo. Este mensaje será
              notificado por correo a{' '}
              <strong className="text-ink">{item.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label
              htmlFor="reject-reason"
              className="text-xs font-semibold text-ink"
            >
              Motivo del rechazo <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="reject-reason"
              rows={4}
              placeholder="Explica qué requisito no se cumplió o qué corrección debe realizar la empresa en su carta membretada..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-text-secondary">
              Mínimo 5 caracteres ({rejectReason.trim().length} ingresados).
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleReject()}
              disabled={submitting || rejectReason.trim().length < 5}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Rechazando...
                </>
              ) : (
                'Confirmar Rechazo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: INSPECCIÓN DE LOGOTIPO EN TAMAÑO COMPLETO
          ───────────────────────────────────────────────────────────────────────────── */}
      {logoUrl && (
        <Dialog open={showLogoModal} onOpenChange={setShowLogoModal}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-ink">
                Logotipo Corporativo: {item.companyName}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                Previsualización en resolución completa del archivo suministrado
                en el registro.
              </DialogDescription>
            </DialogHeader>

            <div className="flex max-h-[460px] items-center justify-center overflow-auto rounded-xl border border-border bg-slate-900/5 p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`Logotipo completo de ${item.companyName}`}
                className="max-h-[380px] max-w-full rounded object-contain"
              />
            </div>

            <DialogFooter className="flex-row items-center justify-between sm:justify-between">
              <a
                href={logoUrl}
                download={`logo-${item.requestCode ?? 'empresa'}.png`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
              >
                <Download className="size-3.5" /> Descargar archivo
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLogoModal(false)}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
