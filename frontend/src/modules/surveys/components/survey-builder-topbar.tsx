import { ArrowLeft, Eye, Save, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import type { SurveyBuilderTopbarProps } from "../types/survey-component-props.types";

export function SurveyBuilderTopbar({ title, isSaving, onCancel, onPreview, onSaveDraft, onPublish }: SurveyBuilderTopbarProps) {
  return (
    <div className="sticky top-app-header z-20 -mx-12 -mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface-soft px-12 py-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-tight text-xl leading-tight font-bold text-ink">
          {title}
          <Badge className="h-6 border-gold/50 bg-gold/15 px-2 font-semibold text-ink">{SURVEY_TEXT.draftBadge}</Badge>
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving} className="text-ink-soft">
          <ArrowLeft aria-hidden="true" />
          {SURVEY_TEXT.cancel}
        </Button>
        <Button variant="outline" onClick={onPreview} className="bg-surface">
          <Eye aria-hidden="true" />
          {SURVEY_TEXT.preview}
        </Button>
        <Button variant="outline" onClick={onSaveDraft} disabled={isSaving} className="bg-surface">
          <Save aria-hidden="true" />
          {SURVEY_TEXT.saveDraft}
        </Button>
        <Button onClick={onPublish} disabled={isSaving}>
          <Send aria-hidden="true" />
          {SURVEY_TEXT.publish}
        </Button>
      </div>
    </div>
  );
}
