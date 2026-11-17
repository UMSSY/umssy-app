import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, getFieldErrorProps } from "@/modules/profile";
import { CV_PRESENTATION_LIMITS, CV_REVIEW_TEXTS } from "../constants/cv-extraction.constants";
import type { CvPresentationReviewProps } from "../types/cv-presentation-review-props.types";

export function CvPresentationReview({ presentation, isHeadlineMissing, onChange }: CvPresentationReviewProps) {
  const headlineError = isHeadlineMissing ? CV_REVIEW_TEXTS.headlineRequired : undefined;

  return (
    <div className="flex flex-col gap-4">
      <FormField id="cv-review-headline" label={CV_REVIEW_TEXTS.headlineLabel} isRequired error={headlineError}>
        <Input
          id="cv-review-headline"
          {...getFieldErrorProps("cv-review-headline", headlineError)}
          maxLength={CV_PRESENTATION_LIMITS.headline}
          placeholder={CV_REVIEW_TEXTS.headlinePlaceholder}
          value={presentation?.headline ?? ""}
          onChange={(event) => onChange({ headline: event.target.value })}
          className="h-10"
        />
      </FormField>
      <FormField id="cv-review-about-me" label={CV_REVIEW_TEXTS.aboutMeLabel} isRequired>
        <Textarea
          id="cv-review-about-me"
          rows={6}
          maxLength={CV_PRESENTATION_LIMITS.aboutMe}
          value={presentation?.aboutMe ?? ""}
          onChange={(event) => onChange({ aboutMe: event.target.value })}
          className="field-sizing-fixed min-h-36 resize-y text-sm"
        />
      </FormField>
    </div>
  );
}
