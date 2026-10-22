"use client";

import { useMemo, useState } from "react";
import {
  type AcademicPeriod,
  EmailSearchInput,
  getAcademicPeriods,
  ReportFilterSelect,
  ReportTableFooter,
  SEARCH_DEBOUNCE_MS,
} from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import {
  SURVEYS_PAGE_SIZE,
  SURVEYS_PERIOD_FILTER_ALL_LABEL,
  SURVEYS_PERIOD_FILTER_LABEL,
} from "../constants/surveys.constants";
import { SurveysTable } from "../components/surveys-table";
import { useSurveys } from "../hooks/use-surveys";

export function SurveysView() {
  const [currentPage, setCurrentPage] = useState(1);
  const [period, setPeriod] = useState<AcademicPeriod | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const { surveys, totalItems, totalPages, isLoading, errorMessage, refresh } = useSurveys(currentPage, period, search);
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

  return (
    <WorkspacePage
      title="Encuestas"
      description="Administra las encuestas de empleabilidad y consulta las estadísticas de cada una."
    >
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center">
        <EmailSearchInput value={searchInput} onChange={handleSearchChange} />
        <ReportFilterSelect
          label={SURVEYS_PERIOD_FILTER_LABEL}
          allLabel={SURVEYS_PERIOD_FILTER_ALL_LABEL}
          options={periodOptions}
          value={period}
          onChange={handlePeriodChange}
        />
      </div>

      <SurveysTable surveys={surveys} isLoading={isLoading} errorMessage={errorMessage} searchTerm={search} />

      <ReportTableFooter
        currentPage={currentPage}
        pageSize={SURVEYS_PAGE_SIZE}
        totalItems={totalItems}
        totalPages={totalPages}
        isLoading={isLoading}
        itemLabel="encuestas"
        onPageChange={setCurrentPage}
        onRefresh={refresh}
      />
    </WorkspacePage>
  );
}
