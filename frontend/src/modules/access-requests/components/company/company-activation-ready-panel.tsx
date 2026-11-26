'use client';

import {
  AlertTriangle,
  Building2,
  Check,
  Eye,
  EyeOff,
  Globe,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CompanyActivationReadyPanelProps } from '../../types/company-activation-ready-panel-props.types';

export function CompanyActivationReadyPanel({
  officialData,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  hasMinLength,
  hasUppercase,
  hasNumber,
  passwordsMatch,
  canFinalize,
  activationError,
  onPasswordChange,
  onConfirmPasswordChange,
  onToggleShowPassword,
  onToggleShowConfirmPassword,
  onOpenReport,
  onOpenConfirm,
}: CompanyActivationReadyPanelProps) {
  const officialFields = [
    {
      label: 'Razón Social / Nombre',
      value: officialData.companyName,
      icon: Building2,
      bold: true,
    },
    { label: 'Ciudad Sede', value: officialData.city, icon: MapPin },
    { label: 'Rubro / Sector', value: officialData.sector, icon: Building2 },
    { label: 'Correo Corporativo', value: officialData.email, icon: Mail },
    { label: 'Teléfono de Contacto', value: officialData.phone, icon: Phone },
    {
      label: 'Sitio Web Oficial',
      value: officialData.websiteUrl || 'No especificado',
      icon: Globe,
      truncate: true,
    },
  ];

  const passwordChecks = [
    { ok: hasMinLength, label: 'Mínimo 8 caracteres' },
    { ok: hasUppercase, label: 'Al menos una letra mayúscula' },
    { ok: hasNumber, label: 'Al menos un número' },
  ];

  return (
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
          Los siguientes datos han sido verificados y aprobados oficialmente.
          Quedarán registrados de forma inalterable en el sistema institucional
          UMSSY.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {officialFields.map((field) => {
            const Icon = field.icon;
            return (
              <div
                key={field.label}
                className="rounded-lg border border-border bg-neutral-50/50 p-3"
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                  <Icon className="size-3.5" />
                  {field.label}
                </span>
                <p
                  className={`mt-1 text-sm text-ink ${
                    field.bold ? 'font-bold' : 'font-semibold'
                  } ${field.truncate ? 'truncate' : ''}`}
                >
                  {field.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            ¿Detectó algún error en estos datos oficiales?
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenReport}
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
            Estos serán sus datos para iniciar sesión en la plataforma UMSSY.
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
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="h-11 pr-11 text-ink"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleShowPassword}
                aria-label={
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
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
              {passwordChecks.map((rule) => (
                <div key={rule.label} className="flex items-center gap-1.5 text-xs">
                  {rule.ok ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-muted-foreground" />
                  )}
                  <span
                    className={
                      rule.ok
                        ? 'font-semibold text-emerald-600'
                        : 'text-muted-foreground'
                    }
                  >
                    {rule.label}
                  </span>
                </div>
              ))}
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
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="Reescriba la contraseña"
                className="h-11 pr-11 text-ink"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleShowConfirmPassword}
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
            onClick={onOpenConfirm}
            className="h-12 px-8 text-sm font-bold tracking-tight shadow-sm"
          >
            Terminar Registro y Activar Cuenta
          </Button>
        </div>
      </div>
    </div>
  );
}
