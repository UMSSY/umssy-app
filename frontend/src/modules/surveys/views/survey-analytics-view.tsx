"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "cn";
import { ArrowLeft, BarChart3, BellRing, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ExportSuccessToast } from "@/modules/reports";
import { downloadFile } from "@/shared/utils/download-file";
import { SurveyAlertsDialog } from "../components/survey-alerts-dialog";
import { SurveyAnalyticsHeader } from "../components/survey-analytics-header";
import { SurveyPeriodFilter } from "../components/survey-period-filter";
import { SurveyQuestionResultCard } from "../components/survey-question-result-card";
import { SurveyResponseRateCard } from "../components/survey-response-rate-card";
import { SurveyStatisticsSkeleton } from "../components/survey-statistics-skeleton";
import { SurveyStatisticsSummary } from "../components/survey-statistics-summary";
import { SURVEY_ALERTS_TEXT, SURVEY_PARTICIPATION_TEXT } from "../constants/survey-participation.constants";
import { SURVEY_STATISTICS_TEXT } from "../constants/survey-statistics.constants";
import { SURVEYS_PATH } from "../constants/survey-routes.constants";
import { useSurveyStatistics } from "../hooks/use-survey-statistics";
import { useExportSurveyReport } from "../hooks/use-export-survey-report";
import { useSurveyAlertConfig } from "../hooks/use-survey-alert-config";
import { useSurveyParticipation } from "../hooks/use-survey-participation";
import type { SurveyAlertConfigPayload } from "../types/survey-alert-config.types";
import type { SurveyAnalyticsViewProps } from "../types/survey-analytics-view-props.types";
import { toSurveyAlertQuestions } from "../utils/to-survey-alert-questions";

