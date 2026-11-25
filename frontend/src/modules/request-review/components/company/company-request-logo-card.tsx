"use client";

import { AlertCircle, Download, ImageIcon, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CompanyLogoBg } from "../../types/company-logo-bg.types";
import type { CompanyLogoCardProps } from "../../types/company-logo-card-props.types";

const LOGO_BG_CLASS: Record<CompanyLogoBg, string> = {
  light: "bg-white",
  dark: "bg-slate-900",
  checkered:
    "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:12px_12px]",
};

export function CompanyRequestLogoCard({
  companyName,
  requestCode,
  logoUrl,
  logoError,
  logoBg,
  isRetrying = false,
  onChangeLogoBg,
  onRetry,
}: CompanyLogoCardProps) {
  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-bold text-ink">
              Logotipo Corporativo
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {logoUrl
              ? "Adjuntado"
              : logoError
                ? "Error de descarga"
                : "Opcional (No adjunto)"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-text-secondary">
          Inspección visual del logotipo institucional.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {logoUrl ? (
          <div className="space-y-4">
            <div
              className={`flex h-44 items-center justify-center rounded-xl border border-border p-4 transition-colors ${LOGO_BG_CLASS[logoBg]}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`Logo de ${companyName}`}
                className="max-h-36 max-w-full object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                <span>Fondo:</span>
                <Button
                  type="button"
                  variant={logoBg === "light" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => onChangeLogoBg("light")}
                >
                  Claro
                </Button>
                <Button
                  type="button"
                  variant={logoBg === "dark" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => onChangeLogoBg("dark")}
                >
                  Oscuro
                </Button>
                <Button
                  type="button"
                  variant={logoBg === "checkered" ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => onChangeLogoBg("checkered")}
                >
                  Mosaico
                </Button>
              </div>

              <a
                href={logoUrl}
                download={`logo-${requestCode ?? "empresa"}.png`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Download className="size-3" aria-hidden="true" /> Descargar imagen
              </a>
            </div>
          </div>
        ) : logoError ? (
          <div
            role="alert"
            className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-surface-soft/40 p-4 text-center"
          >
            <AlertCircle
              className="mb-1.5 size-6 text-destructive"
              aria-hidden="true"
            />
            <p className="text-xs font-medium text-ink">{logoError}</p>
            {onRetry ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={onRetry}
                disabled={isRetrying}
                className="mt-2.5 gap-1"
              >
                <RotateCcw className="size-3" aria-hidden="true" />
                {isRetrying ? "Reintentando..." : "Reintentar"}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-soft/40 p-4 text-center text-text-secondary">
            <ImageIcon className="mb-1.5 size-8 text-slate-300" aria-hidden="true" />
            <p className="text-xs">
              La empresa optó por no suministrar un isotipo o logotipo oficial
              al momento de su registro inicial.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
