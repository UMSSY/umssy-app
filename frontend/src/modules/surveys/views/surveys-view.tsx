"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { RefreshButton, ReportFilterSelect, ReportSearchInput } from "@/modules/reports";
import { WorkspacePage } from "@/shared/components/layout/workspace-page";
import { SurveysTable } from "../components/surveys-table";
import { ALL_ACADEMIC_PERIODS_OPTION_LABEL } from "../constants/survey-builder.constants";
import { CREATE_SURVEY_PATH } from "../constants/survey-routes.constants";
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
      title={"Historial de Encuestas"}
      description={"Administra las encuestas de empleabilidad y consulta las estadísticas de cada una."}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href={CREATE_SURVEY_PATH} className={buttonVariants({ variant: "outline" })}>
            <Plus aria-hidden="true" />
            {"Crear encuesta"}
          </Link>
          <RefreshButton label={"Actualizar"} onClick={refresh} isRefreshing={isRefreshing} />
        </div>
      }
    >
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <ReportSearchInput value={creatorSearch} onChange={setCreatorSearch} label={"Buscar por correo electrónico de administradores"} />
        <ReportFilterSelect
          label={"Gestión académica"}
          allLabel={ALL_ACADEMIC_PERIODS_OPTION_LABEL}
          placeholder={"Selecciona una gestión"}
          options={periodOptions}
          value={academicPeriod}
          onChange={setAcademicPeriod}
        />
      </div>
      <SurveysTable
        surveys={visibleSurveys}
        isLoading={isLoading}
        hasError={hasError}
        emptyMessage={hasFilters ? "No hay encuestas que coincidan con los filtros." : undefined}
      />
    </WorkspacePage>
  );
}
