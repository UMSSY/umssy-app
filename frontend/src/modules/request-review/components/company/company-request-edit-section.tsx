"use client";

import { Building2, Loader2, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CompanyEditSectionProps } from "../../types/company-edit-section-props.types";

export function CompanyRequestEditSection({
  item,
  cityName,
  isEditing,
  isSavingEdit,
  isDataModifiedFromInitial,
  editForm,
  onChangeForm,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onResetInitialData,
}: CompanyEditSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-bold text-ink">
            Ficha Oficial para Registro en Plataforma
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onStartEdit}
                className="gap-1 text-xs font-semibold text-primary"
              >
                <Pencil className="size-3" aria-hidden="true" /> Editar datos
              </Button>
              {isDataModifiedFromInitial && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={onResetInitialData}
                  disabled={isSavingEdit}
                  className="gap-1 text-xs"
                  title="Restablecer datos a como los envió originalmente la empresa"
                >
                  <RotateCcw className="size-3" aria-hidden="true" /> Restablecer
                  datos iniciales
                </Button>
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onCancelEdit}
                disabled={isSavingEdit}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onResetInitialData}
                disabled={isSavingEdit}
                className="gap-1 text-xs"
              >
                <RotateCcw className="size-3" aria-hidden="true" /> Restablecer
              </Button>
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={onSaveEdit}
                disabled={isSavingEdit}
                className="gap-1 text-xs"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="size-3 animate-spin" aria-hidden="true" />{" "}
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {isDataModifiedFromInitial && !isEditing && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-soft/60 px-3 py-1.5 text-xs text-ink">
          <span>
            Ficha con modificaciones aplicadas por el revisor administrativo.
          </span>
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={onResetInitialData}
            className="h-auto p-0 font-bold text-primary underline"
          >
            Restablecer valores iniciales
          </Button>
        </div>
      )}

      {!isEditing ? (
        <div className="mt-3.5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-lg border border-border/80 bg-surface-soft/40 p-2.5">
            <span className="text-[10px] font-semibold text-text-secondary uppercase">
              Razón Social / Nombre Comercial
            </span>
            <p className="mt-0.5 font-bold text-ink">{item.companyName}</p>
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
              {item.websiteUrl || "No especificado (Opcional)"}
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
              value={editForm.companyName ?? ""}
              onChange={(e) =>
                onChangeForm((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
              className="mt-1 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Rubro / Sector *</Label>
              <Input
                value={editForm.sector ?? ""}
                onChange={(e) =>
                  onChangeForm((prev) => ({ ...prev, sector: e.target.value }))
                }
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">
                Teléfono de Contacto *
              </Label>
              <Input
                value={editForm.phone ?? ""}
                onChange={(e) =>
                  onChangeForm((prev) => ({ ...prev, phone: e.target.value }))
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
                value={editForm.email ?? ""}
                onChange={(e) =>
                  onChangeForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">
                Usuario Reclutador *
              </Label>
              <Input
                value={editForm.username ?? ""}
                onChange={(e) =>
                  onChangeForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Sitio Web Oficial</Label>
            <Input
              value={editForm.websiteUrl ?? ""}
              onChange={(e) =>
                onChangeForm((prev) => ({
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
              value={editForm.description ?? ""}
              onChange={(e) =>
                onChangeForm((prev) => ({
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
  );
}
