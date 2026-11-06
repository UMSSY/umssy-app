import { ClipboardCheck } from "lucide-react";
import { cn } from "cn";
import {
  EMPTY_STATE_RAY_CLASSES,
  SURVEY_NOTIFICATIONS_EMPTY_DESCRIPTION,
  SURVEY_NOTIFICATIONS_EMPTY_TITLE,
} from "../constants/survey-notifications.constants";

export function SurveyNotificationsEmpty() {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <div aria-hidden="true" className="relative mb-6 flex size-24 items-center justify-center rounded-full bg-interaction">
        <ClipboardCheck className="size-11 text-accent" strokeWidth={1.5} />
        {EMPTY_STATE_RAY_CLASSES.map((rayClasses) => (
          <span key={rayClasses} className={cn("absolute h-0.5 w-3 rounded-full bg-accent/40", rayClasses)} />
        ))}
      </div>
      <h3 className="font-tight text-lg font-bold text-ink">{SURVEY_NOTIFICATIONS_EMPTY_TITLE}</h3>
      <p className="mt-2 text-sm text-text-secondary">{SURVEY_NOTIFICATIONS_EMPTY_DESCRIPTION}</p>
    </div>
  );
}
