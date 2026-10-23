"use client";

import Link from "next/link";
import { cn } from "cn";
import { ArrowLeft, FileDown, Info } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshButton } from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SURVEY_ANALYTICS_MESSAGES } from "../constants/survey-analytics.constants";
import { SURVEY_REPORT_MESSAGES } from "../constants/survey-report.constants";
import { ALL_CAREERS_LABEL } from "../constants/survey-form.constants";
import { SURVEYS_BASE_PATH } from "../constants/surveys.constants";
import { SurveyExportPreviewDialog } from "../components/survey-export-preview-dialog";
import { SurveyMetricsGrid } from "../components/survey-metrics-grid";
import { SurveyQuestionResultCard } from "../components/survey-question-result-card";
import { useExportSurveyPdf } from "../hooks/use-export-survey-pdf";
import { useSurveyAnalytics } from "../hooks/use-survey-analytics";
import type { SurveyAnalyticsViewProps } from "../types/survey-analytics-view-props.types";

const BACK_LINK_CLASSES = cn(buttonVariants({ variant: "ghost" }), "w-fit gap-2 px-2 text-ink-soft");

export function SurveyAnalyticsView({ id }: SurveyAnalyticsViewProps) {
  const { metrics, statistics, isLoading, isUnavailable, isError, refresh } = useSurveyAnalytics(id);
  const { preview, isGenerating, generate, download, closePreview } = useExportSurveyPdf();
  const survey = statistics?.survey;
  // Sin respuestas (n=0) no se genera un PDF vacío.
  const canExport = Boolean(statistics && metrics && statistics.totalResponses > 0);

  const handleExport = () => {
    if (statistics && metrics) void generate({ statistics, metrics, generatedAt: new Date().toISOString() });
  };
  const description = survey
    ? `${survey.period} · ${survey.targetCareer ?? ALL_CAREERS_LABEL} · ${statistics.questions.length} preguntas`
    : "Métricas de participación y resultados de cada pregunta.";

  const renderQuestions = () => {
    if (isUnavailable) return <p role="status" className="text-sm text-text-secondary">{SURVEY_ANALYTICS_MESSAGES.noStatistics}</p>;
    if (isError) return <p role="alert" className="text-sm text-destructive">{SURVEY_ANALYTICS_MESSAGES.loadError}</p>;
    if (!statistics) {
      return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      );
    }

    return (
      <>
        {statistics.totalResponses === 0 && (
          <p role="status" className="flex items-start gap-2 rounded-lg border border-border bg-surface-soft p-4 text-sm text-ink-soft">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {SURVEY_ANALYTICS_MESSAGES.noResponses}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statistics.questions.map((question) => (
            <SurveyQuestionResultCard key={question.id} question={question} />
          ))}
        </div>
      </>
    );
  };

  return (
    <WorkspacePage
      title={survey ? `Analíticas: ${survey.title}` : "Analíticas de la encuesta"}
      description={description}
      actions={
        <>
          <RefreshButton label="Actualizar" onClick={refresh} isRefreshing={isLoading} />
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={!canExport || isGenerating}
            title={statistics && !canExport ? SURVEY_REPORT_MESSAGES.noResponses : undefined}
            className="h-auto gap-2 px-4 py-2.5"
          >
            <FileDown className="size-4" aria-hidden="true" />
            {isGenerating ? SURVEY_REPORT_MESSAGES.generating : SURVEY_REPORT_MESSAGES.exportLabel}
          </Button>
        </>
      }
    >
      <Link href={SURVEYS_BASE_PATH} className={BACK_LINK_CLASSES}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al historial
      </Link>

      <SurveyMetricsGrid metrics={metrics} isLoading={isLoading && !metrics} />

      <section aria-label="Resultados por pregunta" className="flex flex-col gap-4">
        <h2 className="font-tight text-xl font-bold text-ink">Resultados por pregunta</h2>
        {renderQuestions()}
      </section>

      <SurveyExportPreviewDialog preview={preview} onDownload={download} onClose={closePreview} />
    </WorkspacePage>
  );
}
