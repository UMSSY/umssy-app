'use client';

import {
  CheckCircle2,
  Clock,
  LoaderCircle,
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CompanyActivationStatusCardsProps } from '../../types/company-activation-status-cards-props.types';

const UNAVAILABLE_STATES = new Set([
  'INVALID',
  'NOT_FOUND',
  'REJECTED',
  'OBSERVED',
  'PENDING',
]);

export function CompanyActivationStatusCards({
  state,
  serverMessage,
  officialData,
  trackingCode,
  codeError,
  isVerifyingCode,
  onTrackingCodeChange,
  onVerifyCode,
  onGoToLogin,
}: CompanyActivationStatusCardsProps) {
  if (state === 'ALREADY_ACTIVATED') {
    return (
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
          posible volver a realizar este proceso ni modificar credenciales desde
          este enlace.
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            variant="institutional"
            onClick={onGoToLogin}
            className="h-11 px-6 font-semibold"
          >
            Ir a Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'EXPIRED') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm sm:p-8">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="size-6" />
        </div>
        <h1 className="mt-4 text-center font-tight text-2xl font-bold text-ink">
          Enlace o código de activación expirado
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          El plazo reglamentario de 24 horas para completar la activación de su
          cuenta institucional ha vencido. Por favor comuníquese con el
          administrador institucional o soporte para solicitar la emisión de un
          nuevo acceso.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={onGoToLogin}
            className="h-11 px-6 font-semibold"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  if (UNAVAILABLE_STATES.has(state)) {
    return (
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
            onClick={onGoToLogin}
            className="h-11 px-6 font-semibold"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'REQUIRES_CODE') {
    return (
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
          Por motivos de seguridad institucional y para proteger la información
          de su empresa, ingrese el{' '}
          <strong>código de seguimiento oficial</strong> asignado a su solicitud
          (ej. <code>EMP-2026-XXXX</code>) para proceder a la revisión de datos
          y creación de su cuenta.
        </p>

        <form onSubmit={onVerifyCode} className="mt-6 space-y-4">
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
              onChange={(e) => onTrackingCodeChange(e.target.value.toUpperCase())}
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
    );
  }

  if (state === 'SUCCESS' && officialData) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-8" />
        </div>

        <h1 className="mt-4 text-center font-tight text-3xl font-extrabold text-ink">
          ¡Registro Institucional Exitoso!
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Su cuenta institucional ha sido activada y los datos de su empresa han
          quedado formalmente registrados en la plataforma UMSSY.
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
            onClick={onGoToLogin}
            className="h-12 px-8 text-base font-bold shadow-sm"
          >
            Iniciar Sesión Ahora
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
