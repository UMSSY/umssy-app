import Link from "next/link";
import { BarChart3, Eye } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  SURVEY_HISTORY_COLUMN_COUNT as COLUMN_COUNT,
  SURVEY_HISTORY_ACTION_BUTTON_CLASSES as ACTION_BUTTON_CLASSES,
  SURVEY_HISTORY_COLUMNS,
  SURVEY_HISTORY_EMPTY_MESSAGE,
  SURVEY_HISTORY_NO_RESULTS_MESSAGE,
  SURVEY_HISTORY_TEXT,
} from "../constants/survey-history.constants";
import type { SurveyHistoryTableProps } from "../types/survey-history-component-props.types";
import { SurveyCreatorCell } from "./survey-creator-cell";
import { SurveyHistoryStatusBadge } from "./survey-history-status-badge";

export function SurveyHistoryTable({
  surveys,
  isLoading,
  errorMessage,
  searchTerm = "",
  onViewDetails,
}: SurveyHistoryTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return <TableSkeletonRows columnCount={COLUMN_COUNT} />;
    }

    if (errorMessage) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message={errorMessage} />;
    }

    if (surveys.length === 0 && searchTerm) {
      return <TableNoResultsRow columnCount={COLUMN_COUNT} message={SURVEY_HISTORY_NO_RESULTS_MESSAGE} />;
    }

    if (surveys.length === 0) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message={SURVEY_HISTORY_EMPTY_MESSAGE} />;
    }

    return surveys.map((survey) => (
      <TableRow key={survey.id} className="border-border hover:bg-surface-soft">
        <TableCell className={`${CELL_CLASSES} text-ink`}>{survey.title}</TableCell>
        <TableCell className={CELL_CLASSES}>
          <SurveyCreatorCell fullName={survey.creator.fullName} email={survey.creator.email} />
        </TableCell>
        <TableCell className={`${CELL_CLASSES} tabular-nums`}>{survey.academicPeriod}</TableCell>
        <TableCell className={`${CELL_CLASSES} tabular-nums`}>{formatDateTime(survey.createdAt)}</TableCell>
        <TableCell className={CELL_CLASSES}>
          <SurveyHistoryStatusBadge status={survey.status} />
        </TableCell>
        <TableCell className={CELL_CLASSES}>
          <span className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onViewDetails(survey)}
              aria-label={`${SURVEY_HISTORY_TEXT.viewDetails} de ${survey.title}`}
              title={SURVEY_HISTORY_TEXT.viewDetails}
              className={ACTION_BUTTON_CLASSES}
            >
              <Eye className="size-5" aria-hidden="true" />
            </Button>
            <Link
              href={`/backoffice/surveys/statistics/${survey.id}`}
              aria-label={`${SURVEY_HISTORY_TEXT.viewStatistics} de ${survey.title}`}
              title={SURVEY_HISTORY_TEXT.viewStatistics}
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), ACTION_BUTTON_CLASSES)}
            >
              <BarChart3 className="size-5" aria-hidden="true" />
            </Link>
          </span>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className={CONTAINER_CLASSES}>
      <Table className="min-w-225 text-left text-base">
        <TableHeader className="bg-surface-soft">
          <TableRow className="border-border hover:bg-transparent">
            {SURVEY_HISTORY_COLUMNS.map((column) => (
              <TableHead key={column} scope="col" className={HEAD_CLASSES}>
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={isLoading}>{renderBody()}</TableBody>
      </Table>
    </div>
  );
}
