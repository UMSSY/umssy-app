import { cn } from "cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  NO_PERIOD_LABEL,
  SURVEYS_COLUMN_COUNT as COLUMN_COUNT,
  SURVEYS_EMPTY_MESSAGE,
  SURVEYS_SEARCH_NO_RESULTS_MESSAGE,
} from "../constants/surveys.constants";
import type { SurveysTableProps } from "../types/surveys-table-props.types";
import { SurveyRowActions } from "./survey-row-actions";
import { SurveyStatusCell } from "./survey-status-cell";

export function SurveysTable({ surveys, isLoading, errorMessage, searchTerm = "", pendingChange, onToggleStatus }: SurveysTableProps) {
  const renderBody = () => {
    if (isLoading && surveys.length === 0) {
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
        <TableCell className={cn(CELL_CLASSES, "tabular-nums")}>{survey.period ?? NO_PERIOD_LABEL}</TableCell>
        <TableCell className={cn(CELL_CLASSES, "tabular-nums")}>{formatDateTime(survey.createdAt)}</TableCell>
        <TableCell className={CELL_CLASSES}>
          <SurveyStatusCell
            survey={survey}
            pendingStatus={pendingChange?.id === survey.id ? pendingChange.status : undefined}
            onToggle={onToggleStatus}
          />
        </TableCell>
        <TableCell className={CELL_CLASSES}>
          <SurveyRowActions survey={survey} />
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className={CONTAINER_CLASSES}>
      <Table className="min-w-225 text-left text-base">
        <TableHeader className="bg-surface-soft">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead scope="col" className={HEAD_CLASSES}>Título de Encuesta</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Administrador Creador</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Gestión</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Fecha de Creación</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Estado</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={isLoading}>{renderBody()}</TableBody>
      </Table>
    </div>
  );
}
