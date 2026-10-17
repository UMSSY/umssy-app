"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PageBreadcrumb } from "@/shared/components/layout";
import { RequirementAnalysisResult } from "../components/requirement-analysis-result";
import {
  MAX_REQUIREMENT_TEXT_LENGTH,
  REQUIREMENT_ANALYSIS_BREADCRUMB,
  REQUIREMENT_ANALYSIS_MESSAGES,
  REQUIREMENT_EXAMPLE_TEXT,
} from "../constants/requirement-analysis.constants";
import { useRequirementAnalysis } from "../hooks/use-requirement-analysis";

const TEXT_FIELD_ID = "requirement-text";
const COUNTER_ID = "requirement-counter";
const LIMIT_ERROR_ID = "requirement-limit-error";

export function RequirementAnalysisView() {
  const [text, setText] = useState("");
  const { mutate, data, isPending, isError, variables } = useRequirementAnalysis();

  const length = text.length;
  const isOverLimit = length > MAX_REQUIREMENT_TEXT_LENGTH;
  const canAnalyze = text.trim().length > 0 && !isOverLimit && !isPending;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <PageBreadcrumb items={REQUIREMENT_ANALYSIS_BREADCRUMB} />
        <h1 className="font-tight text-3xl font-extrabold text-ink">
          {REQUIREMENT_ANALYSIS_MESSAGES.pageTitle}
        </h1>
        <p className="text-base text-text-secondary">
          {REQUIREMENT_ANALYSIS_MESSAGES.pageDescription}
        </p>
      </header>

      <form
        className="flex max-w-3xl flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (canAnalyze) mutate(text);
        }}
      >
        <Label htmlFor={TEXT_FIELD_ID} className="text-sm font-semibold text-ink">
          {REQUIREMENT_ANALYSIS_MESSAGES.textLabel}
        </Label>
        <Textarea
          id={TEXT_FIELD_ID}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={REQUIREMENT_ANALYSIS_MESSAGES.textPlaceholder}
          rows={8}
          className="max-h-72 overflow-y-auto aria-invalid:border-danger aria-invalid:ring-danger/20"
          aria-invalid={isOverLimit || undefined}
          aria-describedby={isOverLimit ? `${COUNTER_ID} ${LIMIT_ERROR_ID}` : COUNTER_ID}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            id={COUNTER_ID}
            className={isOverLimit ? "text-sm font-bold text-danger" : "text-sm text-text-secondary"}
          >
            {length} / {MAX_REQUIREMENT_TEXT_LENGTH}
          </p>
          {isOverLimit && (
            <p id={LIMIT_ERROR_ID} role="alert" className="text-sm font-bold text-danger">
              {REQUIREMENT_ANALYSIS_MESSAGES.limitExceeded}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={!canAnalyze}>
            {isPending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
            {isPending ? REQUIREMENT_ANALYSIS_MESSAGES.analyzing : REQUIREMENT_ANALYSIS_MESSAGES.analyze}
          </Button>
          <Button type="button" variant="outline" onClick={() => setText(REQUIREMENT_EXAMPLE_TEXT)}>
            {REQUIREMENT_ANALYSIS_MESSAGES.useExample}
          </Button>
        </div>
      </form>

      {isPending && (
        <div aria-busy="true" className="flex max-w-3xl flex-col gap-3">
          <Skeleton className="h-8 w-1/3 rounded-lg" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      )}

      {isError && !isPending && (
        <Alert className="max-w-3xl border-danger text-danger">
          <CircleAlert aria-hidden="true" />
          <AlertDescription className="flex flex-col items-start gap-3 font-bold text-danger">
            <span>{REQUIREMENT_ANALYSIS_MESSAGES.error}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (variables !== undefined) mutate(variables);
              }}
            >
              {REQUIREMENT_ANALYSIS_MESSAGES.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data && !isPending && !isError && (
        <div className="max-w-3xl">
          <RequirementAnalysisResult analysis={data} />
        </div>
      )}
    </section>
  );
}
