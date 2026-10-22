import Link from "next/link";
import { cn } from "cn";
import { Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TABLE_CELL_CLASSES as CELL_CLASSES,
  TABLE_CONTAINER_CLASSES as CONTAINER_CLASSES,
  TableMessageRow,
  TableNoResultsRow,
  TableSkeletonRows,
  USERS_TABLE_HEAD_CLASSES as HEAD_CLASSES,
} from "@/modules/reports";
import { formatDateTime } from "@/shared/utils/date.utils";
import { getInitials } from "@/shared/utils/get-initials";
import {
  STATISTICS_AVAILABLE_STATUSES,
  STATISTICS_UNAVAILABLE_LABEL,
  SURVEY_STATISTICS_BASE_PATH,
  SURVEYS_COLUMN_COUNT as COLUMN_COUNT,
  SURVEYS_EMPTY_MESSAGE,
  SURVEYS_SEARCH_NO_RESULTS_MESSAGE,
} from "../constants/surveys.constants";
import type { SurveyListItem } from "../types/survey.types";
import type { SurveysTableProps } from "../types/surveys-table-props.types";
import { SurveyStatusBadge } from "./survey-status-badge";

function renderStatisticsAction(survey: SurveyListItem) {
  if (!STATISTICS_AVAILABLE_STATUSES.includes(survey.status)) {
    return <span className="text-sm text-text-secondary">{STATISTICS_UNAVAILABLE_LABEL}</span>;
  }

  return (
    <Link
      href={`${SURVEY_STATISTICS_BASE_PATH}/${survey.id}`}
      aria-label={`Ver estadísticas de ${survey.title}`}
      title="Ver estadísticas"
      className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-9 rounded-md border-border text-ink-soft hover:text-ink")}
    >
      <Eye className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function SurveysTable({ surveys, isLoading, errorMessage, searchTerm = "" }: SurveysTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return <TableSkeletonRows columnCount={COLUMN_COUNT} />;
    }

    if (errorMessage) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message={errorMessage} />;
    }

    if (surveys.length === 0 && searchTerm) {
      return <TableNoResultsRow columnCount={COLUMN_COUNT} message={SURVEYS_SEARCH_NO_RESULTS_MESSAGE} />;
    }

    if (surveys.length === 0) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message={SURVEYS_EMPTY_MESSAGE} />;
    }

    return surveys.map((survey) => (
      <TableRow key={survey.id} className="border-border hover:bg-surface-soft">
        <TableCell className={cn(CELL_CLASSES, "font-medium whitespace-normal text-ink")}>{survey.title}</TableCell>
        <TableCell className={CELL_CLASSES}>
          <span className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-surface-soft text-xs font-semibold text-ink-soft">
                {getInitials(survey.creator.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-ink">{survey.creator.fullName}</span>
              <span className="text-xs text-text-secondary">{survey.creator.email}</span>
            </span>
          </span>
        </TableCell>
        <TableCell className={cn(CELL_CLASSES, "tabular-nums")}>{survey.period}</TableCell>
        <TableCell className={cn(CELL_CLASSES, "tabular-nums")}>{formatDateTime(survey.createdAt)}</TableCell>
        <TableCell className={CELL_CLASSES}>
          <SurveyStatusBadge status={survey.status} />
        </TableCell>
        <TableCell className={CELL_CLASSES}>{renderStatisticsAction(survey)}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div className={CONTAINER_CLASSES}>
      <Table className="min-w-225 text-left text-base">
        <TableHeader className="bg-surface-soft">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead scope="col" className={HEAD_CLASSES}>Título de la encuesta</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Administrador creador</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Gestión</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Fecha de creación</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Estado</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Estadísticas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={isLoading}>{renderBody()}</TableBody>
      </Table>
    </div>
  );
}
