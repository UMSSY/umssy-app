"use client";

import { useState } from "react";
import { EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
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
import { Button } from "@/components/ui/button";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { SURVEY_TEXT } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEY_ROW_ACTION_LABELS } from "../constants/survey-routes.constants";
import { useUnpublishSurvey } from "../hooks/use-unpublish-survey";
import type { UnpublishSurveyActionProps } from "../types/survey-component-props.types";

export function UnpublishSurveyAction({ survey, compact = false, className }: UnpublishSurveyActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { unpublishSurvey, isUnpublishing } = useUnpublishSurvey();
  const hasResponses = (survey.responseCount ?? 0) > 0;
  const label = hasResponses ? SURVEY_ROW_ACTION_LABELS.unpublishUnavailable : SURVEY_ROW_ACTION_LABELS.unpublish(survey.title);

  const handleConfirm = async () => {
    try {
      await unpublishSurvey(survey.id);
      setIsDialogOpen(false);
      toast.success(SURVEY_MESSAGES.unpublishSuccess, { richColors: true });
    } catch (error) {
      setIsDialogOpen(false);
      toast.error(getApiErrorDetail(error) ?? SURVEY_MESSAGES.unpublishError, { richColors: true });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon-sm" : "default"}
        disabled={hasResponses}
        aria-label={label}
        title={label}
        onClick={() => setIsDialogOpen(true)}
        className={cn("bg-surface", className)}
      >
        <EyeOff aria-hidden="true" />
        {!compact && SURVEY_TEXT.unpublish}
      </Button>
      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!isUnpublishing) setIsDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-ink">{SURVEY_MESSAGES.unpublishDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-left">{SURVEY_MESSAGES.unpublishDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnpublishing}>{SURVEY_TEXT.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleConfirm()}
              disabled={isUnpublishing}
              aria-busy={isUnpublishing}
            >
              {isUnpublishing ? <Loader2 aria-hidden="true" className="animate-spin" /> : <EyeOff aria-hidden="true" />}
              {isUnpublishing ? SURVEY_TEXT.unpublishing : SURVEY_TEXT.unpublish}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
