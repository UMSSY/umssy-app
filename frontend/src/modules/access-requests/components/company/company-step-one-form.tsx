'use client';

import {
  ChevronRight,
  Eye,
  Globe,
  ImagePlus,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { FormFieldset } from '@/shared/components/layout/form-fieldset';
import { RequiredMark } from '../personal-data/required-mark';
import { formatCompanyFileSize } from '../../utils/format-company-file-size';
import type { CompanyStepOneFormProps } from '../../types/company-step-one-form-props.types';

export function CompanyStepOneForm({
  form,
  cities,
  submitting,
  logoInputRef,
  logoFile,
  logoPreview,
  logoDimensions,
  isLogoDragging,
  onFormChange,
  onLogoChange,
  onLogoDrop,
  onSetLogoDragging,
  onOpenLogoModal,
  onRemoveLogo,
  onSubmit,
}: CompanyStepOneFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-lg border border-border bg-surface p-6"
    >
      <FormFieldset title="Identidad corporativa">
        <div>
          <Label className="mb-1.5 text-xs font-semibold text-ink">
            Logo corporativo{' '}
            <span className="font-normal text-text-secondary">(opcional)</span>
          </Label>

          <Input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onLogoChange}
          />

          {logoPreview && logoFile ? (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-soft/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={onOpenLogoModal}
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
                    {logoFile.type.replace('image/', '').toUpperCase()} ·{' '}
                    {formatCompanyFileSize(logoFile.size)}
                    {logoDimensions
                      ? ` · ${logoDimensions.width} × ${logoDimensions.height} px`
                      : ''}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Haz clic en la imagen o en &ldquo;Vista previa&rdquo; para
                    inspeccionar su nitidez.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenLogoModal}
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
                  onClick={onRemoveLogo}
                  className="gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
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
                onSetLogoDragging(true);
              }}
              onDragLeave={() => onSetLogoDragging(false)}
              onDrop={onLogoDrop}
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
                  Solo imágenes en formato PNG, JPG o WEBP (máx. 2 MB).
                  Recomendado: formato cuadrado o horizontal con fondo
                  transparente.
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
              onFormChange({ ...form, companyName: e.target.value })
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
                onFormChange({ ...form, sector: e.target.value })
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
                onFormChange({ ...form, cityId: e.target.value })
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
            <span className="font-normal text-text-secondary">(opcional)</span>
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
                onFormChange({ ...form, websiteUrl: e.target.value })
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
              onFormChange({ ...form, description: e.target.value })
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
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            Aquí te enviaremos el resultado de la revisión y el código de
            activación de tu cuenta.
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
                  onFormChange({ ...form, phone: e.target.value })
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
                  onFormChange({ ...form, username: e.target.value })
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
  );
}
