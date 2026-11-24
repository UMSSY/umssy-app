'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  Globe,
  GraduationCap,
  ImagePlus,
  Info,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ServerCrash,
  ShieldCheck,
  Trash2,
  User,
  WifiOff,
  X,
} from 'lucide-react';
import { cn } from 'cn';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { FormFieldset } from '@/shared/components/layout/form-fieldset';
import { PageHeading } from '@/shared/components/layout/page-heading';
import { DocumentDropzoneContent } from '../document/document-dropzone-content';
import { DocumentPreviewContent } from '../document/document-preview-content';
import { RequiredMark } from '../personal-data/required-mark';
import { PublicHeader } from '../request-steps/public-header';
import { formatFileSize as formatSharedFileSize } from '../../utils/format-file-size';
import { companyAccessRequestService } from '../../services/company-access-request.service';
import type {
  CityItem,
  CreateCompanyRequestPayload,
  SubmitCompanyRequestResult,
} from '../../types/company-access-request.types';

interface CompanyAccessRequestFlowProps {
  onSwitchToGraduate: () => void;
}

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const STEPS = [
  {
    number: 1,
    title: 'Datos de la empresa',
    description: 'Información institucional y logo corporativo',
  },
  {
    number: 2,
    title: 'Carta de solicitud',
    description: 'Documento formal en hoja membretada',
  },
  {
    number: 3,
    title: 'Revisión de la carrera',
    description: 'Hasta 48 horas hábiles',
  },
  {
    number: 4,
    title: 'Activación de cuenta',
    description: 'Código enviado a tu correo',
  },
];

function formatFileSize(bytes: number): string {
  return formatSharedFileSize(bytes, {
    decimalSeparator: '.',
    kbDecimals: 1,
    mbDecimals: 2,
    allowBytesUnit: false,
  });
}

