"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "cn";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  type AcademicPeriod,
  EmailSearchInput,
  getAcademicPeriods,
  RefreshButton,
  ReportFilterSelect,
  SEARCH_DEBOUNCE_MS,
} from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  SURVEY_CREATE_PATH,
  SURVEYS_DEFAULT_PAGE_SIZE,
  SURVEYS_PERIOD_FILTER_ALL_LABEL,
  SURVEYS_PERIOD_FILTER_LABEL,
  SURVEYS_SEARCH_PLACEHOLDER,
} from "../constants/surveys.constants";
import { SurveyDraftResumeBanner } from "../components/survey-draft-resume-banner";
import { SurveysTable } from "../components/surveys-table";
import { SurveysTableFooter } from "../components/surveys-table-footer";
import { useChangeSurveyStatus } from "../hooks/use-change-survey-status";
import { useSurveys } from "../hooks/use-surveys";

export function SurveysView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(SURVEYS_DEFAULT_PAGE_SIZE);
  const [period, setPeriod] = useState<AcademicPeriod | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const { surveys, totalItems, totalPages, isLoading, errorMessage, refresh } = useSurveys(currentPage, pageSize, period, search);
  const { changeStatus, pendingChange } = useChangeSurveyStatus();
  const periodOptions = useMemo(
    () => getAcademicPeriods().map((academicPeriod) => ({ value: academicPeriod, label: academicPeriod })),
    [],
  );

  const handleSearchChange = (value: string) => {
    if (value.trim() !== searchInput.trim()) {
      setCurrentPage(1);
    }
    setSearchInput(value);
  };

  const handlePeriodChange = (selectedPeriod?: AcademicPeriod) => {
    if (selectedPeriod === period) return;
    setPeriod(selectedPeriod);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  return (
    <WorkspacePage
      title="Historial de Encuestas"
      description="Administra las encuestas de empleabilidad y consulta las estadísticas de cada una."
      actions={
        <>
          <Link href={SURVEY_CREATE_PATH} className={cn(buttonVariants({ variant: "outline" }), "h-auto gap-2 px-4 py-2.5")}>
            <Plus className="size-4" aria-hidden="true" />
            Crear encuesta
          </Link>
          <RefreshButton label="Actualizar" onClick={refresh} isRefreshing={isLoading} />
        </>
      }
    >
      <SurveyDraftResumeBanner />

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center">
        <EmailSearchInput value={searchInput} onChange={handleSearchChange} placeholder={SURVEYS_SEARCH_PLACEHOLDER} />
        <ReportFilterSelect
          label={SURVEYS_PERIOD_FILTER_LABEL}
          allLabel={SURVEYS_PERIOD_FILTER_ALL_LABEL}
          options={periodOptions}
          value={period}
          onChange={handlePeriodChange}
        />
      </div>

      <SurveysTable
        surveys={surveys}
        isLoading={isLoading}
        errorMessage={errorMessage}
        searchTerm={search}
        pendingChange={pendingChange}
        onToggleStatus={changeStatus}
      />

      <SurveysTableFooter
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </WorkspacePage>
  );
}
