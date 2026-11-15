"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { PublicHeader } from "../request-steps/public-header";
import { companyAccessRequestService } from "../../services/company-access-request.service";
import type {
  CityItem,
  CreateCompanyRequestPayload,
  SubmitCompanyRequestResult,
} from "../../types/company-access-request.types";

interface CompanyAccessRequestFlowProps {
  onSwitchToGraduate: () => void;
}

const STEPS = [
  {
    number: 1,
    title: "Datos de la empresa",
    description: "Información institucional y logo corporativo",
  },
  {
    number: 2,
    title: "Carta de solicitud",
    description: "Documento formal en hoja membretada",
  },
  {
    number: 3,
    title: "Revisión de la carrera",
    description: "Hasta 48 horas hábiles",
  },
  {
    number: 4,
    title: "Activación de cuenta",
    description: "Código enviado a tu correo",
  },
];

export function CompanyAccessRequestFlow({
  onSwitchToGraduate,
}: CompanyAccessRequestFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmitCompanyRequestResult | null>(
    null,
  );

  const [form, setForm] = useState<CreateCompanyRequestPayload>({
    companyName: "",
    sector: "",
    cityId: "",
    description: "",
    email: "",
    phone: "",
    websiteUrl: "",
    username: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("El logo no debe superar los 2 MB.");
      return;
    }
    setError(null);
    setLogoFile(file);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleDocumentChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La carta de solicitud no debe superar los 10 MB.");
      return;
    }
    setError(null);
    setDocumentFile(file);
  }

  async function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const created = await companyAccessRequestService.createDraft(form);
    if (!created.ok) {
      setError(created.message);
      setSubmitting(false);
      return;
    }

    const id = created.data.id;
    setDraftId(id);

    if (logoFile) {
      const logoRes = await companyAccessRequestService.uploadLogo(id, logoFile);
      if (!logoRes.ok) {
        setError(logoRes.message);
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
      setError("Debes adjuntar la carta de solicitud en hoja membretada.");
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
      setSubmitting(false);
      return;
    }

    const submitRes = await companyAccessRequestService.submit(draftId);
    setSubmitting(false);
    if (!submitRes.ok) {
      setError(submitRes.message);
      return;
    }

    setSubmitted(submitRes.data);
    setStep(3);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
        <aside className="w-full border-b border-border bg-surface-soft px-6 py-8 lg:w-80 lg:border-r lg:border-b-0">
          <h2 className="text-xl font-bold text-primary">
            Solicitud de empresa
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Cuatro pasos para registrar tu empresa y publicar ofertas laborales.
          </p>

          <ol className="mt-8 space-y-6">
            {STEPS.map((item) => {
              const active = step === item.number;
              const done = step > item.number;
              return (
                <li key={item.number} className="flex items-start gap-3">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      done
                        ? "border-primary bg-primary text-white"
                        : active
                          ? "border-primary bg-white text-primary"
                          : "border-border bg-white text-text-secondary"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : item.number}
                  </span>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        active || done ? "text-ink" : "text-text-secondary"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-10 flex items-start gap-2.5 border-t border-border pt-6 text-xs text-text-secondary">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Tu documentación empresarial es validada por la Dirección de
              Carrera de Ingeniería de Sistemas e Informática.
            </p>
          </div>
        </aside>

        <section className="flex-1 px-6 py-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-primary sm:text-3xl">
                  Registra tu empresa en la comunidad
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                  Conecta con titulados verificados de Ingeniería de Sistemas e
                  Informática de la UMSS.
                </p>
              </div>

              <div className="inline-flex gap-1 rounded-lg border border-border bg-surface-soft p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSwitchToGraduate}
                >
                  Soy Titulado
                </Button>
                <Button type="button" size="sm">
                  Soy Empresa
                </Button>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {error}
              </div>
            ) : null}

            {step === 1 && (
              <form
                onSubmit={handleStep1Submit}
                className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <label className="group relative flex size-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-surface-soft transition hover:border-primary">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoPreview}
                        alt="Vista previa del logo"
                        className="size-full object-contain p-1.5"
                      />
                    ) : (
                      <>
                        <ImagePlus className="size-6 text-text-secondary group-hover:text-primary" />
                        <span className="mt-1 text-[11px] font-medium text-text-secondary">
                          Subir logo
                        </span>
                      </>
                    )}
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>

                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-ink">
                      Logo corporativo (opcional)
                    </p>
                    <p className="text-xs text-text-secondary">
                      Formatos PNG, JPG, WEBP o SVG (máx. 2 MB). Aparecerá en tus
                      vacantes publicadas.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Nombre de la empresa *</Label>
                    <Input
                      id="companyName"
                      required
                      placeholder="Ej. TecnoAndes Software S.R.L."
                      value={form.companyName}
                      onChange={(e) =>
                        setForm({ ...form, companyName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sector">Rubro o sector *</Label>
                    <Input
                      id="sector"
                      required
                      placeholder="Ej. Desarrollo de Software / Fintech"
                      value={form.sector}
                      onChange={(e) =>
                        setForm({ ...form, sector: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cityId">Ciudad sede *</Label>
                    <NativeSelect
                      id="cityId"
                      required
                      value={form.cityId}
                      onChange={(e) =>
                        setForm({ ...form, cityId: e.target.value })
                      }
                      className="w-full"
                    >
                      <option value="">Selecciona una ciudad</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="websiteUrl">Sitio web oficial *</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      required
                      placeholder="https://www.tuempresa.com"
                      value={form.websiteUrl}
                      onChange={(e) =>
                        setForm({ ...form, websiteUrl: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">
                    Descripción de la empresa *
                  </Label>
                  <Textarea
                    id="description"
                    required
                    rows={3}
                    placeholder="Describe brevemente la actividad principal de tu empresa y el perfil de talento que buscan..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo institucional *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="rrhh@empresa.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono / Celular *</Label>
                    <Input
                      id="phone"
                      required
                      placeholder="Ej. 76419230"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="username">Usuario reclutador *</Label>
                    <Input
                      id="username"
                      required
                      placeholder="Ej. rrhh.tecnoandes"
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        Continuar al siguiente paso
                        <ChevronRight className="ml-1 size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={handleStep2Submit}
                className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-xs"
              >
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    Carta de solicitud en hoja membretada
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    Adjunta una carta oficial firmada y sellada dirigida a la
                    Carrera de Ingeniería de Sistemas e Informática (UMSS)
                    solicitando acceso para publicar vacantes.
                  </p>
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-soft p-8 text-center transition hover:border-primary">
                  {documentFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="size-10 text-primary" />
                      <p className="text-sm font-semibold text-ink">
                        {documentFile.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {(documentFile.size / 1024 / 1024).toFixed(2)} MB · Clic
                        para reemplazar
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="size-10 text-text-secondary" />
                      <p className="text-sm font-semibold text-ink">
                        Selecciona o arrastra tu carta membretada
                      </p>
                      <p className="text-xs text-text-secondary">
                        Formatos permitidos: PDF, JPG o PNG (máximo 10 MB)
                      </p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={handleDocumentChange}
                  />
                </label>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={submitting}
                  >
                    Volver atrás
                  </Button>
                  <Button type="submit" disabled={submitting || !documentFile}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Enviando solicitud...
                      </>
                    ) : (
                      "Enviar solicitud de empresa"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && submitted && (
              <div className="space-y-5 rounded-xl border border-border bg-surface p-8 text-center shadow-xs">
                <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
                <h3 className="text-xl font-bold text-ink">
                  ¡Solicitud empresarial enviada con éxito!
                </h3>
                <p className="mx-auto max-w-md text-sm text-text-secondary">
                  Hemos recibido los datos de{" "}
                  <strong>{form.companyName}</strong> y su carta de solicitud.
                  Revisaremos la documentación en un plazo máximo de 48 horas
                  hábiles.
                </p>

                <div className="mx-auto max-w-xs rounded-lg border border-border bg-surface-soft p-4">
                  <p className="text-xs tracking-wider text-text-secondary uppercase">
                    Código de seguimiento
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-primary">
                    {submitted.requestCode}
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setSubmitted(null);
                      setDraftId(null);
                      setDocumentFile(null);
                    }}
                  >
                    <Building2 className="mr-2 size-4" />
                    Registrar otra empresa
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}