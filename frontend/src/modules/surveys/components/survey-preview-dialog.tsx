"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { UNTITLED_QUESTION_PLACEHOLDER } from "../constants/survey-form.constants";
import type { SurveyPreviewDialogProps } from "../types/survey-preview-dialog-props.types";
import { SurveyOptionMarker } from "./survey-option-marker";

// Muestra la encuesta como la verá el titulado, en solo lectura.
export function SurveyPreviewDialog({ open, values, onOpenChange }: SurveyPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-tight text-xl text-ink">{values.title.trim() || "Encuesta sin título"}</DialogTitle>
          <DialogDescription>{values.description.trim() || "Vista previa de la encuesta."}</DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-4">
          {values.questions.map((question, index) => (
            <li key={question.key} className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <p className="text-sm font-semibold text-ink">
                {index + 1}. {question.text.trim() || UNTITLED_QUESTION_PLACEHOLDER}
                {question.isRequired && <span className="text-destructive"> *</span>}
              </p>
              {question.type === "DROPDOWN" ? (
                <NativeSelect disabled aria-label={`Respuesta de la pregunta ${index + 1}`} className="w-full sm:w-72">
                  <NativeSelectOption value="">Selecciona una opción</NativeSelectOption>
                  {question.options.map((option, optionIndex) => (
                    <NativeSelectOption key={optionIndex} value={option}>
                      {option}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <ul className="flex flex-col gap-2">
                  {question.options.map((option, optionIndex) => (
                    <li key={optionIndex} className="flex items-center gap-3 text-sm text-ink-soft">
                      <SurveyOptionMarker type={question.type} index={optionIndex} />
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
