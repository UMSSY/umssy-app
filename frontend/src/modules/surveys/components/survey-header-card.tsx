"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ALL_ACADEMIC_PERIODS_OPTION_LABEL,
  ALL_ACADEMIC_PERIODS_VALUE,
  SURVEY_LIMITS,
  SURVEY_TEXT,
} from "../constants/survey-builder.constants";
import { SURVEY_FIELD_LABELS } from "../constants/survey-messages.constants";
import { SURVEY_SELECT_TRIGGER_CLASS } from "../constants/survey-styles.constants";
import type { SurveyHeaderCardProps } from "../types/survey-component-props.types";
import { FieldErrorMessage } from "./field-error-message";
import { RequiredMark } from "./required-mark";
import { SurveyDateField } from "./survey-date-field";

export function SurveyHeaderCard({
  values,
  careers,
  isLoadingCareers,
  careersErrorMessage,
  academicPeriods,
  minDate,
  errors,
  onFieldChange,
}: SurveyHeaderCardProps) {
  const careerItems = (careers ?? []).map(({ id, title }) => ({ value: id, label: title }));
  const periodItems = [
    { value: ALL_ACADEMIC_PERIODS_VALUE, label: ALL_ACADEMIC_PERIODS_OPTION_LABEL },
    ...(academicPeriods ?? []).map((period) => ({ value: period, label: period })),
  ];

  return (
    <Card className="gap-0 border-t-8 border-t-accent px-6 py-5">
      <div className="flex items-end gap-2 border-b border-border focus-within:border-accent">
        <Label htmlFor="survey-title" className="sr-only">
          {SURVEY_FIELD_LABELS.title}
        </Label>
        <Input
          id="survey-title"
          value={values.title}
          maxLength={SURVEY_LIMITS.titleMax}
          placeholder={SURVEY_TEXT.titlePlaceholder}
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "survey-title-error" : undefined}
          onChange={(event) => onFieldChange("title", event.target.value)}
          className="h-auto rounded-none border-0 bg-transparent px-0 py-1.5 font-tight text-2xl font-semibold text-ink shadow-none focus-visible:ring-0 aria-invalid:ring-0 md:text-2xl dark:bg-transparent"
        />
        <RequiredMark className="pb-2 text-lg" />
      </div>
      <FieldErrorMessage id="survey-title-error" message={errors.title} />

      <Label htmlFor="survey-description" className="sr-only">
        {SURVEY_FIELD_LABELS.description}
      </Label>
      <Textarea
        id="survey-description"
        rows={1}
        value={values.description}
        maxLength={SURVEY_LIMITS.descriptionMax}
        placeholder={SURVEY_TEXT.descriptionPlaceholder}
        onChange={(event) => onFieldChange("description", event.target.value)}
        className="mt-3 min-h-0 resize-none rounded-none border-0 border-b border-border bg-transparent px-0 py-1.5 text-sm text-ink-soft focus-visible:border-accent focus-visible:ring-0 dark:bg-transparent"
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="min-w-0">
          <Label id="survey-career-label" htmlFor="survey-career" className="mb-1.5 gap-1 text-xs font-medium text-ink-soft">
            {SURVEY_FIELD_LABELS.careerId}
            <RequiredMark />
          </Label>
          <Select
            items={careerItems}
            value={values.careerId || null}
            onValueChange={(value) => onFieldChange("careerId", typeof value === "string" ? value : "")}
          >
            <SelectTrigger
              id="survey-career"
              aria-labelledby="survey-career-label"
              aria-required="true"
              aria-invalid={errors.careerId ? true : undefined}
              aria-describedby={errors.careerId || careersErrorMessage ? "survey-career-error" : undefined}
              className={SURVEY_SELECT_TRIGGER_CLASS}
            >
              <SelectValue placeholder={isLoadingCareers ? SURVEY_TEXT.loading : SURVEY_TEXT.selectCareer} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="bg-surface">
              {careerItems.map((item) => (
                <SelectItem key={item.value} value={item.value} variant="subtle">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldErrorMessage id="survey-career-error" message={errors.careerId ?? careersErrorMessage} />
        </div>

        <div className="min-w-0">
          <Label id="survey-period-label" htmlFor="survey-period" className="mb-1.5 gap-1 text-xs font-medium text-ink-soft">
            {SURVEY_FIELD_LABELS.academicPeriod}
            <RequiredMark />
          </Label>
          <Select
            items={periodItems}
            value={values.academicPeriod || null}
            onValueChange={(value) => onFieldChange("academicPeriod", typeof value === "string" ? value : "")}
          >
            <SelectTrigger
              id="survey-period"
              aria-labelledby="survey-period-label"
              aria-required="true"
              aria-invalid={errors.academicPeriod ? true : undefined}
              aria-describedby={errors.academicPeriod ? "survey-period-error" : undefined}
              className={SURVEY_SELECT_TRIGGER_CLASS}
            >
              <SelectValue placeholder={SURVEY_TEXT.selectPeriod} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} className="bg-surface">
              {periodItems.map((item) => (
                <SelectItem key={item.value} value={item.value} variant="subtle">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldErrorMessage id="survey-period-error" message={errors.academicPeriod} />
        </div>

        <SurveyDateField
          id="survey-opens-at"
          label="Apertura"
          value={values.opensAt}
          minDate={minDate}
          error={errors.opensAt}
          onChange={(value) => onFieldChange("opensAt", value)}
        />
        <SurveyDateField
          id="survey-closes-at"
          label="Cierre"
          value={values.closesAt}
          minDate={minDate}
          error={errors.closesAt}
          onChange={(value) => onFieldChange("closesAt", value)}
        />
      </div>
    </Card>
  );
}
