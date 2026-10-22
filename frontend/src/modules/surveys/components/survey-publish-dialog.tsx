"use client";

import { Send } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SurveyPublishDialogProps } from "../types/survey-publish-dialog-props.types";

export function SurveyPublishDialog({ open, summary, isPublishing, onOpenChange, onConfirm }: SurveyPublishDialogProps) {
  const rows = [
    ["Encuesta", summary.title],
    ["Dirigida a", summary.audience],
    ["Vigencia", summary.validity],
    ["Preguntas", summary.questions],
  ];

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !isPublishing && onOpenChange(nextOpen)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Publicar encuesta?</AlertDialogTitle>
          <AlertDialogDescription>
            Una vez publicada, será visible para los titulados de la carrera seleccionada durante su vigencia y ya no se
            podrán editar sus preguntas ni opciones.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border border-border bg-surface-soft p-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="text-right font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <AlertDialogFooter>
          <AlertDialogCancel type="button" disabled={isPublishing}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={isPublishing}
            onClick={onConfirm}
            className="gap-2 bg-ink text-surface hover:bg-ink-soft"
          >
            <Send className="size-4" aria-hidden="true" />
            {isPublishing ? "Publicando..." : "Publicar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
