'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Globe,
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { companyAccessRequestService } from '../services/company-access-request.service';
import type { CompanyOfficialData } from '../types/company-access-request.types';

export function CompanyAccountActivationView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email')?.trim().toLowerCase() ?? '';
  const otpParam =
    searchParams.get('otp')?.trim() ?? searchParams.get('token')?.trim() ?? '';
  const codeParam = searchParams.get('code')?.trim().toUpperCase() ?? '';

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<
    | 'LOADING'
    | 'INVALID'
    | 'NOT_FOUND'
    | 'PENDING'
    | 'REJECTED'
    | 'OBSERVED'
    | 'ALREADY_ACTIVATED'
    | 'EXPIRED'
    | 'REQUIRES_CODE'
    | 'READY'
    | 'SUCCESS'
  >('LOADING');
  const [serverMessage, setServerMessage] = useState('');
  const [officialData, setOfficialData] = useState<CompanyOfficialData | null>(
    null,
  );

  const [trackingCode, setTrackingCode] = useState(codeParam);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifyingCode, startVerifyCode] = useTransition();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportObservation, setReportObservation] = useState('');
  const [reportStatus, setReportStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [reportMessage, setReportMessage] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const canFinalize =
    isPasswordValid && passwordsMatch && !isActivating && officialData !== null;

  useEffect(() => {
    async function checkStatus() {
      if (!emailParam) {
        setState('INVALID');
        setServerMessage(
          'Debe acceder a este apartado mediante el enlace oficial enviado a su correo electrónico.',
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await companyAccessRequestService.getActivationStatus({
        email: emailParam,
        code: codeParam || undefined,
        otp: otpParam || undefined,
      });

      if (!res.ok) {
        setState('INVALID');
        setServerMessage(
          res.message || 'No se pudo verificar el estado de la solicitud.',
        );
        setLoading(false);
        return;
      }

      const result = res.data;
      if (result.state === 'READY' && result.data) {
        setOfficialData(result.data);
        setState('READY');
      } else if (result.state === 'ALREADY_ACTIVATED') {
        setState('ALREADY_ACTIVATED');
        setServerMessage(
          result.message || 'Esta cuenta institucional ya ha sido activada.',
        );
      } else if (result.state === 'EXPIRED') {
        setState('EXPIRED');
        setServerMessage(
          result.message ||
            'El enlace o código de activación ha expirado (plazo de 24 horas vencido).',
        );
      } else if (
        result.state === 'REQUIRES_CODE' ||
        result.state === 'INVALID_CODE'
      ) {
        setState('REQUIRES_CODE');
        setServerMessage(result.message || '');
      } else {
        setState(result.state);
        setServerMessage(
          result.message ||
            'La solicitud no se encuentra en estado apto para activación.',
        );
      }
      setLoading(false);
    }

    void checkStatus();
  }, [emailParam, codeParam, otpParam]);

  function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setCodeError('Ingrese el código de seguimiento de su solicitud.');
      return;
    }

    setCodeError(null);
    startVerifyCode(async () => {
      const res = await companyAccessRequestService.getActivationStatus({
        email: emailParam,
        code: trackingCode.trim().toUpperCase(),
        otp: otpParam || undefined,
      });

      if (!res.ok) {
        setCodeError(
          res.message || 'Error al verificar el código de seguimiento.',
        );
        return;
      }

      const result = res.data;
      if (result.state === 'READY' && result.data) {
        setOfficialData(result.data);
        setState('READY');
      } else if (result.state === 'INVALID_CODE') {
        setCodeError(
          result.message ||
            'El código de seguimiento no coincide con la solicitud registrada.',
        );
      } else if (result.state === 'ALREADY_ACTIVATED') {
        setState('ALREADY_ACTIVATED');
      } else if (result.state === 'EXPIRED') {
        setState('EXPIRED');
      } else {
        setCodeError(result.message || 'No se pudo validar el código.');
      }
    });
  }

  async function handleSendReport() {
    if (!reportObservation.trim() || reportObservation.trim().length < 5) {
      setReportMessage(
        'Por favor describa la observación con al menos 5 caracteres.',
      );
      setReportStatus('error');
      return;
    }

    setReportStatus('sending');
    const res = await companyAccessRequestService.reportInconsistency({
      requestCode: officialData?.requestCode || trackingCode,
      email: emailParam,
      observation: reportObservation.trim(),
    });

    if (res.ok) {
      setReportStatus('success');
      setReportMessage(
        'Su observación fue registrada formalmente para revisión administrativa.',
      );
      setTimeout(() => {
        setIsReportOpen(false);
        setReportObservation('');
        setReportStatus('idle');
      }, 2000);
    } else {
      setReportStatus('error');
      setReportMessage(
        res.message || 'No se pudo registrar el reporte de inconsistencia.',
      );
    }
  }

  async function handleConfirmActivation() {
    if (!officialData || !canFinalize) return;

    setIsActivating(true);
    setActivationError(null);

    const res = await companyAccessRequestService.activateAccount({
      requestCode: officialData.requestCode,
      email: officialData.email,
      code: otpParam,
      password,
    });

    if (res.ok) {
      setIsConfirmModalOpen(false);
      setState('SUCCESS');
    } else {
      setActivationError(
        res.message ||
          'No se pudo completar la activación. Verifique que el código no haya expirado.',
      );
      setIsActivating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-tight text-xl font-black tracking-tight text-primary">
              UMSSY
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              | Plataforma Institucional
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-ink"
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LoaderCircle className="size-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Verificando enlace institucional...
            </p>
          </div>
        )}

        
        {!loading && state === 'ALREADY_ACTIVATED' && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="mt-4 text-center font-tight text-2xl font-bold text-ink">
              Cuenta ya registrada y activada
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Esta cuenta institucional ya fue registrada y activada con éxito
              anteriormente. Por motivos de seguridad y confidencialidad, no es
              posible volver a realizar este proceso ni modificar credenciales
              desde este enlace.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                variant="institutional"
                onClick={() => router.push('/login')}
                className="h-11 px-6 font-semibold"
              >
                Ir a Iniciar Sesión
              </Button>
            </div>
          </div>
        )}

        
        {!loading && state === 'EXPIRED' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm sm:p-8">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="size-6" />
            </div>
            <h1 className="mt-4 text-center font-tight text-2xl font-bold text-ink">
              Enlace o código de activación expirado
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              El plazo reglamentario de 24 horas para completar la activación de
              su cuenta institucional ha vencido. Por favor comuníquese con el
              administrador institucional o soporte para solicitar la emisión de
              un nuevo acceso.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="h-11 px-6 font-semibold"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        )}

        
        {!loading &&
          (state === 'INVALID' ||
            state === 'NOT_FOUND' ||
            state === 'REJECTED' ||
            state === 'OBSERVED' ||
            state === 'PENDING') && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <ShieldAlert className="size-6" />
              </div>
              <h1 className="mt-4 text-center font-tight text-2xl font-bold text-ink">
                Acceso no disponible
              </h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {serverMessage ||
                  'No se puede acceder a la activación con estos parámetros. Verifique el enlace recibido por correo.'}
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/login')}
                  className="h-11 px-6 font-semibold"
                >
                  Volver al Inicio
                </Button>
              </div>
            </div>
          )}

        
        {!loading && state === 'REQUIRES_CODE' && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3 border-b border-border pb-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="size-5" />
              </div>
              <div>
                <h1 className="font-tight text-xl font-bold text-ink">
                  Activación Institucional de Empresa
                </h1>
                <p className="text-xs text-muted-foreground">
                  Validación de identidad y código de seguimiento
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Por motivos de seguridad institucional y para proteger la
              información de su empresa, ingrese el{' '}
              <strong>código de seguimiento oficial</strong> asignado a su
              solicitud (ej. <code>EMP-2026-XXXX</code>) para proceder a la
              revisión de datos y creación de su cuenta.
            </p>

            <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
              <div>
                <Label
                  htmlFor="tracking-code"
                  className="text-xs font-semibold text-ink"
                >
                  Código de seguimiento oficial *
                </Label>
                <Input
                  id="tracking-code"
                  type="text"
                  placeholder="EMP-2026-0001"
                  value={trackingCode}
                  onChange={(e) => {
                    setTrackingCode(e.target.value.toUpperCase());
                    setCodeError(null);
                  }}
                  className="mt-1.5 h-11 font-mono text-ink uppercase"
                  autoFocus
                />
                {codeError && (
                  <p className="mt-1.5 text-xs font-medium text-destructive">
                    {codeError}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="institutional"
                  disabled={isVerifyingCode || !trackingCode.trim()}
                  className="h-11 px-6 font-semibold"
                >
                  {isVerifyingCode ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="size-4 animate-spin" />
                      Verificando...
                    </span>
                  ) : (
                    'Verificar y Continuar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        
        {!loading && state === 'READY' && officialData && (
          <div className="space-y-6">
            
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <Check className="size-3.5" />
                    Solicitud Aprobada por Administración
                  </span>
                  <h1 className="mt-2 font-tight text-2xl font-bold text-ink">
                    Activación de Cuenta Institucional
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Código de Solicitud
                  </span>
                  <p className="font-mono text-xs font-bold text-ink">
                    {officialData.requestCode}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Los siguientes datos han sido verificados y aprobados
                oficialmente. Quedarán registrados de forma inalterable en el
                sistema institucional UMSSY.
              </p>

              
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    <Building2 className="size-3.5" />
                    Razón Social / Nombre
                  </span>
                  <p className="mt-1 text-sm font-bold text-ink">
                    {officialData.companyName}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    <MapPin className="size-3.5" />
                    Ciudad Sede
                  </span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {officialData.city}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    <Building2 className="size-3.5" />
                    Rubro / Sector
                  </span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {officialData.sector}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    <Mail className="size-3.5" />
                    Correo Corporativo
                  </span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {officialData.email}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    <Phone className="size-3.5" />
                    Teléfono de Contacto
                  </span>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {officialData.phone}
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-neutral-50/50 p-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                    <Globe className="size-3.5" />
                    Sitio Web Oficial
                  </span>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {officialData.websiteUrl || 'No especificado'}
                  </p>
                </div>
              </div>

              
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  ¿Detectó algún error en estos datos oficiales?
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReportOpen(true)}
                  className="h-8 text-xs font-semibold text-muted-foreground hover:text-ink"
                >
                  <AlertTriangle className="mr-1.5 size-3.5 text-amber-600" />
                  Reportar datos incorrectos
                </Button>
              </div>
            </div>

            
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h2 className="font-tight text-lg font-bold text-ink">
                  Credenciales de Acceso Institucional
                </h2>
                <p className="text-xs text-muted-foreground">
                  Estos serán sus datos para iniciar sesión en la plataforma
                  UMSSY.
                </p>
              </div>

              
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Usuario asignado (Reclutador)
                  </Label>
                  <div className="mt-1.5 flex h-11 items-center rounded-lg border border-border bg-neutral-100/70 px-3 font-mono text-sm font-semibold text-ink">
                    @{officialData.username}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Correo para iniciar sesión
                  </Label>
                  <div className="mt-1.5 flex h-11 items-center rounded-lg border border-border bg-neutral-100/70 px-3 text-sm font-semibold text-ink">
                    {officialData.email}
                  </div>
                </div>
              </div>

              
              <div className="mt-6 space-y-4">
                <div>
                  <Label
                    htmlFor="new-password"
                    className="text-xs font-semibold text-ink"
                  >
                    Nueva contraseña institucional *
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="h-11 pr-11 text-ink"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-ink"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>

                  
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      {hasMinLength ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-muted-foreground" />
                      )}
                      <span
                        className={
                          hasMinLength
                            ? 'font-semibold text-emerald-600'
                            : 'text-muted-foreground'
                        }
                      >
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {hasUppercase ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-muted-foreground" />
                      )}
                      <span
                        className={
                          hasUppercase
                            ? 'font-semibold text-emerald-600'
                            : 'text-muted-foreground'
                        }
                      >
                        Al menos una letra mayúscula
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      {hasNumber ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-muted-foreground" />
                      )}
                      <span
                        className={
                          hasNumber
                            ? 'font-semibold text-emerald-600'
                            : 'text-muted-foreground'
                        }
                      >
                        Al menos un número
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="confirm-password"
                    className="text-xs font-semibold text-ink"
                  >
                    Confirmar nueva contraseña *
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Reescriba la contraseña"
                      className="h-11 pr-11 text-ink"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-ink"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs font-medium">
                      {passwordsMatch ? (
                        <>
                          <Check className="size-3.5 text-emerald-600" />
                          <span className="text-emerald-600">
                            Las contraseñas coinciden
                          </span>
                        </>
                      ) : (
                        <span className="text-destructive">
                          Las contraseñas no coinciden
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {activationError && (
                <Alert className="mt-5 border-destructive/30 bg-destructive/5 text-destructive">
                  <AlertTitle className="text-xs font-bold">
                    Error de activación
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {activationError}
                  </AlertDescription>
                </Alert>
              )}

              
              <div className="mt-8 flex justify-end border-t border-border pt-5">
                <Button
                  type="button"
                  variant="institutional"
                  disabled={!canFinalize}
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="h-12 px-8 text-sm font-bold tracking-tight shadow-sm"
                >
                  Terminar Registro y Activar Cuenta
                </Button>
              </div>
            </div>
          </div>
        )}

        
        {!loading && state === 'SUCCESS' && officialData && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>

            <h1 className="mt-4 text-center font-tight text-3xl font-extrabold text-ink">
              ¡Registro Institucional Exitoso!
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Su cuenta institucional ha sido activada y los datos de su empresa
              han quedado formalmente registrados en la plataforma UMSSY.
            </p>

            
            <div className="mt-6 rounded-lg border border-border bg-neutral-50/60 p-5">
              <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Resumen de Datos Registrados
              </h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-medium text-muted-foreground">
                    Empresa Registrada
                  </dt>
                  <dd className="font-tight text-sm font-bold text-ink">
                    {officialData.companyName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-muted-foreground">
                    Ciudad Sede
                  </dt>
                  <dd className="text-sm font-medium text-ink">
                    {officialData.city}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-muted-foreground">
                    Usuario Reclutador
                  </dt>
                  <dd className="font-mono text-sm font-semibold text-ink">
                    @{officialData.username}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium text-muted-foreground">
                    Correo de Acceso
                  </dt>
                  <dd className="text-sm font-semibold text-ink">
                    {officialData.email}
                  </dd>
                </div>
              </dl>
            </div>

            
            <Alert className="mt-6 border-emerald-200 bg-emerald-50/50">
              <UserCheck className="size-4 text-emerald-600" />
              <AlertTitle className="text-xs font-bold text-emerald-800">
                Acceso Habilitado
              </AlertTitle>
              <AlertDescription className="text-xs text-emerald-700">
                Ya puede iniciar sesión en la plataforma utilizando su correo
                institucional y la contraseña que acaba de configurar.
              </AlertDescription>
            </Alert>

            
            <div className="mt-8 flex justify-center">
              <Button
                variant="institutional"
                onClick={() => router.push('/login')}
                className="h-12 px-8 text-base font-bold shadow-sm"
              >
                Iniciar Sesión Ahora
              </Button>
            </div>
          </div>
        )}
      </main>

      
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-tight text-lg font-bold text-ink">
              <AlertTriangle className="size-5 text-amber-600" />
              Reportar Inconsistencia en Datos
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Si detecta errores tipográficos o datos discrepantes con la
              documentación de su empresa, descríbalos a continuación. La
              administración recibirá su observación formalmente.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            <Label
              htmlFor="report-obs"
              className="text-xs font-semibold text-ink"
            >
              Detalle de la observación *
            </Label>
            <Textarea
              id="report-obs"
              rows={4}
              placeholder="Ej. El número de teléfono corporativo debe ser corregido a..."
              value={reportObservation}
              onChange={(e) => setReportObservation(e.target.value)}
              className="text-xs text-ink"
            />
            {reportMessage && (
              <p
                className={`text-xs font-medium ${
                  reportStatus === 'success'
                    ? 'text-emerald-600'
                    : 'text-destructive'
                }`}
              >
                {reportMessage}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReportOpen(false)}
              disabled={reportStatus === 'sending'}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="institutional"
              size="sm"
              onClick={handleSendReport}
              disabled={reportStatus === 'sending' || !reportObservation.trim()}
            >
              {reportStatus === 'sending' ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
      <Dialog
        open={isConfirmModalOpen}
        onOpenChange={(open) => !isActivating && setIsConfirmModalOpen(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-tight text-lg font-bold text-ink">
              ¿Confirmar activación institucional?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se registrará formalmente la empresa{' '}
              <strong>{officialData?.companyName}</strong> y se habilitará el
              usuario <strong>@{officialData?.username}</strong> con el correo{' '}
              <strong>{officialData?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <p className="mt-2 text-xs text-muted-foreground">
            Esta acción creará formalmente su usuario en el sistema. Asegúrese
            de recordar la contraseña ingresada.
          </p>

          <DialogFooter className="mt-5 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isActivating}
            >
              Revisar Datos
            </Button>
            <Button
              type="button"
              variant="institutional"
              onClick={handleConfirmActivation}
              disabled={isActivating}
              className="font-bold"
            >
              {isActivating ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Activando...
                </span>
              ) : (
                'Confirmar y Finalizar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