export function CompanyAccessRequestFlow({
  onSwitchToGraduate,
}: CompanyAccessRequestFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmitCompanyRequestResult | null>(
    null,
  );
  const [copiedCode, setCopiedCode] = useState(false);

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const input = document.createElement('input');
      input.value = code;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  const [form, setForm] = useState<CreateCompanyRequestPayload>({
    companyName: '',
    sector: '',
    cityId: '',
    description: '',
    email: '',
    phone: '',
    websiteUrl: '',
    username: '',
  });

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDimensions, setLogoDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [previewBg, setPreviewBg] = useState<'light' | 'dark'>('light');

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(
    null,
  );
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    title: string;
    category: 'conflict' | 'validation' | 'server' | 'network';
    message: string;
    field?: 'email' | 'companyName' | 'activeRequest';
    recommendation: string;
  }>({
    open: false,
    title: '',
    category: 'validation',
    message: '',
    recommendation: '',
  });

  function showErrorModal(result: {
    status: number;
    message: string;
    code?: string;
    conflictField?: 'email' | 'companyName' | 'activeRequest';
  }) {
    let title = 'No es posible procesar la solicitud';
    let category: 'conflict' | 'validation' | 'server' | 'network' =
      'validation';
    let recommendation =
      'Por favor verifica los datos ingresados e intenta nuevamente.';

    if (
      result.status === 409 ||
      result.code === 'COMPANY_REGISTRATION_CONFLICT'
    ) {
      category = 'conflict';
      title = 'Registro no disponible: Información ya existente';
      if (result.conflictField === 'email') {
        recommendation =
          'Para garantizar la seguridad institucional de cada cuenta, cada usuario debe registrarse con un correo electrónico único. Si ya cuentas con acceso previo, por favor inicia sesión. De lo contrario, utiliza una dirección de correo corporativa diferente.';
      } else if (result.conflictField === 'companyName') {
        recommendation =
          'La empresa indicada ya se encuentra registrada en la plataforma. Si perteneces a esta organización, solicita al administrador de tu empresa que te agregue como reclutador o comunícate con la administración de UMSSy.';
      } else if (result.conflictField === 'activeRequest') {
        recommendation =
          'Actualmente existe una solicitud en proceso de evaluación con estos datos. El equipo de administración de UMSSy la revisará en un plazo máximo de 48 horas hábiles y te notificará por correo electrónico.';
      } else {
        recommendation =
          'Los datos ingresados coinciden con registros ya existentes en el sistema. Por favor revisa la información o contacta a soporte.';
      }
    } else if (result.status === 0) {
      category = 'network';
      title = 'Problema de conexión con el servicio';
      recommendation =
        'No logramos establecer comunicación con los servidores en este momento. Por favor verifica tu conexión a internet o intenta enviar el formulario nuevamente en unos minutos.';
    } else if (result.status >= 500) {
      category = 'server';
      title = 'Inconveniente temporal en la plataforma';
      recommendation =
        'Nuestros servidores experimentaron un problema momentáneo al procesar tu solicitud. Tus datos están a salvo. Por favor intenta nuevamente en unos momentos.';
    } else {
      category = 'validation';
      title = 'Revisa los campos del formulario';
      recommendation =
        'Verifica que todos los campos requeridos hayan sido completados respetando los formatos indicados.';
    }

    setErrorModal({
      open: true,
      title,
      category,
      message: result.message,
      field: result.conflictField,
      recommendation,
    });
  }

  useEffect(() => {
    return () => {
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    };
  }, [documentPreviewUrl]);

  useEffect(() => {
    void companyAccessRequestService.getCities().then((res) => {
      if (res.ok && Array.isArray(res.data)) {
        setCities(res.data);
        if (res.data.length > 0) {
          setForm((prev) => ({
            ...prev,
            cityId: prev.cityId || res.data[0].id,
          }));
        }
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!isLogoModalOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsLogoModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoModalOpen]);

  function processSelectedLogo(file: File) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setError(
        'Formato no válido para el logo. Solo se permiten imágenes PNG, JPG o WEBP.',
      );
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('El logo no debe superar los 2 MB.');
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }

    setError(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    const objectUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(objectUrl);
    setLogoDimensions(null);

    const img = new window.Image();
    img.onload = () => {
      setLogoDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  }

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedLogo(file);
  }

  function handleLogoDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsLogoDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedLogo(file);
    }
  }

  function handleRemoveLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
    setLogoDimensions(null);
    setIsLogoModalOpen(false);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  }

  const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

  function handleDocumentSelected(file: File) {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      setDocumentError(
        'Formato no permitido. Solo se aceptan archivos JPG, PNG o PDF.',
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setDocumentError('El archivo supera el máximo de 10 MB.');
      return;
    }
    setDocumentError(null);
    setError(null);
    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    setDocumentFile(file);
    setDocumentPreviewUrl(URL.createObjectURL(file));
  }

  function handleRemoveDocument() {
    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
    setDocumentFile(null);
    setDocumentPreviewUrl(null);
    setDocumentError(null);
  }

  async function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const created = await companyAccessRequestService.createDraft({
      ...form,
      websiteUrl: (form.websiteUrl ?? '').trim(),
    });
    if (!created.ok) {
      setError(created.message);
      showErrorModal(created);
      setSubmitting(false);
      return;
    }

    const id = created.data.id;
    setDraftId(id);

    if (logoFile) {
      const logoRes = await companyAccessRequestService.uploadLogo(
        id,
        logoFile,
      );
      if (!logoRes.ok) {
        setError(logoRes.message);
        showErrorModal(logoRes);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setStep(2);
  }

  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    if (!draftId || !documentFile) {
      const msg = 'Debes adjuntar la carta de solicitud en hoja membretada.';
      setError(msg);
      showErrorModal({
        status: 400,
        message: msg,
      });
      return;
    }
    setError(null);
    setSubmitting(true);

    const uploadRes = await companyAccessRequestService.uploadDocument(
      draftId,
      documentFile,
    );
    if (!uploadRes.ok) {
      setError(uploadRes.message);
      showErrorModal(uploadRes);
      setSubmitting(false);
      return;
    }

    const submitRes = await companyAccessRequestService.submit(draftId);
    setSubmitting(false);
    if (!submitRes.ok) {
      setError(submitRes.message);
      showErrorModal(submitRes);
      return;
    }

    setSubmitted(submitRes.data);
    setStep(3);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground sm:px-6 lg:sticky lg:top-app-header lg:h-app-sidebar lg:w-72 lg:justify-between lg:gap-10 lg:self-start lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
          <div>
            <h2 className="font-tight text-xl font-bold text-accent lg:text-2xl">
              Solicitud de empresa
            </h2>
            <p className="mt-2 hidden max-w-75 text-sm text-text-secondary lg:mb-[22px] lg:block">
              Cuatro pasos para registrar tu empresa y publicar ofertas
              laborales.
            </p>

            <nav aria-label="Pasos de la solicitud" className="mt-3 lg:mt-0">
              <ol className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 lg:block">
                {STEPS.map((item, index) => {
                  const isActive = step === item.number;
                  const isCompleted = step > item.number;
                  const isLast = index === STEPS.length - 1;

                  return (
                    <li
                      key={item.number}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <div className="flex items-center gap-2.5 lg:gap-3.5 lg:py-3">
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold lg:size-7.5',
                            isActive
                              ? 'border-accent bg-interaction text-accent'
                              : isCompleted
                                ? 'border-accent bg-accent text-surface'
                                : 'border-border-strong text-text-secondary',
                          )}
                        >
                          {isCompleted ? (
                            <>
                              <Check aria-hidden="true" className="size-4" />
                              <span className="sr-only">Paso completado</span>
                            </>
                          ) : (
                            item.number
                          )}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'text-sm leading-tight font-semibold',
                              isActive ? 'text-ink' : 'text-ink-soft',
                            )}
                          >
                            {item.title}
                          </p>
                          <p className="hidden text-sm text-text-secondary lg:block">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      {isLast ? null : (
                        <span
                          aria-hidden="true"
                          className="ml-3.5 hidden h-[18px] w-[1.5px] bg-border lg:block"
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <div className="flex items-start gap-3 border-t border-sidebar-border pt-3 lg:pt-[18px]">
            <ShieldCheck
              aria-hidden="true"
              className="size-5 shrink-0 text-accent"
            />
            <p className="text-sm text-ink-soft">
              Tu documentación empresarial es validada por la Dirección de
              Carrera de Ingeniería de Sistemas e Informática.
            </p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col px-4 py-6 md:p-8">
          <div className="mx-auto flex w-full max-w-5xl justify-center">
            <div className="flex w-full flex-col gap-5">
              <div className="flex items-center justify-start">
                <div
                  role="tablist"
                  aria-label="Tipo de solicitante"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-soft p-1.5 shadow-2xs"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-lg px-4 font-medium text-text-secondary hover:text-ink"
                    onClick={onSwitchToGraduate}
                  >
                    <GraduationCap className="size-4" />
                    Soy Titulado
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 rounded-lg px-4 font-semibold"
                  >
                    <Building2 className="size-4" />
                    Soy Empresa
                  </Button>
                </div>
              </div>

              {step === 1 ? (
                <PageHeading
                  title="Registra tu empresa en la comunidad"
                  description="Conecta con titulados verificados de Ingeniería de Sistemas e Informática de la UMSS."
                />
              ) : null}
              {step === 2 ? (
                <PageHeading
                  title="Carta de solicitud en hoja membretada"
                  description={`Adjunta la carta oficial firmada y sellada dirigida a la Carrera de Ingeniería de Sistemas e Informática (UMSS) para validar a ${form.companyName.trim() || 'tu empresa'}.`}
                />
              ) : null}

              {step !== 3 ? (
                <p className="text-xs text-text-secondary">
                  <span
                    aria-hidden="true"
                    className="font-semibold text-red-600"
                  >
                    *
                  </span>{' '}
                  Campo obligatorio
                </p>
              ) : null}

              {error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {error}
                </div>
              ) : null}

              {step === 1 && (
                <form
                  onSubmit={handleStep1Submit}
                  className="space-y-6 rounded-lg border border-border bg-surface p-6"
                >
                  <FormFieldset title="Identidad corporativa">
                    <div>
                      <Label className="mb-1.5 text-xs font-semibold text-ink">
                        Logo corporativo{' '}
                        <span className="font-normal text-text-secondary">
                          (opcional)
                        </span>
                      </Label>

                      <Input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoChange}
                      />

                      {logoPreview && logoFile ? (
                        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-soft/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              type="button"
                              onClick={() => setIsLogoModalOpen(true)}
                              title="Ampliar vista previa"
                              className="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2 shadow-2xs transition hover:border-accent"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={logoPreview}
                                alt="Vista previa del logo corporativo"
                                className="size-full object-contain"
                              />
                              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                                <Eye className="size-3" />
                                Ampliar
                              </span>
                            </Button>

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-ink">
                                  {logoFile.name}
                                </p>
                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  Imagen lista
                                </span>
                              </div>
                              <p className="text-xs text-text-secondary">
                                {logoFile.type
                                  .replace('image/', '')
                                  .toUpperCase()}{' '}
                                · {formatFileSize(logoFile.size)}
                                {logoDimensions
                                  ? ` · ${logoDimensions.width} × ${logoDimensions.height} px`
                                  : ''}
                              </p>
                              <p className="text-xs text-text-secondary">
                                Haz clic en la imagen o en &ldquo;Vista
                                previa&rdquo; para inspeccionar su nitidez.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsLogoModalOpen(true)}
                              className="gap-1.5"
                            >
                              <Eye className="size-3.5" />
                              Vista previa
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                              className="gap-1.5"
                            >
                              <RefreshCw className="size-3.5" />
                              Cambiar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveLogo}
                              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="size-3.5" />
                              Retirar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => logoInputRef.current?.click()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              logoInputRef.current?.click();
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsLogoDragging(true);
                          }}
                          onDragLeave={() => setIsLogoDragging(false)}
                          onDrop={handleLogoDrop}
                          className={cn(
                            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition sm:flex-row sm:justify-start sm:gap-5 sm:text-left',
                            isLogoDragging
                              ? 'border-accent bg-interaction/40'
                              : 'border-border bg-surface-soft/60 hover:border-accent hover:bg-surface-soft',
                          )}
                        >
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-accent shadow-2xs">
                            <ImagePlus className="size-6" />
                          </div>
                          <div className="mt-3 space-y-1 sm:mt-0">
                            <p className="text-sm font-semibold text-ink">
                              Seleccionar o arrastrar logotipo de la empresa
                            </p>
                            <p className="text-xs text-text-secondary">
                              Solo imágenes en formato PNG, JPG o WEBP (máx. 2
                              MB). Recomendado: formato cuadrado o horizontal
                              con fondo transparente.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="companyName"
                        className="mb-1.5 text-xs font-semibold text-ink"
                      >
                        Nombre de la empresa
                        <RequiredMark />
                      </Label>
                      <Input
                        id="companyName"
                        required
                        placeholder="Ej. TecnoAndes Software S.R.L."
                        className="h-11 rounded-md border-border bg-surface px-3 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction"
                        value={form.companyName}
                        onChange={(e) =>
                          setForm({ ...form, companyName: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="sector"
                          className="mb-1.5 text-xs font-semibold text-ink"
                        >
                          Rubro o sector
                          <RequiredMark />
                        </Label>
                        <Input
                          id="sector"
                          required
                          placeholder="Ej. Desarrollo de Software / Fintech"
                          className="h-11 rounded-md border-border bg-surface px-3 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction"
                          value={form.sector}
                          onChange={(e) =>
                            setForm({ ...form, sector: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="cityId"
                          className="mb-1.5 text-xs font-semibold text-ink"
                        >
                          Ciudad sede
                          <RequiredMark />
                        </Label>
                        <NativeSelect
                          id="cityId"
                          required
                          value={form.cityId}
                          onChange={(e) =>
                            setForm({ ...form, cityId: e.target.value })
                          }
                          className="h-11 w-full rounded-md border-border bg-surface px-3 text-base text-ink"
                        >
                          <option value="">Selecciona una ciudad</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="websiteUrl"
                        className="mb-1.5 text-xs font-semibold text-ink"
                      >
                        Sitio web oficial{' '}
                        <span className="font-normal text-text-secondary">
                          (opcional)
                        </span>
                      </Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
                          <Globe aria-hidden="true" className="size-4" />
                        </span>
                        <Input
                          id="websiteUrl"
                          type="url"
                          placeholder="https://www.tuempresa.com"
                          className="h-11 rounded-md border-border bg-surface pl-10 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction"
                          value={form.websiteUrl}
                          onChange={(e) =>
                            setForm({ ...form, websiteUrl: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="description"
                        className="mb-1.5 text-xs font-semibold text-ink"
                      >
                        Descripción de la empresa
                        <RequiredMark />
                      </Label>
                      <Textarea
                        id="description"
                        required
                        rows={4}
                        placeholder="Describe brevemente la actividad principal de tu empresa, áreas tecnológicas en las que trabajan y el perfil de talento que buscan..."
                        className="rounded-md border-border bg-surface p-3 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction"
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                      />
                    </div>
                  </FormFieldset>

                  <FormFieldset title="Contacto y cuenta de reclutador">
                    <div>
                      <Label
                        htmlFor="email"
                        className="mb-1.5 text-xs font-semibold text-ink"
                      >
                        Correo institucional
                        <RequiredMark />
                      </Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
                          <Mail aria-hidden="true" className="size-4" />
                        </span>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="rrhh@tuempresa.com"
                          className="h-11 rounded-md border-border bg-surface pl-10 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-text-secondary">
                        Aquí te enviaremos el resultado de la revisión y el
                        código de activación de tu cuenta.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <Label
                          htmlFor="phone"
                          className="mb-1.5 text-xs font-semibold text-ink"
                        >
                          Teléfono / Celular
                          <RequiredMark />
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
                            <Phone aria-hidden="true" className="size-4" />
                          </span>
                          <Input
                            id="phone"
                            required
                            placeholder="Ej. 76419230"
                            className="h-11 rounded-md border-border bg-surface pl-10 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction"
                            value={form.phone}
                            onChange={(e) =>
                              setForm({ ...form, phone: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="username"
                          className="mb-1.5 text-xs font-semibold text-ink"
                        >
                          Usuario reclutador
                          <RequiredMark />
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
                            <User aria-hidden="true" className="size-4" />
                          </span>
                          <Input
                            id="username"
                            required
                            placeholder="Ej. rrhh.tecnoandes"
                            className="h-11 rounded-md border-border bg-surface pl-10 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction"
                            value={form.username}
                            onChange={(e) =>
                              setForm({ ...form, username: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </FormFieldset>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="h-11 px-6 text-sm font-semibold"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          Continuar al siguiente paso
                          <ChevronRight className="ml-1.5 size-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form
                  onSubmit={handleStep2Submit}
                  className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
                >
                  <div className="flex flex-col gap-5">
                    {documentFile && documentPreviewUrl ? (
                      <DocumentPreviewContent
                        document={{
                          documentType: null,
                          fileName: documentFile.name,
                          fileSize: documentFile.size,
                          mimeType: documentFile.type,
                          previewUrl: documentPreviewUrl,
                          progress: 100,
                          error: documentError,
                        }}
                        isDisabled={submitting}
                        onRemove={handleRemoveDocument}
                      />
                    ) : (
                      <DocumentDropzoneContent
                        isDisabled={submitting}
                        error={documentError}
                        onFileSelected={handleDocumentSelected}
                      />
                    )}

                    <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(1)}
                        disabled={submitting}
                        className="h-11 rounded-md px-5 text-sm font-semibold text-ink"
                      >
                        <ArrowLeft
                          aria-hidden="true"
                          className="mr-1.5 size-4"
                        />
                        Volver a datos de la empresa
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting || !documentFile}
                        className="h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Enviando solicitud...
                          </>
                        ) : (
                          'Enviar solicitud de empresa'
                        )}
                      </Button>
                    </div>
                  </div>

                  <aside className="h-fit rounded-lg border border-border bg-surface p-5">
                    <h2 className="text-base font-bold text-ink">
                      Para que tu solicitud se apruebe sin demoras
                    </h2>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {[
                        'Documento en hoja membretada oficial de la empresa.',
                        'Dirigida a la Dirección de Carrera de Ingeniería de Sistemas e Informática (UMSS).',
                        'Firmada y sellada por el representante legal o responsable de RR. HH.',
                        'Archivo legible en formato PDF, JPG o PNG (máx. 10 MB).',
                      ].map((tip) => (
                        <li key={tip} className="flex gap-2 text-sm text-ink">
                          <Check
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-accent"
                          />
                          {tip}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 flex gap-2 border-t border-border pt-3 text-xs text-text-secondary">
                      <Info
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                      />
                      Si tu carta es observada, recibirás el motivo por correo y
                      podrás subir una nueva.
                    </p>
                  </aside>
                </form>
              )}

              {step === 3 && submitted && (
                <div className="space-y-6 rounded-lg border border-border bg-surface p-8 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-ink">
                      ¡Solicitud empresarial enviada con éxito!
                    </h3>
                    <p className="mx-auto max-w-md text-sm text-text-secondary">
                      Hemos recibido los datos de{' '}
                      <strong>{form.companyName}</strong> y su carta de
                      solicitud. Revisaremos la documentación en un plazo máximo
                      de 48 horas hábiles.
                    </p>
                  </div>

                  <div className="mx-auto max-w-sm rounded-xl border border-border bg-surface-soft p-5">
                    <p className="text-xs font-medium tracking-wider text-text-secondary uppercase">
                      Código de seguimiento
                    </p>
                    <div className="mt-2.5 flex items-center justify-center gap-3">
                      <span className="rounded-md border border-border bg-surface px-3.5 py-1.5 font-mono text-lg font-bold tracking-wide text-accent select-all">
                        {submitted.requestCode}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void handleCopyCode(submitted.requestCode)
                        }
                        className="h-9 gap-1.5 px-3 font-medium"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="size-4 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            <span>Copiar</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="mt-2.5 text-xs text-text-secondary">
                      Guarda este código para consultar el estado de tu
                      solicitud y activar tu cuenta cuando sea aprobada.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isLogoModalOpen && logoPreview && logoFile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logo-preview-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setIsLogoModalOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3
                  id="logo-preview-modal-title"
                  className="text-base font-bold text-ink"
                >
                  Vista previa del logo corporativo
                </h3>
                <p className="text-xs text-text-secondary">
                  {logoFile.name} · {formatFileSize(logoFile.size)}
                  {logoDimensions
                    ? ` · ${logoDimensions.width} × ${logoDimensions.height} px`
                    : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                type="button"
                aria-label="Cerrar vista previa"
                onClick={() => setIsLogoModalOpen(false)}
                className="rounded-lg p-1.5 text-text-secondary transition hover:bg-surface-soft hover:text-ink"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">
                  Contraste de visualización:
                </span>
                <div className="inline-flex rounded-lg border border-border bg-surface-soft p-0.5 text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setPreviewBg('light')}
                    className={cn(
                      'rounded-md px-2.5 py-1 font-medium transition',
                      previewBg === 'light'
                        ? 'bg-surface text-ink shadow-2xs'
                        : 'text-text-secondary hover:text-ink',
                    )}
                  >
                    Fondo claro
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setPreviewBg('dark')}
                    className={cn(
                      'rounded-md px-2.5 py-1 font-medium transition',
                      previewBg === 'dark'
                        ? 'bg-surface text-ink shadow-2xs'
                        : 'text-text-secondary hover:text-ink',
                    )}
                  >
                    Fondo oscuro
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  'flex h-64 items-center justify-center rounded-xl border border-border p-6 transition-colors',
                  previewBg === 'light' ? 'bg-white' : 'bg-slate-900',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Vista previa ampliada del logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-soft/50 px-5 py-3.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="size-4" />
                Retirar logo
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <RefreshCw className="size-4" />
                  Cambiar imagen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsLogoModalOpen(false)}
                >
                  Listo
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={errorModal.open}
        onOpenChange={(isOpen) =>
          setErrorModal((prev) => ({ ...prev, open: isOpen }))
        }
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-full',
                  errorModal.category === 'conflict' &&
                    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
                  errorModal.category === 'server' &&
                    'bg-destructive/15 text-destructive',
                  errorModal.category === 'network' &&
                    'bg-muted text-muted-foreground',
                  errorModal.category === 'validation' &&
                    'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
                )}
              >
                {errorModal.category === 'conflict' ? (
                  <AlertTriangle className="size-5.5" />
                ) : errorModal.category === 'server' ? (
                  <ServerCrash className="size-5.5" />
                ) : errorModal.category === 'network' ? (
                  <WifiOff className="size-5.5" />
                ) : (
                  <AlertCircle className="size-5.5" />
                )}
              </div>
              <div className="text-left">
                <DialogTitle className="text-base font-semibold text-foreground">
                  {errorModal.title}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {errorModal.category === 'conflict'
                    ? 'Validación de información del sistema'
                    : errorModal.category === 'server'
                      ? 'Estado del servicio'
                      : errorModal.category === 'network'
                        ? 'Conectividad'
                        : 'Revisión de formulario'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Motivo del inconveniente
              </p>
              <p className="mt-1.5 text-sm font-medium text-foreground">
                {errorModal.message}
              </p>
              {errorModal.field ? (
                <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Campo observado:
                  </span>
                  <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 font-medium text-foreground">
                    {errorModal.field === 'email'
                      ? 'Correo electrónico de contacto'
                      : errorModal.field === 'companyName'
                        ? 'Nombre comercial / Razón social'
                        : errorModal.field === 'activeRequest'
                          ? 'Solicitud previa en curso'
                          : errorModal.field}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5 rounded-lg border border-border/70 bg-surface-soft p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Info className="size-3.5 text-primary" />
                ¿Qué puedes hacer para continuar?
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {errorModal.recommendation}
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              onClick={() =>
                setErrorModal((prev) => ({ ...prev, open: false }))
              }
              className="w-full sm:w-auto"
            >
              Entendido, revisar datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
