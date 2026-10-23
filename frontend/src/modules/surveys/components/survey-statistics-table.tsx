import Link from "next/link";
import { cn } from "cn";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SURVEY_MESSAGES } from "../constants/survey-messages.constants";
import type { SurveySummary } from "../types/survey.types";
import { formatIsoDisplayDate } from "../utils/survey-dates";

interface SurveyStatisticsTableProps {
  surveys: SurveySummary[];
  isLoading?: boolean;
  hasError?: boolean;
}

const STATISTICS_TABLE_COLUMNS = [
  "Encuesta",
  "Carrera",
  "Gestión",
  "Vigencia",
  "Respuestas",
  "Acciones",
] as const;

export function SurveyStatisticsTable({ surveys, isLoading, hasError }: SurveyStatisticsTableProps) {
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
            {STATISTICS_TABLE_COLUMNS.map((column, idx) => (
              <TableHead
                key={column}
                className={cn("font-medium text-text-secondary", idx === STATISTICS_TABLE_COLUMNS.length - 1 && "pr-6 text-right")}
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {stateMessage ? (
            <TableRow>
              <TableCell colSpan={STATISTICS_TABLE_COLUMNS.length} className="py-10 text-center text-text-secondary">
                {stateMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((survey) => {
              const responses = survey.responseCount ?? 0;
              return (
                <TableRow key={survey.id} className="transition-colors hover:bg-surface-soft/60">
                  <TableCell className="max-w-xs font-medium text-ink">{survey.title}</TableCell>
                  <TableCell className="text-text-secondary">{survey.career?.title ?? "Todas las carreras"}</TableCell>
                  <TableCell className="text-text-secondary tabular-nums">{survey.academicPeriod ?? "-"}</TableCell>
                  <TableCell className="text-xs text-text-secondary tabular-nums">
                    {survey.opensAt && survey.closesAt
                      ? `${formatIsoDisplayDate(survey.opensAt)} - ${formatIsoDisplayDate(survey.closesAt)}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        responses > 0
                          ? "border-accent/30 bg-interaction font-medium text-accent"
                          : "border-border bg-surface-soft font-normal text-text-secondary"
                      }
                    >
                      {responses} {responses === 1 ? "respuesta" : "respuestas"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Link
                      href={`/backoffice/surveys/statistics/${survey.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-1.5 border-border text-xs font-medium text-ink transition-colors hover:border-ink-soft/40 hover:bg-surface-soft"
                      )}
                    >
                      <BarChart3 className="size-3.5 text-primary" aria-hidden="true" />
                      Ver métricas
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
