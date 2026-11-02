import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SURVEY_STATUS_BADGE_CLASSES, SURVEY_STATUS_LABELS } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEYS_TABLE_COLUMNS } from "../constants/survey-routes.constants";
import type { SurveysTableProps } from "../types/survey-component-props.types";
import { formatIsoDateTime } from "../utils/survey-dates";
import { SurveyRowActions } from "./survey-row-actions";

export function SurveysTable({ surveys, isLoading, hasError, emptyMessage }: SurveysTableProps) {
  const rows = surveys ?? [];
  const stateMessage = isLoading
    ? SURVEY_MESSAGES.surveysLoading
    : hasError
      ? SURVEY_MESSAGES.surveysLoadError
      : rows.length === 0
        ? (emptyMessage ?? SURVEY_MESSAGES.surveysEmpty)
        : null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader className="bg-surface-soft">
          <TableRow>
            {SURVEYS_TABLE_COLUMNS.map((column) => (
              <TableHead key={column} className="text-xs font-semibold tracking-wide text-ink uppercase">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stateMessage ? (
            <TableRow>
              <TableCell colSpan={SURVEYS_TABLE_COLUMNS.length} className="py-10 text-center text-text-secondary">
                {stateMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((survey) => (
              <TableRow key={survey.id} className="hover:bg-surface-soft">
                <TableCell className="text-ink">{survey.title}</TableCell>
                <TableCell>
                  <p className="text-sm text-ink">{survey.createdBy?.fullName ?? "-"}</p>
                  <p className="text-xs text-text-secondary">{survey.createdBy?.email ?? ""}</p>
                </TableCell>
                <TableCell className="text-ink-soft">{survey.academicPeriod ?? "-"}</TableCell>
                <TableCell className="text-ink-soft tabular-nums">{formatIsoDateTime(survey.createdAt) || "-"}</TableCell>
                <TableCell>
                  <Badge className={SURVEY_STATUS_BADGE_CLASSES[survey.status]}>{SURVEY_STATUS_LABELS[survey.status]}</Badge>
                </TableCell>
                <TableCell>
                  <SurveyRowActions survey={survey} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
