"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CircleAlert, CircleCheck, Info, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "cn";
import type { ReviewDetail } from "../../types/request-review.types";
import { valuesMatch } from "../../utils/compare-values";
import type { ContrastField } from "../../types/contrast-field.types";
import type { DataContrastPanelProps } from "../../types/data-contrast-panel-props.types";
import { DIPLOMA_NOTE_TEXT, NOT_IN_DOCUMENT_TEXT, UNCLEAR_READING_WARNING } from "../../utils/ocr-analysis";

function buildLegacyFields(detail: ReviewDetail): ContrastField[] {
  return [
    { key: "firstName", label: "Nombres", declared: detail.firstName },
    { key: "lastName", label: "Apellidos", declared: detail.lastName },
    { key: "idCardNumber", label: "Carnet de identidad", declared: detail.idCardNumber },
    { key: "sisCode", label: "Código SIS", declared: detail.sisCode },
    { key: "career", label: "Carrera", declared: detail.career },
    { key: "graduationYear", label: "Año de titulación", declared: String(detail.graduationYear) },
  ];
}

const HEAD_CLASS = "h-9 px-4 text-xs font-semibold text-text-secondary";

export function DataContrastPanel({ detail, ocrAnalysis }: DataContrastPanelProps) {
  const legacyFields = buildLegacyFields(detail);
  const [documentValues, setDocumentValues] = useState<Record<string, string>>({});
  const isEditable = detail.status === "in_review";

  // Si no se proporcionó ocrAnalysis, se mantiene el modo manual legacy (100% retrocompatible con tests unitarios existentes)
  if (!ocrAnalysis) {
    const matching = legacyFields.filter((field) =>
      valuesMatch(field.declared, documentValues[field.key] ?? ""),
    ).length;
    const pending = legacyFields.length - matching;

    return (
      <section
        className="overflow-hidden rounded-lg border border-border bg-surface"
        aria-label="Contraste de datos"
      >
        <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <h2 className="font-tight text-lg font-bold text-ink">Contraste de datos</h2>
          {isEditable ? (
            <p className="flex items-center gap-4 text-sm text-ink" aria-live="polite">
              <span className="inline-flex items-center gap-1.5">
                <CircleCheck className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {matching} coinciden
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CircleAlert className="size-4 text-ink-soft" strokeWidth={1.75} aria-hidden="true" />
                {pending} por verificar
              </span>
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
              <Lock className="size-4" strokeWidth={1.75} aria-hidden="true" />
              Solo lectura
            </p>
          )}
        </header>

        <Table className="table-fixed">
          <TableHeader className="bg-surface-soft">
            <TableRow className="hover:bg-transparent">
              <TableHead className={`${HEAD_CLASS} w-[28%]`}>Dato</TableHead>
              <TableHead className={`${HEAD_CLASS} w-[30%]`}>Declarado</TableHead>
              <TableHead className={HEAD_CLASS}>En el documento</TableHead>
              {isEditable ? (
                <TableHead className="w-11 px-2">
                  <span className="sr-only">Resultado</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {legacyFields.map((field) => {
              const matches = valuesMatch(field.declared, documentValues[field.key] ?? "");
              const Icon = matches ? CircleCheck : CircleAlert;
              return (
                <TableRow key={field.key} className="border-border">
                  <TableCell className="px-4 py-3 align-middle whitespace-normal">
                    <Label
                      htmlFor={`contrast-${field.key}`}
                      className="leading-snug font-semibold break-words text-ink"
                    >
                      {field.label}
                    </Label>
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle text-sm whitespace-normal text-ink">
                    {field.declared}
                  </TableCell>
                  <TableCell className="px-4 py-3 align-middle">
                    <Input
                      id={`contrast-${field.key}`}
                      value={documentValues[field.key] ?? ""}
                      onChange={(event) =>
                        setDocumentValues((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={isEditable ? "Valor leído" : "No editable"}
                      readOnly={!isEditable}
                      disabled={!isEditable}
                      className="h-[34px] rounded-lg"
                    />
                  </TableCell>
                  {isEditable ? (
                    <TableCell className="px-2 align-middle">
                      <Icon
                        className={matches ? "size-5 text-ink" : "size-5 text-ink-soft"}
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="sr-only">{matches ? "Coincide" : "Por verificar"}</span>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {isEditable ? null : (
          <p className="border-t border-border px-5 py-3 text-sm text-text-secondary">
            La solicitud ya tiene dictamen o todavía no está en revisión, por eso estos campos no se pueden editar.
          </p>
        )}
      </section>
    );
  }

  // Modo OCR automático (CA6, CA7, CA8, CA9, CA10, CA11, CA15)
  const { fields, matchingCount, pendingCount, isClear } = ocrAnalysis;

  return (
    <section
      className="overflow-hidden rounded-lg border border-border bg-surface"
      aria-label="Contraste de datos"
      data-testid="data-contrast-panel"
    >
      {/* Cabecera con título y resumen de coincidencias (CA8) */}
      <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <h2 className="font-tight text-lg font-bold text-ink">Contraste de datos</h2>
        <div className="flex items-center gap-4 text-xs font-semibold sm:text-sm" aria-live="polite">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <CircleCheck className="size-4" strokeWidth={2} aria-hidden="true" />
            <span>{matchingCount} coinciden</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <AlertTriangle className="size-4" strokeWidth={2} aria-hidden="true" />
            <span>{pendingCount} por verificar</span>
          </span>
        </div>
      </header>

      {/* Advertencia por lectura poco clara y solicitud de revisión manual (CA10, CA11) */}
      {!isClear && (
        <div
          role="alert"
          className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          data-testid="ocr-unclear-warning"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">Advertencia: Lectura automática poco clara</p>
            <p className="text-xs leading-relaxed text-amber-800">
              {UNCLEAR_READING_WARNING}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de contraste (CA6, CA7, CA9, CA15) */}
      <Table className="table-fixed">
        <TableHeader className="bg-surface-soft">
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${HEAD_CLASS} w-[24%]`}>Dato</TableHead>
            <TableHead className={`${HEAD_CLASS} w-[34%]`}>Declarado</TableHead>
            <TableHead className={`${HEAD_CLASS} w-[32%]`}>En el documento</TableHead>
            <TableHead className="w-10 px-2 text-center">
              <span className="sr-only">Estado</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => {
            const matches = field.matches;

            return (
              <TableRow key={field.fieldKey} className="border-border">
                {/* Nombre del dato */}
                <TableCell className="px-4 py-3 align-middle text-xs font-medium whitespace-normal text-ink sm:text-sm">
                  <span className="leading-snug break-words">{field.label}</span>
                </TableCell>

                {/* Valor Declarado */}
                <TableCell className="px-4 py-3 align-middle text-xs break-words whitespace-normal text-ink sm:text-sm">
                  {field.declaredValue}
                </TableCell>

                {/* Valor en el documento (CA6, CA9) */}
                <TableCell className="px-4 py-3 align-middle text-xs break-words whitespace-normal sm:text-sm">
                  {field.fieldKey === "idCard" || field.fieldKey === "sisCode" ? (
                    <span className="text-xs text-text-secondary italic">
                      {NOT_IN_DOCUMENT_TEXT}
                    </span>
                  ) : field.recognizedValue ? (
                    <span
                      className={cn(
                        "font-medium",
                        matches ? "text-ink" : "font-semibold text-amber-800",
                      )}
                    >
                      {field.recognizedValue}
                    </span>
                  ) : (
                    <span className="text-xs text-text-secondary italic" aria-label="Sin datos reconocidos">
                      —
                    </span>
                  )}
                </TableCell>

                {/* Icono de resultado / Estado (CA7, CA15) */}
                <TableCell className="px-2 text-center align-middle">
                  {matches ? (
                    <span
                      className="inline-flex items-center justify-center text-emerald-600"
                      title="Coincide"
                    >
                      <CircleCheck className="size-5" strokeWidth={2} aria-hidden="true" />
                      <span className="sr-only">Coincide</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center justify-center text-amber-600"
                      title="Por verificar"
                    >
                      <AlertTriangle className="size-5" strokeWidth={2} aria-hidden="true" />
                      <span className="sr-only">Por verificar</span>
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Nota informativa al pie para Carnet y Código SIS (CA9) */}
      <footer className="flex items-start gap-2.5 border-t border-border/60 bg-surface-soft/60 px-5 py-3.5 text-xs text-text-secondary">
        <Info className="mt-0.5 size-4 shrink-0 text-text-secondary" aria-hidden="true" />
        <p className="leading-relaxed">{DIPLOMA_NOTE_TEXT}</p>
      </footer>
    </section>
  );
}
