"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RefreshButton, ReportFilterSelect, ReportSearchInput } from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SurveysTable } from "../components/surveys-table";
import {
  ACADEMIC_PERIOD_FILTER_LABEL,
  ALL_ACADEMIC_PERIODS_LABEL,
  CREATE_SURVEY_ACTION_LABEL,
  CREATE_SURVEY_PATH,
  CREATOR_SEARCH_LABEL,
  REFRESH_SURVEYS_LABEL,
  SURVEYS_FILTERED_EMPTY,
  SURVEYS_PAGE_DESCRIPTION,
  SURVEYS_PAGE_TITLE,
} from "../constants/survey-routes.constants";
import { useSurveys } from "../hooks/use-surveys";
import { filterSurveys } from "../utils/filter-surveys";
import { getSurveyYears } from "../utils/survey-academic-periods";

export function SurveysView() {
  const { surveys, isLoading, isRefreshing, hasError, refresh } = useSurveys();
  const [creatorSearch, setCreatorSearch] = useState("");
  const [academicPeriod, setAcademicPeriod] = useState<string | undefined>(undefined);
  const [periodOptions] = useState(() => getSurveyYears().map((year) => ({ value: year, label: year })));
  const hasFilters = Boolean(creatorSearch.trim() || academicPeriod);
  const visibleSurveys = filterSurveys(surveys, creatorSearch, academicPeriod);

  return (
    <WorkspacePage
      title={SURVEYS_PAGE_TITLE}
      description={SURVEYS_PAGE_DESCRIPTION}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href={CREATE_SURVEY_PATH} className={buttonVariants({ variant: "outline" })}>
            <Plus aria-hidden="true" />
            {CREATE_SURVEY_ACTION_LABEL}
          </Link>
          <RefreshButton label={REFRESH_SURVEYS_LABEL} onClick={refresh} isRefreshing={isRefreshing} />
        </div>
      }
    >
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <ReportSearchInput value={creatorSearch} onChange={setCreatorSearch} label={CREATOR_SEARCH_LABEL} />
        <ReportFilterSelect
          label={ACADEMIC_PERIOD_FILTER_LABEL}
          allLabel={ALL_ACADEMIC_PERIODS_LABEL}
          options={periodOptions}
          value={academicPeriod}
          onChange={setAcademicPeriod}
        />
      </div>
      <SurveysTable
        surveys={visibleSurveys}
        isLoading={isLoading}
        hasError={hasError}
        emptyMessage={hasFilters ? SURVEYS_FILTERED_EMPTY : undefined}
      />
    </WorkspacePage>
  );
}
