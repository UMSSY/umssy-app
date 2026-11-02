"use client";

import { usePathname, useRouter } from "next/navigation";
import { CircleAlert, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildLoginUrl, endSession } from "@/modules/auth";
import type { AuditLogStatusProps } from "../../types/audit-log-component-props.types";

const BUTTON_CLASS = "h-[34px] rounded-lg px-4 text-sm font-semibold";

// Distingue error de conexión, sesión vencida, falta de permiso y lista vacía
export function AuditLogStatus({ error, errorStatus, isEmpty, hasActiveFilters = false, onRetry, onClearFilters }: AuditLogStatusProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (error) {
    const isSessionExpired = errorStatus === 401;
    return (
      <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft" aria-hidden="true">
          <CircleAlert className="size-5 text-danger" strokeWidth={1.75} />
        </span>
        <p className="font-semibold text-ink">No se pudo cargar el registro de auditoría</p>
        <p className="text-sm text-text-secondary">{error}</p>
        {isSessionExpired ? (
          <Button
            type="button"
            className={BUTTON_CLASS}
            onClick={() => {
              endSession();
              router.replace(buildLoginUrl(pathname));
            }}
          >
            Iniciar sesión
          </Button>
        ) : errorStatus === 403 ? null : (
          <Button type="button" className={BUTTON_CLASS} onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (!isEmpty) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-soft" aria-hidden="true">
        <SearchX className="size-5 text-text-secondary" strokeWidth={1.75} />
      </span>
      <p className="font-semibold text-ink">{hasActiveFilters ? "No se encontraron resultados" : "No hay eventos registrados en el período"}</p>
      <p className="text-sm text-text-secondary">
        {hasActiveFilters
          ? "Ningún evento coincide con la búsqueda o los filtros aplicados. Prueba con otro período o quita algún filtro."
          : "Los eventos aparecen aquí cuando se envía, revisa, aprueba o rechaza una solicitud. Cambia el período para ver meses anteriores."}
      </p>
      {hasActiveFilters && onClearFilters ? (
        <Button type="button" variant="brand" className={BUTTON_CLASS} onClick={onClearFilters}>
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  );
}
