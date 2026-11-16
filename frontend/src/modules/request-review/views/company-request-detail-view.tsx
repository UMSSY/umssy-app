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
  ChevronDown,
  ChevronUp,
  Clock,
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
  Save,
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
import { companyAccessRequestService } from '@/modules/access-request/services/company-access-request.service';
import type {
  CompanyAccessRequestItem,
  CompanyOcrFieldDetail,
  UpdateCompanyPayload,
} from '@/modules/access-request/types/company-access-request.types';
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
  const [isDocMinimized, setIsDocMinimized] = useState(false);

  // Modales
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoBg, setLogoBg] = useState<'light' | 'dark' | 'checkered'>('light');

  // Subsanación
  const [correctionCategory, setCorrectionCategory] = useState(
    CORRECTION_REASONS[0],
  );
  const [correctionDetails, setCorrectionDetails] = useState('');

  // Rechazo
  const [rejectionCategory, setRejectionCategory] = useState(
    REJECTION_REASONS[0],
  );
  const [rejectionDetails, setRejectionDetails] = useState('');

  // Edición de ficha
  const [editForm, setEditForm] = useState<UpdateCompanyPayload>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
      setEditForm({
        companyName: detailRes.data.companyName,
        sector: detailRes.data.sector,
        description: detailRes.data.description,
        email: detailRes.data.email,
        phone: detailRes.data.phone,
        websiteUrl: detailRes.data.websiteUrl ?? '',
        username: detailRes.data.username,
      });

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

  async function handleCorrection() {
    if (correctionDetails.trim().length < 5) return;
    setSubmitting(true);
    setError(null);
    const res = await companyAccessRequestService.requestCorrection(id, {
      reasonCategory: correctionCategory,
      customDetails: correctionDetails.trim(),
    });
    setSubmitting(false);
    setShowCorrectionDialog(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccessMessage(
      'Se ha notificado a la empresa la solicitud de subsanación por correo electrónico.',
    );
    // Actualizar datos del item localmente
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
    setShowRejectDialog(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
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
    setShowEditDialog(false);
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

  // Obtener estado por atributo desde el nuevo modelo de OCR
  const getFieldComparison = (
    fieldKey: keyof NonNullable<typeof ocr>,
    fallbackDeclared: string,
  ): CompanyOcrFieldDetail => {
    const detail = ocr?.[fieldKey] as CompanyOcrFieldDetail | undefined;
    if (detail && typeof detail === 'object' && 'declared' in detail) {
      return detail;
    }
    // Fallback si viene del formato legado de 3 booleanos
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

  // Calculamos el score OCR en porcentaje (%)
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

  const formattedWebsite = item.websiteUrl?.trim();
  const safeWebUrl = formattedWebsite
    ? formattedWebsite.startsWith('http://') ||
      formattedWebsite.startsWith('https://')
      ? formattedWebsite
      : `https://${formattedWebsite}`
    : null;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 pb-16">
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

        <div className="mt-4 flex items-start gap-4">
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
      </header>

      {/* Alertas de retroalimentación global */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <AlertCircle className="size-5 shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
            <p className="font-medium">{successMessage}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-800 hover:bg-emerald-100"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. DOCUMENTO DE RESPALDO (CARTA MEMBRETADA) CON VISOR MINIMIZABLE
          Permite al admin ocultar o expandir el visor para no scrollear innecesariamente
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-3" aria-labelledby="section-document">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <h2 id="section-document" className="text-lg font-bold text-ink">
              Documento de Respaldo Oficial (Carta Membretada)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDocMinimized(!isDocMinimized)}
              className="gap-1.5 text-xs font-semibold"
            >
              {isDocMinimized ? (
                <>
                  <ChevronDown className="size-3.5" /> Expandir visor
                </>
              ) : (
                <>
                  <ChevronUp className="size-3.5" /> Minimizar visor
                </>
              )}
            </Button>
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-soft"
              >
                <ExternalLink className="size-3.5" /> Abrir en nueva pestaña
              </a>
            )}
          </div>
        </div>

        <Card className="overflow-hidden border-border bg-surface shadow-xs">
          <CardContent className="p-0">
            {isDocMinimized ? (
              <div className="flex items-center justify-between border-b border-border bg-surface-soft/60 px-5 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      carta-solicitud-{item.requestCode ?? 'doc'}.
                      {docIsImage ? 'png' : 'pdf'}
                    </p>
                    <p className="text-[11px] text-text-secondary">
                      Visor minimizado temporalmente para optimizar la
                      comparativa y acciones de dictamen.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => setIsDocMinimized(false)}
                  className="gap-1 text-xs"
                >
                  <Maximize2 className="size-3.5" /> Expandir visor
                </Button>
              </div>
            ) : docUrl ? (
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

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. FICHA OFICIAL PARA REGISTRO EN PLATAFORMA (DATOS DEFINITIVOS & EDICIÓN)
          Muestra los datos que se guardarán, porcentaje de afinidad y botón para editar
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4" aria-labelledby="section-official-card">
        <Card className="border-border bg-surface shadow-xs">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="size-5 text-primary" />
                <div>
                  <CardTitle
                    id="section-official-card"
                    className="text-base font-bold text-ink"
                  >
                    Ficha Oficial para Registro en Plataforma
                  </CardTitle>
                  <CardDescription className="text-xs text-text-secondary">
                    Información definitiva que se guardará en la base de datos y
                    dará de alta a la empresa y su reclutador.
                  </CardDescription>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Badge de afinidad / coincidencia documental */}
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                    ocrPercentage >= 60
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-rose-300 bg-rose-50 text-rose-800'
                  }`}
                  title="Nivel de concordancia de la ficha con el documento membretado"
                >
                  <ShieldCheck
                    className={`size-4 ${
                      ocrPercentage >= 60 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  />
                  <span>{ocrPercentage}% Afinidad Documental</span>
                </div>

                {canResolve && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="gap-1.5 border-border text-xs font-semibold hover:bg-surface-soft"
                  >
                    <Pencil className="size-3.5 text-primary" />
                    Editar datos del registro
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Razón Social / Nombre Comercial
                </span>
                <p className="mt-1 font-bold text-ink">{item.companyName}</p>
              </div>

              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Rubro / Sector
                </span>
                <p className="mt-1 font-bold text-ink">{item.sector}</p>
              </div>

              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Ciudad Sede
                </span>
                <p className="mt-1 font-bold text-ink">{cityName}</p>
              </div>

              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Correo Electrónico Institucional
                </span>
                <p className="mt-1 font-bold text-ink">{item.email}</p>
              </div>

              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Teléfono de Contacto
                </span>
                <p className="mt-1 font-bold text-ink">{item.phone}</p>
              </div>

              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Usuario Reclutador a Crear
                </span>
                <p className="mt-1 font-mono font-bold text-primary">
                  @{item.username}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5 lg:col-span-3">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Sitio Web Oficial
                </span>
                <p className="mt-1 font-mono text-xs font-semibold text-ink">
                  {item.websiteUrl || 'No especificado'}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-3.5 lg:col-span-3">
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
                  Descripción Institucional
                </span>
                <p className="mt-1 text-xs leading-relaxed text-ink">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Acciones de dictamen oficiales tras revisar la ficha y el documento */}
            {canResolve && (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-border/80 bg-surface-soft/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Dictamen de la Solicitud
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Habiendo verificado la información oficial a registrar y la
                    carta membretada:
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    onClick={() => setShowApproveDialog(true)}
                    disabled={submitting}
                    className="h-10 bg-emerald-600 px-4 font-semibold text-white shadow-xs hover:bg-emerald-700"
                  >
                    <Check className="mr-1.5 size-4" /> Aprobar y Dar de Alta
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCorrectionDialog(true)}
                    disabled={submitting}
                    className="h-10 border-indigo-200 bg-indigo-50/60 px-4 font-medium text-indigo-700 shadow-xs hover:bg-indigo-100 hover:text-indigo-800"
                  >
                    <RotateCcw className="mr-1.5 size-4 text-indigo-600" />{' '}
                    Solicitar Subsanación
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={submitting}
                    className="h-10 border-rose-200 bg-rose-50/60 px-4 font-medium text-rose-700 shadow-xs hover:bg-rose-100 hover:text-rose-800"
                  >
                    <X className="mr-1.5 size-4 text-rose-600" /> Rechazar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. CONTRASTE DE DATOS Y VERIFICACIÓN OCR (BLOQUES COMPARATIVOS)
          Compara campo por campo, verde si coincide, rojo opaco si no, sin amarillo
          ───────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-6" aria-labelledby="section-contrast">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 id="section-contrast" className="text-lg font-bold text-ink">
              Contraste de Datos y Verificación OCR
            </h2>
            <p className="text-xs text-text-secondary">
              Cotejo minucioso campo por campo entre los datos del registro y el
              contenido extraído del documento adjunto.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-800">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {confirmedCount} criterios confirmados
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-rose-800">
              <XCircle className="size-4 text-rose-600" />
              {unconfirmedCount} por verificar o no detectados
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
                    ocrPercentage >= 60
                      ? 'default'
                      : ocrPercentage >= 35
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="font-semibold"
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
          <CardContent className="space-y-4">
            <div className="w-full">
              <Progress value={ocrPercentage} className="h-2.5" />
            </div>
          </CardContent>
        </Card>

        {/* Cuadrícula de Bloques Comparativos Separados */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {comparisonList.map((comp) => {
            const IconComponent = comp.icon;
            const isMatched = comp.data.matched;

            return (
              <div
                key={comp.id}
                className={`flex flex-col justify-between rounded-xl border p-4.5 shadow-2xs transition-all ${
                  isMatched
                    ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200'
                    : 'border-rose-300 bg-rose-50/40 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <IconComponent
                        className={`size-4 ${
                          isMatched ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      />
                      <span className="text-xs font-bold text-ink">
                        {comp.label}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        isMatched
                          ? 'border-emerald-300 bg-emerald-100/90 text-emerald-800'
                          : 'border-rose-300 bg-rose-100/90 text-rose-800'
                      }`}
                    >
                      {isMatched ? (
                        <>
                          <CheckCircle2 className="size-3 text-emerald-600" />{' '}
                          Coincide
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3 text-rose-600" /> No
                          detectado
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-text-secondary">
                        Dato Declarado en Formulario:
                      </span>
                      <p className="mt-0.5 font-bold text-ink">
                        {comp.data.declared}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-text-secondary">
                        Texto Extraído del Documento (OCR):
                      </span>
                      {comp.data.detectedText ? (
                        <p
                          className={`mt-1 rounded-md border p-2 font-mono text-[11px] leading-relaxed ${
                            isMatched
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-200'
                              : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-200'
                          }`}
                        >
                          &ldquo;{comp.data.detectedText}&rdquo;
                        </p>
                      ) : (
                        <p className="mt-1 rounded-md border border-rose-200 bg-rose-50/80 p-2 text-[11px] text-rose-800 italic dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300">
                          No se identificó este dato en el contenido escaneado
                          de la carta.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. SECCIÓN DE DATOS OPCIONALES: LOGOTIPO CORPORATIVO Y SITIO WEB
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
                  La empresa no subió un logo durante su registro. Podrá
                  cargarlo posteriormente desde su perfil.
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
                    nueva pestaña y verificar que responda con normalidad.
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
                  es opcional y no impide la aprobación del trámite.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. HISTORIAL Y AUDITORÍA
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
                      : item.status.title === 'OBSERVED'
                        ? 'bg-indigo-600'
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
                      Observación / Motivo: {item.rejectionReason}
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
          MODAL: EDITAR FICHA OFICIAL PARA REGISTRO
          ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-5 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-border pr-8 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
              <Pencil className="size-4.5 text-primary" />
              Editar Ficha Oficial de Registro
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Ajusta los datos que se guardarán definitivamente en la
              plataforma. Al guardar, el OCR recalculará la afinidad con el
              documento en vivo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2 pr-1">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-companyName" className="text-xs font-bold">
                  Razón Social / Nombre Comercial *
                </Label>
                <Input
                  id="edit-companyName"
                  value={editForm.companyName ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, companyName: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-sector" className="text-xs font-bold">
                  Rubro / Sector *
                </Label>
                <Input
                  id="edit-sector"
                  value={editForm.sector ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sector: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-username" className="text-xs font-bold">
                  Usuario Reclutador (@) *
                </Label>
                <Input
                  id="edit-username"
                  value={editForm.username ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email" className="text-xs font-bold">
                  Correo Institucional *
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-xs font-bold">
                  Teléfono de Contacto *
                </Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-websiteUrl" className="text-xs font-bold">
                  Sitio Web Corporativo (Opcional)
                </Label>
                <Input
                  id="edit-websiteUrl"
                  value={editForm.websiteUrl ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, websiteUrl: e.target.value })
                  }
                  placeholder="https://www.empresa.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-description" className="text-xs font-bold">
                  Descripción Institucional *
                </Label>
                <Textarea
                  id="edit-description"
                  rows={3}
                  value={editForm.description ?? ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex shrink-0 flex-row items-center justify-end gap-2 border-t border-border bg-popover pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(false)}
              disabled={isSavingEdit}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSaveEdit()}
              disabled={isSavingEdit}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isSavingEdit ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" /> Guardando y
                  recalculando...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 size-3.5" /> Guardar Corrección
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: SOLICITAR SUBSANACIÓN DE REGISTRO
          ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog
        open={showCorrectionDialog}
        onOpenChange={setShowCorrectionDialog}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-5 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border pr-8 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-indigo-700">
              <RotateCcw className="size-4.5 text-indigo-600" />
              Solicitar Subsanación de Registro
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Se enviará un correo a{' '}
              <strong className="text-ink">{item.email}</strong> indicando qué
              observaciones debe corregir para continuar con su trámite.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-3.5 overflow-y-auto py-2 pr-1 text-xs">
            <div className="space-y-1.5">
              <span className="font-bold text-ink">
                Motivo principal de la observación:
              </span>
              <RadioGroup
                value={correctionCategory}
                onValueChange={(val) => {
                  if (typeof val === 'string') setCorrectionCategory(val);
                }}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {CORRECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors ${
                      correctionCategory === reason
                        ? 'border-indigo-400 bg-indigo-50/70 font-medium text-indigo-950 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200'
                        : 'border-border text-ink hover:bg-surface-soft'
                    }`}
                  >
                    <RadioGroupItem
                      value={reason}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-[11px] leading-snug">{reason}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="correction-details"
                className="font-bold text-ink"
              >
                Detalle específico e instrucciones para la empresa *
              </Label>
              <Textarea
                id="correction-details"
                rows={3}
                placeholder="Indica con claridad las correcciones requeridas (ej: 'El documento adjunto no cuenta con el sello institucional. Por favor, reenvíe la carta membretada firmada y sellada por gerencia')..."
                value={correctionDetails}
                onChange={(e) => setCorrectionDetails(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-text-secondary">
                Mínimo 5 caracteres ({correctionDetails.trim().length}{' '}
                ingresados).
              </p>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-2.5 text-[11px] text-indigo-900 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300">
              <p>
                Al enviar la solicitud de subsanación, el estado pasará a{' '}
                <strong>Subsanación solicitada</strong> y el representante de la
                empresa podrá consultar las indicaciones ingresando su código{' '}
                <strong>{item.requestCode}</strong>.
              </p>
            </div>
          </div>

          <DialogFooter className="flex shrink-0 flex-row items-center justify-end gap-2 border-t border-border bg-popover pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCorrectionDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleCorrection()}
              disabled={submitting || correctionDetails.trim().length < 5}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" /> Enviando...
                </>
              ) : (
                'Enviar Solicitud de Subsanación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL: APROBACIÓN DE SOLICITUD
          ───────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-5 sm:max-w-xl">
          <DialogHeader className="shrink-0 border-b border-border pr-8 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-ink">
              <CheckCircle2 className="size-4.5 text-emerald-600" />
              Aprobar Solicitud de Empresa
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Estás por dictaminar favorablemente la solicitud de{' '}
              <strong className="text-ink">{item.companyName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-3 overflow-y-auto py-2 pr-1 text-xs">
            <p className="text-text-secondary">
              Al confirmar la aprobación, el sistema ejecutará automáticamente:
            </p>
            <ul className="space-y-2 rounded-lg bg-surface-soft p-3">
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 shrink-0 text-emerald-600" />
                Creación del registro de empresa y su perfil oficial.
              </li>
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 shrink-0 text-emerald-600" />
                Creación del usuario reclutador asociado (@{item.username}).
              </li>
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 shrink-0 text-emerald-600" />
                Generación del código OTP de activación temporal (24h).
              </li>
              <li className="flex items-center gap-2 font-medium text-ink">
                <Check className="size-4 shrink-0 text-emerald-600" />
                Envío de correo con código y enlace a{' '}
                <span className="font-semibold text-primary">{item.email}</span>
                .
              </li>
            </ul>
          </div>

          <DialogFooter className="flex shrink-0 flex-row items-center justify-end gap-2 border-t border-border bg-popover pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApproveDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleApprove()}
              disabled={submitting}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />{' '}
                  Aprobando...
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
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-5 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border pr-8 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <XCircle className="size-4.5 text-destructive" />
              Rechazar Solicitud de Empresa
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Selecciona el motivo y fundamentación del dictamen negativo para{' '}
              <strong className="text-ink">{item.companyName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-3.5 overflow-y-auto py-2 pr-1 text-xs">
            <div className="space-y-1.5">
              <span className="font-bold text-ink">Motivo del rechazo:</span>
              <RadioGroup
                value={rejectionCategory}
                onValueChange={(val) => {
                  if (typeof val === 'string') setRejectionCategory(val);
                }}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors ${
                      rejectionCategory === reason
                        ? 'border-rose-400 bg-rose-50/70 font-medium text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                        : 'border-border text-ink hover:bg-surface-soft'
                    }`}
                  >
                    <RadioGroupItem
                      value={reason}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-[11px] leading-snug">{reason}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reject-details" className="font-bold text-ink">
                Justificación administrativa formal *
              </Label>
              <Textarea
                id="reject-details"
                rows={3}
                placeholder="Fundamentación formal del rechazo para constancia en el expediente y notificación por correo..."
                value={rejectionDetails}
                onChange={(e) => setRejectionDetails(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-text-secondary">
                Mínimo 5 caracteres ({rejectionDetails.trim().length}{' '}
                ingresados).
              </p>
            </div>

            <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-2.5 text-[11px] text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              <p>
                Esta acción concluye el trámite y enviará la notificación formal
                al correo <strong>{item.email}</strong>.
              </p>
            </div>
          </div>

          <DialogFooter className="flex shrink-0 flex-row items-center justify-end gap-2 border-t border-border bg-popover pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRejectDialog(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void handleReject()}
              disabled={submitting || rejectionDetails.trim().length < 5}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />{' '}
                  Rechazando...
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
