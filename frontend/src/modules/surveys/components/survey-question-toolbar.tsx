import { Copy, Eye, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SurveyQuestionToolbarProps } from "../types/survey-question-toolbar-props.types";

// Barra flotante junto a la pregunta activa. En pantallas chicas se muestra debajo de la tarjeta.
export function SurveyQuestionToolbar({ canAddQuestion, onAddQuestion, onDuplicate, onPreview }: SurveyQuestionToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Acciones de la pregunta"
      className="flex w-fit gap-1 self-end rounded-lg border border-border bg-surface p-1 shadow-sm lg:sticky lg:top-24 lg:flex-col lg:self-start"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Añadir pregunta"
        aria-label="Añadir pregunta"
        disabled={!canAddQuestion}
        onClick={onAddQuestion}
      >
        <PlusCircle className="size-5" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon" title="Duplicar pregunta" aria-label="Duplicar pregunta" onClick={onDuplicate}>
        <Copy className="size-5" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon" title="Vista previa" aria-label="Vista previa de la encuesta" onClick={onPreview}>
        <Eye className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
