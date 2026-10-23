import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SURVEY_STATUS_LABELS } from "../constants/survey-builder.constants";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import { SURVEYS_TABLE_COLUMNS } from "../constants/survey-routes.constants";
import type { SurveysTableProps } from "../types/survey-component-props.types";
import { formatIsoDisplayDate } from "../utils/survey-dates";

export function SurveysTable({ surveys, isLoading, hasError }: SurveysTableProps) {
  const rows = surveys ?? [];
  const stateMessage = isLoading
    ? SURVEY_MESSAGES.surveysLoading
    : hasError
      ? SURVEY_MESSAGES.surveysLoadError
      : rows.length === 0
        ? SURVEY_MESSAGES.surveysEmpty
        : null;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            {SURVEYS_TABLE_COLUMNS.map((column) => (
              <TableHead key={column} className="text-text-secondary">
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
              <TableRow key={survey.id}>
                <TableCell className="font-medium text-ink">{survey.title}</TableCell>
                <TableCell>{survey.career?.title ?? "-"}</TableCell>
                <TableCell>{survey.academicPeriod ?? "-"}</TableCell>
                <TableCell>
                  {survey.opensAt && survey.closesAt
                    ? `${formatIsoDisplayDate(survey.opensAt)} - ${formatIsoDisplayDate(survey.closesAt)}`
                    : "-"}
                </TableCell>
                <TableCell>{survey.questionCount}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      survey.status === "published"
                        ? "border-accent/30 bg-interaction text-accent"
                        : "border-gold/50 bg-gold/15 text-ink"
                    }
                  >
                    {SURVEY_STATUS_LABELS[survey.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
