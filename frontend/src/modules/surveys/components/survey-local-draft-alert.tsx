import { History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import type { SurveyLocalDraftAlertProps } from "../types/survey-component-props.types";
import { formatIsoDateTime } from "../utils/survey-dates";

export function SurveyLocalDraftAlert({ draft, onResume, onDiscard }: SurveyLocalDraftAlertProps) {
  return (
    <Alert role="status" className="rounded-lg border-gold/50 bg-gold/10 px-4 py-3">
      <History aria-hidden="true" />
      <AlertTitle className="font-semibold text-ink">{SURVEY_MESSAGES.localDraftTitle}</AlertTitle>
      <AlertDescription className="text-ink-soft">
        <p>{SURVEY_MESSAGES.localDraftDescription(draft.title.trim(), formatIsoDateTime(draft.savedAt))}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={onResume}>
            {SURVEY_TEXT.resumeDraft}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
            {SURVEY_TEXT.discard}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
