"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CompanyMetadataCardProps } from "../../types/company-metadata-card-props.types";

export function CompanyRequestMetadataCard({
  statusLabel,
  requestCode,
  submittedAt,
  ocrPercentage,
  canResolve,
  onOpenResolution,
}: CompanyMetadataCardProps) {
  return (
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
          <span className="font-semibold text-ink">{statusLabel}</span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-text-secondary">Código único:</span>
          <span className="font-semibold text-ink">
            {requestCode ?? "Sin código"}
          </span>
        </div>
        <div className="flex justify-between border-b border-border/60 pb-2">
          <span className="text-text-secondary">Fecha de ingreso:</span>
          <span className="font-medium text-ink">
            {submittedAt
              ? new Date(submittedAt).toLocaleString("es-BO")
              : "No disponible"}
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
              variant="institutional"
              onClick={onOpenResolution}
              className="w-full"
            >
              Abrir ventana de resolución
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
