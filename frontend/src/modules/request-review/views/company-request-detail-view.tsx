'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Maximize2,
  Pencil,
  Phone,
  RotateCcw,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { companyAccessRequestService } from '@/modules/access-requests/services/company-access-request.service';
import type {
  CompanyAccessRequestItem,
  CompanyOcrFieldDetail,
  UpdateCompanyPayload,
} from '@/modules/access-requests/types/company-access-request.types';
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
      'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    textClass: 'text-slate-600',
  },
  IN_REVIEW: {
    label: 'En revisión',
    variant: 'outline',
    bgClass:
      'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
    textClass: 'text-blue-600',
  },
  OBSERVED: {
    label: 'Subsanación solicitada',
    variant: 'secondary',
    bgClass:
      'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    textClass: 'text-rose-600',
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

const CORRECTION_REASONS = [
  'Carta membretada sin firma o sello institucional',
  'Discrepancia entre la razón social declarada y el documento',
  'Falta información de contacto corporativo verificable',
  'Documento ilegible, incompleto o de baja resolución',
  'Otro motivo de observación',
];

const REJECTION_REASONS = [
  'Empresa no verificable o inexistente',
  'Documentación no auténtica o con inconsistencias graves',
  'Actividad o rubro incompatible con las políticas universitarias',
  'Reincidencia en envío de datos apócrifos',
  'Otro motivo de rechazo',
];

export function CompanyRequestDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [item, setItem] = useState<CompanyAccessRequestItem | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docIsImage, setDocIsImage] = useState(false);
  const [docMimeType, setDocMimeType] = useState('application/pdf');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [activeAction, setActiveAction] = useState<
    'APPROVE' | 'CORRECTION' | 'REJECT' | null
  >(null);

  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoBg, setLogoBg] = useState<'light' | 'dark' | 'checkered'>('light');

  const [correctionCategory, setCorrectionCategory] = useState(
    CORRECTION_REASONS[0],
  );
  const [correctionDetails, setCorrectionDetails] = useState('');

  const [rejectionCategory, setRejectionCategory] = useState(
    REJECTION_REASONS[0],
  );
  const [rejectionDetails, setRejectionDetails] = useState('');

  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [editForm, setEditForm] = useState<UpdateCompanyPayload>({});
  const [initialSnapshot, setInitialSnapshot] =
    useState<UpdateCompanyPayload | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [reEvaluatingOcr, setReEvaluatingOcr] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

      const formPayload: UpdateCompanyPayload = {
        companyName: detailRes.data.companyName,
        sector: detailRes.data.sector,
        description: detailRes.data.description,
        email: detailRes.data.email,
        phone: detailRes.data.phone,
        websiteUrl: detailRes.data.websiteUrl ?? '',
        username: detailRes.data.username,
      };

      setEditForm(formPayload);
      setInitialSnapshot((prev) => prev ?? { ...formPayload });

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
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setShowResolutionModal(false);
    router.push('/backoffice/empresas');
  }

  async function handleCorrection() {
    if (correctionDetails.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.requestCorrection(id, {
      reasonCategory: correctionCategory,
      customDetails: correctionDetails.trim(),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setActiveAction(null);
    setShowResolutionModal(false);
    setSuccessMessage(
      'Se ha notificado a la empresa la solicitud de subsanación por correo electrónico.',
    );
    const refreshed = await companyAccessRequestService.getDetail(id);
    if (refreshed.ok) setItem(refreshed.data);
  }

  async function handleReject() {
    if (rejectionDetails.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.reject(id, {
      reasonCategory: rejectionCategory,
      customDetails: rejectionDetails.trim(),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setShowResolutionModal(false);
    router.push('/backoffice/empresas');
  }

  async function handleSaveEdit() {
    setIsSavingEdit(true);
    setError(null);
    const res = await companyAccessRequestService.updateDraft(id, editForm);
    setIsSavingEdit(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setIsEditingFicha(false);
    setSuccessMessage(
      'Ficha oficial actualizada y contraste OCR recalculado exitosamente.',
    );
    const refreshed = await companyAccessRequestService.getDetail(id);
    if (refreshed.ok) {
      setItem(refreshed.data);
      setEditForm({
        companyName: refreshed.data.companyName,
        sector: refreshed.data.sector,
        description: refreshed.data.description,
        email: refreshed.data.email,
        phone: refreshed.data.phone,
        websiteUrl: refreshed.data.websiteUrl ?? '',
        username: refreshed.data.username,
      });
    }
  }

  async function handleResetInitialData() {
    if (!initialSnapshot) return;
    const initial = initialSnapshot;
    setEditForm({ ...initial });

    const isDifferentFromSaved =
      item?.companyName !== initial.companyName ||
      item?.sector !== initial.sector ||
      item?.email !== initial.email ||
      item?.phone !== initial.phone ||
      (item?.websiteUrl ?? '') !== (initial.websiteUrl ?? '') ||
      item?.description !== initial.description ||
      item?.username !== initial.username;

    if (isDifferentFromSaved) {
      setIsSavingEdit(true);
      setError(null);
      const res = await companyAccessRequestService.updateDraft(id, initial);
      setIsSavingEdit(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      const refreshed = await companyAccessRequestService.getDetail(id);
      if (refreshed.ok) {
        setItem(refreshed.data);
      }
      setIsEditingFicha(false);
      setSuccessMessage(
        'Los datos se han restablecido a los valores iniciales del registro original.',
      );
    } else {
      setIsEditingFicha(false);
      setSuccessMessage(
        'Los campos se han restablecido a sus valores originales.',
      );
    }
  }

  async function handleReEvaluateOcr() {
    setReEvaluatingOcr(true);
    setError(null);
    const res = await companyAccessRequestService.reEvaluateOcr(id);
    setReEvaluatingOcr(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccessMessage(
      'Contraste OCR recalculado y datos del documento extraídos exitosamente.',
    );
    const refreshed = await companyAccessRequestService.getDetail(id);
    if (refreshed.ok) {
      setItem(refreshed.data);
    }
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
  const cityName = item.city.title || item.city.name || 'No especificada';

  const getFieldComparison = (
    fieldKey: keyof NonNullable<typeof ocr>,
    fallbackDeclared: string,
  ): CompanyOcrFieldDetail => {
    const detail = ocr?.[fieldKey] as CompanyOcrFieldDetail | undefined;
    if (detail && typeof detail === 'object' && 'declared' in detail) {
      return detail;
    }
    if (fieldKey === 'companyName') {
      const isMatched = Boolean(ocr?.companyNameMatched);
      return {
        declared: fallbackDeclared,
        detectedText: isMatched ? fallbackDeclared : null,
        matched: isMatched,
      };
    }
    if (fieldKey === 'requestIntent') {
      const isMatched = Boolean(ocr?.requestIntentMatched);
      return {
        declared: 'Carta formal de solicitud de acceso a UMSSY',
        detectedText: isMatched
          ? 'Petición formal de acceso a la carrera/plataforma UMSS'
          : null,
        matched: isMatched,
      };
    }
    return {
      declared: fallbackDeclared,
      detectedText: null,
      matched: false,
    };
  };

  const comparisonList = [
    {
      id: 'companyName',
      label: 'Razón Social / Nombre de la Empresa',
      icon: Building2,
      data: getFieldComparison('companyName', item.companyName),
    },
    {
      id: 'city',
      label: 'Ciudad Sede',
      icon: MapPin,
      data: getFieldComparison('city', cityName),
    },
    {
      id: 'email',
      label: 'Correo Electrónico Institucional',
      icon: Mail,
      data: getFieldComparison('email', item.email),
    },
    {
      id: 'phone',
      label: 'Teléfono de Contacto',
      icon: Phone,
      data: getFieldComparison('phone', item.phone),
    },
    {
      id: 'websiteUrl',
      label: 'Sitio Web Corporativo',
      icon: Globe,
      data: getFieldComparison(
        'websiteUrl',
        item.websiteUrl || 'No especificado (Opcional)',
      ),
    },
    {
      id: 'sector',
      label: 'Rubro / Sector Económico',
      icon: Building2,
      data: getFieldComparison('sector', item.sector),
    },
    {
      id: 'requestIntent',
      label: 'Intención Formal de Solicitud de Acceso',
      icon: FileText,
      data: getFieldComparison(
        'requestIntent',
        'Solicitud formal de cuenta institucional para reclutador en UMSSY',
      ),
    },
  ];

  const confirmedCount = comparisonList.filter((c) => c.data.matched).length;
  const unconfirmedCount = comparisonList.length - confirmedCount;

  const ocrPercentage =
    item.ocrMatchScore !== null && item.ocrMatchScore !== undefined
      ? item.ocrMatchScore
      : Math.round((confirmedCount / comparisonList.length) * 100);

  const canResolve =
    item.status.title === 'PENDING' ||
    item.status.title === 'IN_REVIEW' ||
    item.status.title === 'OBSERVED';

  const statusConfig = STATUS_CONFIG[item.status.title] ?? {
    label: item.status.title,
    variant: 'secondary' as const,
    bgClass: 'bg-surface-soft text-ink',
    textClass: 'text-primary',
  };

  const isDataModifiedFromInitial =
    Boolean(initialSnapshot) &&
    (item.companyName !== initialSnapshot?.companyName ||
      item.sector !== initialSnapshot?.sector ||
      item.email !== initialSnapshot?.email ||
      item.phone !== initialSnapshot?.phone ||
      (item.websiteUrl ?? '') !== (initialSnapshot?.websiteUrl ?? '') ||
      item.description !== initialSnapshot?.description ||
      item.username !== initialSnapshot?.username);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      
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
            <span className="rounded-md bg-surface-soft px-2.5 py-1 text-xs font-bold text-ink">
              {item.requestCode ?? 'S/C'}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig.bgClass}`}
                >
                  <Eye className={`size-3 ${statusConfig.textClass}`} />
                  {statusConfig.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-ink">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  {ocrPercentage}% Afinidad OCR
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                <span className="font-medium text-ink">{item.sector}</span> ·{' '}
                {cityName}
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

          
          {canResolve && (
            <div className="shrink-0 self-start sm:self-center">
              <Button
                type="button"
                onClick={() => {
                  setActiveAction(null);
                  setShowResolutionModal(true);
                }}
                className="h-10 bg-primary px-5 text-sm font-semibold text-white shadow-xs hover:bg-primary/90"
              >
                Emitir resolución
              </Button>
            </div>
          )}
        </div>
      </header>

      
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-xs text-ink shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertCircle className="size-3.5" />
            </div>
            <p className="font-medium text-rose-700 dark:text-rose-400">
              {error}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setError(null)}
            className="size-6 p-0 text-text-secondary hover:text-ink"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-xs text-ink shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
            </div>
            <p className="font-medium text-ink">{successMessage}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setSuccessMessage(null)}
            className="size-6 p-0 text-text-secondary hover:text-ink"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        
        <section
          className="space-y-3 lg:sticky lg:top-6 lg:col-span-6"
          aria-labelledby="section-document"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <h2
                id="section-document"
                className="text-base font-bold text-ink"
              >
                Documento de Respaldo Oficial
              </h2>
            </div>
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-surface-soft"
              >
                <ExternalLink className="size-3.5" /> Abrir en nueva pestaña
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
                <div className="flex h-64 flex-col items-center justify-center p-8 text-center text-text-secondary">
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

        
        <section
          className="space-y-4 lg:col-span-6"
          aria-labelledby="section-contrast"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2
                id="section-contrast"
                className="text-base font-bold text-ink"
              >
                Contraste de Datos y Verificación OCR
              </h2>
              <p className="text-xs text-text-secondary">
                Cotejo minucioso campo por campo entre los datos del registro y
                el contenido extraído del documento adjunto.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleReEvaluateOcr()}
                disabled={reEvaluatingOcr || submitting}
                className="gap-1.5 text-xs font-semibold"
              >
                {reEvaluatingOcr ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Analizando
                    OCR...
                  </>
                ) : (
                  <>
                    <RotateCcw className="size-3.5 text-primary" /> Re-analizar
                    OCR
                  </>
                )}
              </Button>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                {confirmedCount} confirmados
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs">
                <XCircle className="size-3.5 text-rose-600" />
                {unconfirmedCount} por verificar
              </span>
            </div>
          </div>

          
          <Card className="border-border bg-surface shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  <CardTitle className="text-sm font-bold text-ink">
                    Porcentaje de Coincidencia OCR
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-ink">
                    {ocrPercentage}%
                  </span>
                  <Badge
                    variant={
                      ocrPercentage >= 60
                        ? 'default'
                        : ocrPercentage >= 35
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="text-xs font-semibold"
                  >
                    {ocrPercentage >= 60
                      ? 'Alta Coincidencia'
                      : ocrPercentage >= 35
                        ? 'Coincidencia Parcial'
                        : 'Baja Coincidencia'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-xs text-text-secondary">
                Nivel de certidumbre basado en el análisis del texto extraído de
                la carta membretada.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <Progress value={ocrPercentage} className="h-2" />
            </CardContent>
          </Card>

          
          <div className="flex flex-col gap-3.5">
            {comparisonList.map((comp) => {
              const IconComponent = comp.icon;
              const isMatched = comp.data.matched;
              const hasDetectedText = Boolean(comp.data.detectedText);

              return (
                <div
                  key={comp.id}
                  className="flex flex-col rounded-xl border border-border bg-surface p-3.5 shadow-2xs"
                >
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="size-4 text-primary" />
                      <span className="text-xs font-bold text-ink sm:text-sm">
                        {comp.label}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                        isMatched
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : hasDetectedText
                            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      {isMatched ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                          Coincide
                        </>
                      ) : hasDetectedText ? (
                        <>
                          <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" />
                          Discrepancia
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-slate-500" />
                          No detectado
                        </>
                      )}
                    </span>
                  </div>

                  
                  <div className="mt-2.5 grid grid-cols-1 items-stretch gap-2.5 sm:grid-cols-2">
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-text-secondary">
                        Declarado:
                      </span>
                      <div className="mt-1 flex min-h-[42px] flex-1 items-center justify-start rounded-md border border-border/80 bg-surface-soft/40 p-2.5 text-left text-xs leading-normal font-medium text-ink">
                        <span>{comp.data.declared || 'No especificado'}</span>
                      </div>
                    </div>

                    
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-text-secondary">
                        Extraído (OCR):
                      </span>
                      {comp.data.detectedText ? (
                        <div className="mt-1 flex min-h-[42px] flex-1 items-center justify-start rounded-md border border-border/80 bg-surface-soft/40 p-2.5 text-left text-xs leading-normal font-medium text-ink">
                          <span>{comp.data.detectedText}</span>
                        </div>
                      ) : (
                        <div className="mt-1 flex min-h-[42px] flex-1 items-center justify-start rounded-md border border-border/60 bg-surface-soft/30 p-2.5 text-left text-xs font-medium text-text-secondary italic">
                          <span>No detectado en el documento</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      
      <section
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        aria-labelledby="section-optional-data"
      >
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
              Inspección visual del logotipo institucional.
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
                      Mosaico
                    </Button>
                  </div>

                  <a
                    href={logoUrl}
                    download={`logo-${item.requestCode ?? 'empresa'}.png`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Download className="size-3" /> Descargar imagen
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-soft/40 p-4 text-center text-text-secondary">
                <ImageIcon className="mb-1.5 size-8 text-slate-300" />
                <p className="text-xs">
                  La empresa optó por no suministrar un isotipo o logotipo
                  oficial al momento de su registro inicial.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-ink">
              Resumen del Trámite Institucional
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Metadatos del proceso administrativo de registro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-text-secondary">Estado actual:</span>
              <span className="font-semibold text-ink">
                {statusConfig.label}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-text-secondary">Código único:</span>
              <span className="font-semibold text-ink">
                {item.requestCode ?? 'Sin código'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-text-secondary">Fecha de ingreso:</span>
              <span className="font-medium text-ink">
                {item.submittedAt
                  ? new Date(item.submittedAt).toLocaleString('es-BO')
                  : 'No disponible'}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-text-secondary">Afinidad OCR:</span>
              <span className="font-bold text-ink">{ocrPercentage}%</span>
            </div>

            {canResolve && (
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setActiveAction(null);
                    setShowResolutionModal(true);
                  }}
                  className="w-full bg-primary font-semibold text-white shadow-xs hover:bg-primary/90"
                >
                  Abrir ventana de resolución
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      
      <Dialog open={showResolutionModal} onOpenChange={setShowResolutionModal}>
        <DialogContent className="flex max-h-[88vh] w-full flex-col overflow-hidden p-0 sm:max-w-2xl md:max-w-3xl">
          
          <DialogHeader className="shrink-0 border-b border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-base font-bold text-ink">
                  Resolución de Solicitud
                </DialogTitle>
                <DialogDescription className="text-xs text-text-secondary">
                  Expediente:{' '}
                  <strong className="text-ink">{item.companyName}</strong> (
                  {item.requestCode})
                </DialogDescription>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs font-semibold text-ink">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>{ocrPercentage}% Afinidad OCR</span>
              </div>
            </div>
          </DialogHeader>

          
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            
            <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-ink">
                    Ficha Oficial para Registro en Plataforma
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingFicha ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setIsEditingFicha(true)}
                        className="gap-1 text-xs font-semibold text-primary"
                      >
                        <Pencil className="size-3" /> Editar datos
                      </Button>
                      {isDataModifiedFromInitial && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => void handleResetInitialData()}
                          disabled={isSavingEdit}
                          className="gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          title="Restablecer datos a como los envió originalmente la empresa"
                        >
                          <RotateCcw className="size-3" /> Restablecer datos
                          iniciales
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setIsEditingFicha(false)}
                        disabled={isSavingEdit}
                        className="text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => void handleResetInitialData()}
                        disabled={isSavingEdit}
                        className="gap-1 text-xs text-slate-700"
                      >
                        <RotateCcw className="size-3" /> Restablecer
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => void handleSaveEdit()}
                        disabled={isSavingEdit}
                        className="gap-1 bg-primary text-xs text-white"
                      >
                        {isSavingEdit ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />{' '}
                            Guardando...
                          </>
                        ) : (
                          'Guardar cambios'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isDataModifiedFromInitial && !isEditingFicha && (
                <div className="mt-2.5 flex items-center justify-between rounded-lg border border-border bg-surface-soft/60 px-3 py-1.5 text-xs text-ink">
                  <span>
                    Ficha con modificaciones aplicadas por el revisor
                    administrativo.
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    onClick={() => void handleResetInitialData()}
                    className="h-auto p-0 font-bold text-primary underline"
                  >
                    Restablecer valores iniciales
                  </Button>
                </div>
              )}

              
              {!isEditingFicha ? (
                <div className="mt-3.5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Razón Social / Nombre Comercial
                    </span>
                    <p className="mt-0.5 font-bold text-ink">
                      {item.companyName}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Rubro / Sector
                    </span>
                    <p className="mt-0.5 font-bold text-ink">{item.sector}</p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Ciudad Sede
                    </span>
                    <p className="mt-0.5 font-bold text-ink">{cityName}</p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Correo Electrónico Institucional
                    </span>
                    <p className="mt-0.5 font-bold text-ink">{item.email}</p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Teléfono de Contacto
                    </span>
                    <p className="mt-0.5 font-bold text-ink">{item.phone}</p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Usuario Reclutador a Crear
                    </span>
                    <p className="mt-0.5 font-semibold text-primary">
                      @{item.username}
                    </p>
                  </div>

                  <div className="col-span-full rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Sitio Web Oficial
                    </span>
                    <p className="mt-0.5 font-normal text-ink">
                      {item.websiteUrl || 'No especificado (Opcional)'}
                    </p>
                  </div>

                  <div className="col-span-full rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
                    <span className="text-[10px] font-semibold text-text-secondary uppercase">
                      Descripción Institucional
                    </span>
                    <p className="mt-0.5 leading-relaxed text-ink">
                      {item.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 space-y-3 text-xs">
                  <div>
                    <Label className="text-xs font-semibold">
                      Razón Social / Nombre Comercial *
                    </Label>
                    <Input
                      value={editForm.companyName ?? ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold">
                        Rubro / Sector *
                      </Label>
                      <Input
                        value={editForm.sector ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            sector: e.target.value,
                          }))
                        }
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">
                        Teléfono de Contacto *
                      </Label>
                      <Input
                        value={editForm.phone ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold">
                        Correo Electrónico *
                      </Label>
                      <Input
                        value={editForm.email ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">
                        Usuario Reclutador *
                      </Label>
                      <Input
                        value={editForm.username ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">
                      Sitio Web Oficial
                    </Label>
                    <Input
                      value={editForm.websiteUrl ?? ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          websiteUrl: e.target.value,
                        }))
                      }
                      placeholder="https://ejemplo.com"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">
                      Descripción Institucional *
                    </Label>
                    <Textarea
                      rows={2}
                      value={editForm.description ?? ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            
            {activeAction === 'APPROVE' && (
              <div className="rounded-xl border border-border bg-surface p-4.5 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Dictamen: Aprobación
                  </span>
                  <h4 className="text-sm font-bold text-ink">
                    Confirmación de Alta Oficial
                  </h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Al confirmar, se registrará formalmente la empresa en el
                  sistema y se creará el usuario reclutador{' '}
                  <strong className="text-ink">@{item.username}</strong>. Se
                  enviará de inmediato el código de activación institucional a{' '}
                  <strong className="text-ink">{item.email}</strong>.
                </p>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveAction(null)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleApprove()}
                    disabled={submitting}
                    className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                  >
                    {submitting ? 'Aprobando...' : 'Confirmar aprobación'}
                  </Button>
                </div>
              </div>
            )}

            {activeAction === 'CORRECTION' && (
              <div className="space-y-3.5 rounded-xl border border-border bg-surface p-4.5 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                    Dictamen: Subsanación
                  </span>
                  <h4 className="text-sm font-bold text-ink">
                    Solicitud de Observación Documental
                  </h4>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  La solicitud pasará a estado de observación y el representante
                  podrá ingresar con su código{' '}
                  <strong className="text-ink">{item.requestCode}</strong> para
                  corregir los requisitos.
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-ink">
                    Motivo principal de la observación:
                  </Label>
                  <RadioGroup
                    value={correctionCategory}
                    onValueChange={setCorrectionCategory}
                    className="space-y-1.5"
                  >
                    {CORRECTION_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface p-2 text-xs text-ink hover:bg-surface-soft"
                      >
                        <RadioGroupItem value={reason} />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-ink">
                    Detalle específico e instrucciones para la empresa *
                  </Label>
                  <Textarea
                    rows={3}
                    value={correctionDetails}
                    onChange={(e) => setCorrectionDetails(e.target.value)}
                    placeholder="Describe con precisión qué debe corregir o adjuntar..."
                    className="text-xs"
                  />
                  <p className="text-[11px] text-text-secondary">
                    Mínimo 5 caracteres ({correctionDetails.trim().length}{' '}
                    ingresados).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveAction(null)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleCorrection()}
                    disabled={submitting || correctionDetails.trim().length < 5}
                    className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    {submitting ? 'Enviando...' : 'Enviar subsanación'}
                  </Button>
                </div>
              </div>
            )}

            {activeAction === 'REJECT' && (
              <div className="space-y-3.5 rounded-xl border border-border bg-surface p-4.5 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    Dictamen: Rechazo
                  </span>
                  <h4 className="text-sm font-bold text-ink">
                    Fundamentación de Rechazo
                  </h4>
                </div>
                <p className="text-xs leading-relaxed text-text-secondary">
                  Esta acción concluye el trámite de forma definitiva y enviará
                  la notificación formal al correo{' '}
                  <strong className="text-ink">{item.email}</strong>.
                </p>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-ink">
                    Causal institucional de rechazo:
                  </Label>
                  <RadioGroup
                    value={rejectionCategory}
                    onValueChange={setRejectionCategory}
                    className="space-y-1.5"
                  >
                    {REJECTION_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface p-2 text-xs text-ink hover:bg-surface-soft"
                      >
                        <RadioGroupItem value={reason} />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-ink">
                    Fundamentación oficial del rechazo *
                  </Label>
                  <Textarea
                    rows={3}
                    value={rejectionDetails}
                    onChange={(e) => setRejectionDetails(e.target.value)}
                    placeholder="Detalla los motivos formales del dictamen..."
                    className="text-xs"
                  />
                  <p className="text-[11px] text-text-secondary">
                    Mínimo 5 caracteres ({rejectionDetails.trim().length}{' '}
                    ingresados).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveAction(null)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleReject()}
                    disabled={submitting || rejectionDetails.trim().length < 5}
                    className="bg-rose-600 font-semibold text-white hover:bg-rose-700"
                  >
                    {submitting ? 'Rechazando...' : 'Confirmar rechazo'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          
          {canResolve && (
            <DialogFooter className="shrink-0 border-t border-border bg-surface p-4">
              {activeAction === null ? (
                <div className="flex w-full items-center gap-2.5">
                  <Button
                    type="button"
                    onClick={() => setActiveAction('APPROVE')}
                    disabled={submitting || isSavingEdit}
                    className="h-10 flex-1 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                  >
                    Aprobar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveAction('CORRECTION')}
                    disabled={submitting || isSavingEdit}
                    className="h-10 flex-1 bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    Solicitar subsanación
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveAction('REJECT')}
                    disabled={submitting || isSavingEdit}
                    className="h-10 flex-1 bg-rose-600 font-semibold text-white hover:bg-rose-700"
                  >
                    Rechazar
                  </Button>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    Configurando dictamen seleccionado...
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveAction(null)}
                    className="text-xs font-medium text-text-secondary hover:text-ink"
                  >
                    Cambiar de acción
                  </Button>
                </div>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      
      {logoUrl && (
        <Dialog open={showLogoModal} onOpenChange={setShowLogoModal}>
          <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-5 sm:max-w-xl">
            <DialogHeader className="shrink-0 border-b border-border pr-8 pb-3">
              <DialogTitle className="text-base font-bold text-ink">
                Logotipo Corporativo: {item.companyName}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                Previsualización en resolución completa del archivo suministrado
                en el registro.
              </DialogDescription>
            </DialogHeader>

            <div className="my-2 flex max-h-[380px] flex-1 items-center justify-center overflow-auto rounded-xl border border-border bg-slate-900/5 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`Logotipo completo de ${item.companyName}`}
                className="max-h-[320px] max-w-full rounded object-contain"
              />
            </div>

            <DialogFooter className="flex shrink-0 flex-row items-center justify-between border-t border-border bg-popover pt-3">
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
