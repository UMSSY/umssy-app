"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CompanyOcrComparisonProps } from "../../types/company-ocr-comparison-props.types";

const FIELD_ICONS = {
  companyName: Building2,
  city: MapPin,
  email: Mail,
  phone: Phone,
  websiteUrl: Globe,
  sector: Building2,
  requestIntent: FileText,
} as const;

export function CompanyRequestOcrComparison({
  comparisons,
  ocrPercentage,
  confirmedCount,
  unconfirmedCount,
  reEvaluatingOcr,
  submitting,
  onReEvaluateOcr,
}: CompanyOcrComparisonProps) {
  return (
    <section
      className="space-y-4 lg:col-span-6"
      aria-labelledby="section-contrast"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 id="section-contrast" className="text-base font-bold text-ink">
            Contraste de Datos y Verificación OCR
          </h2>
          <p className="text-xs text-text-secondary">
            Cotejo minucioso campo por campo entre los datos del registro y el
            contenido extraído del documento adjunto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReEvaluateOcr}
            disabled={reEvaluatingOcr || submitting}
            className="gap-1.5 text-xs font-semibold"
          >
            {reEvaluatingOcr ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />{" "}
                Analizando OCR...
              </>
            ) : (
              <>
                <RotateCcw className="size-3.5 text-primary" aria-hidden="true" />{" "}
                Re-analizar OCR
              </>
            )}
          </Button>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs">
            <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
            {confirmedCount} confirmados
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs">
            <XCircle className="size-3.5 text-rose-600" aria-hidden="true" />
            {unconfirmedCount} por verificar
          </span>
        </div>
      </div>

      <Card className="border-border bg-surface shadow-xs">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <CardTitle className="text-sm font-bold text-ink">
                Porcentaje de Coincidencia OCR
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-ink">
                {ocrPercentage}%
              </span>
              <Badge
                variant={
                  ocrPercentage >= 60
                    ? "default"
                    : ocrPercentage >= 35
                      ? "secondary"
                      : "destructive"
                }
                className="text-xs font-semibold"
              >
                {ocrPercentage >= 60
                  ? "Alta Coincidencia"
                  : ocrPercentage >= 35
                    ? "Coincidencia Parcial"
                    : "Baja Coincidencia"}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs text-text-secondary">
            Nivel de certidumbre basado en el análisis del texto extraído de la
            carta membretada.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <Progress value={ocrPercentage} className="h-2" />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3.5">
        {comparisons.map((comp) => {
          const IconComponent =
            FIELD_ICONS[comp.id as keyof typeof FIELD_ICONS] ?? FileText;
          const isMatched = comp.data.matched;
          const hasDetectedText = Boolean(comp.data.detectedText);

          return (
            <div
              key={comp.id}
              className="flex flex-col rounded-xl border border-border bg-surface p-3.5 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <IconComponent className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-xs font-bold text-ink sm:text-sm">
                    {comp.label}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                    isMatched
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : hasDetectedText
                        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                  }`}
                >
                  {isMatched ? (
                    <>
                      <CheckCircle2
                        className="size-3 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      Coincide
                    </>
                  ) : hasDetectedText ? (
                    <>
                      <AlertCircle
                        className="size-3 text-rose-600 dark:text-rose-400"
                        aria-hidden="true"
                      />
                      Discrepancia
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3 text-slate-500" aria-hidden="true" />
                      No detectado
                    </>
                  )}
                </span>
              </div>

              <div className="mt-2.5 grid grid-cols-1 items-stretch gap-2.5 sm:grid-cols-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-text-secondary">
                    Declarado:
                  </span>
                  <div className="mt-1 flex min-h-[42px] flex-1 items-center justify-start rounded-md border border-border/80 bg-surface-soft/40 p-2.5 text-left text-xs leading-normal font-medium text-ink">
                    <span>{comp.data.declared || "No especificado"}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-medium text-text-secondary">
                    Extraído (OCR):
                  </span>
                  {comp.data.detectedText ? (
                    <div className="mt-1 flex min-h-[42px] flex-1 items-center justify-start rounded-md border border-border/80 bg-surface-soft/40 p-2.5 text-left text-xs leading-normal font-medium text-ink">
                      <span>{comp.data.detectedText}</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex min-h-[42px] flex-1 items-center justify-start rounded-md border border-border/60 bg-surface-soft/30 p-2.5 text-left text-xs font-medium text-text-secondary italic">
                      <span>No detectado en el documento</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