export function SurveyAnalyticsView({ id }: SurveyAnalyticsViewProps) {
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const { statistics, availablePeriods, isLoading, isRefreshing, hasError, refetch } = useSurveyStatistics(id, period);
  const report = useExportSurveyReport(id, period);
  const isGeneratingPdf = report.isPending;
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const { participation, sendReminder, isSendingReminder, refetch: refetchAudience } = useSurveyParticipation(id, statistics?.totalResponses);
  const alertConfig = useSurveyAlertConfig(id);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(undefined), 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleGeneratePdf = async () => {
    if (isGeneratingPdf) return;
    try {
      const { file, fileName } = await report.mutateAsync();
      downloadFile(file, fileName);
      setSuccessMessage("PDF generado correctamente");
    } catch {
      toast.error("No se pudo generar el reporte en PDF. Inténtalo de nuevo.", {
        duration: 4000,
        closeButton: true,
        richColors: true,
      });
    }
  };

  const handleSendReminder = async () => {
    if (!participation || isSendingReminder) return;
    try {
      const { data } = await sendReminder(participation.pendingResponses);
      toast.success(data.message, { duration: 4000, closeButton: true });
    } catch {
      toast.error(SURVEY_PARTICIPATION_TEXT.reminderError, { duration: 4000, closeButton: true, richColors: true });
    }
  };

  const handleSaveAlerts = async (payload: SurveyAlertConfigPayload) => {
    try {
      await alertConfig.saveConfig(payload);
      setIsAlertsOpen(false);
      toast.success(SURVEY_ALERTS_TEXT.saved, { duration: 4000, closeButton: true });
    } catch {
      toast.error(SURVEY_ALERTS_TEXT.saveError, { duration: 4000, closeButton: true, richColors: true });
    }
  };

  const handleRefresh = () => {
    void refetch();
    void refetchAudience();
  };

  const careerName = statistics?.career?.title ?? "Todas las carreras";
  const questionCount = statistics?.questions.length ?? 0;
  const title = statistics
    ? `Analíticas de ${statistics.title}`
    : SURVEY_STATISTICS_TEXT.pageTitle;
  const description = statistics
    ? `${questionCount === 1 ? "Resultados de 1 pregunta" : `Resultados de las ${questionCount} preguntas`}: ${careerName}`
    : SURVEY_STATISTICS_TEXT.loadingDescription;
  const canExportPdf = Boolean(statistics?.hasData) && !isGeneratingPdf;

  const renderResults = () => {
    if (isLoading) return <SurveyStatisticsSkeleton />;

    if (hasError || !statistics) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
          <p className="text-sm font-medium text-destructive">No se pudo encontrar la encuesta o cargar sus métricas.</p>
          <Link href={SURVEYS_PATH} className={buttonVariants({ variant: "outline", className: "mt-4 gap-2 text-xs" })}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a encuestas
          </Link>
        </div>
      );
    }

    return (
      <>
        {participation && (
          <SurveyResponseRateCard
            participation={participation}
            isSendingReminder={isSendingReminder}
            onSendReminder={() => void handleSendReminder()}
          />
        )}
        <SurveyStatisticsSummary statistics={statistics} />

        <section
          className="flex flex-col gap-4"
          aria-label="Resultados por pregunta"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <BarChart3 className="size-5 text-primary" aria-hidden="true" />
              Resultados por pregunta
            </h2>
            <span className="text-xs text-text-secondary">
              {questionCount}{" "}
              {questionCount === 1
                ? "pregunta analizada"
                : "preguntas analizadas"}
            </span>
          </div>

          {!statistics.hasData && (
            <div
              role="status"
              className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-8 text-center text-text-secondary"
            >
              <BarChart3
                className="mb-2 size-9 stroke-[1.5] text-text-secondary/60"
                aria-hidden="true"
              />
              <p className="font-medium text-ink">
                {statistics.period
                  ? SURVEY_STATISTICS_TEXT.noResponsesInPeriod(
                      statistics.period,
                    )
                  : SURVEY_STATISTICS_TEXT.noResponses}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {statistics.period
                  ? SURVEY_STATISTICS_TEXT.noResponsesInPeriodHint
                  : SURVEY_STATISTICS_TEXT.noResponsesHint}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5">
            {statistics.questions.map((question) => (
              <SurveyQuestionResultCard key={question.id} question={question} />
            ))}
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="min-w-0">
      <SurveyAnalyticsHeader
        title={title}
        description={description}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAlertsOpen(true)}
              disabled={!statistics}
              className="cursor-pointer gap-1.5 border-primary text-xs text-primary hover:text-primary"
            >
              <BellRing className="size-3.5" aria-hidden="true" />
              {SURVEY_ALERTS_TEXT.trigger}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="cursor-pointer gap-1.5 text-xs text-ink-soft hover:text-ink"
            >
              <RefreshCw
                className={cn("size-3.5", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              Actualizar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleGeneratePdf}
              disabled={!canExportPdf}
              title={
                statistics && !statistics.hasData
                  ? SURVEY_STATISTICS_TEXT.exportDisabled
                  : undefined
              }
              className="cursor-pointer gap-1.5 text-xs font-semibold shadow-xs"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Exportando PDF...
                </>
              ) : (
                <>
                  <Download className="size-3.5" aria-hidden="true" />
                  Exportar PDF
                </>
              )}
            </Button>
          </>
        }
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={SURVEYS_PATH}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className:
                "-ml-2 gap-1.5 text-xs text-text-secondary hover:text-ink",
            })}
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Volver a encuestas
          </Link>
          {availablePeriods.length > 0 && (
            <SurveyPeriodFilter
              periods={availablePeriods}
              value={period}
              onChange={setPeriod}
            />
          )}
        </div>

        {renderResults()}
      </main>

      <SurveyAlertsDialog
        open={isAlertsOpen}
        onOpenChange={setIsAlertsOpen}
        questions={toSurveyAlertQuestions(statistics?.questions)}
        config={alertConfig.config}
        isLoading={alertConfig.isLoading}
        isSaving={alertConfig.isSaving}
        onSave={handleSaveAlerts}
      />

      <ExportSuccessToast message={successMessage} />
    </div>
  );
}
