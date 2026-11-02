"use client";

import { format, parseISO } from "date-fns";
import { ListFilter } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CONTRACT_TYPES,
  MODALITIES,
  STATUS_FILTER_OPTIONS,
} from "../constants/vacancies.constants";
import {
  DEFAULT_JOB_OFFER_FILTERS,
  type ApplicantsOrder,
  type JobOfferFilters,
} from "../utils/filter-job-offers";

const DATE_FORMAT = "yyyy-MM-dd";

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterColumnProps<T extends string> {
  title: string;
  options: Array<FilterOption<T>>;
  selected: T;
  onSelect: (value: T) => void;
}

function FilterColumn<T extends string>({
  title,
  options,
  selected,
  onSelect,
}: FilterColumnProps<T>) {
  return (
    <div className="space-y-2">
      <h3 className="border-b border-border pb-2 text-xs font-bold text-text-secondary uppercase">
        {title}
      </h3>
      <ul className="space-y-1">
        {options.map((option) => (
          <li key={option.value}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={option.value === selected}
              className={option.value === selected ? "font-bold" : "font-normal"}
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const APPLICANTS_OPTIONS: Array<FilterOption<ApplicantsOrder>> = [
  { value: "most", label: "Más postulantes" },
  { value: "least", label: "Menos postulantes" },
];

interface VacancyFiltersDialogProps {
  filters: JobOfferFilters;
  onChange: <K extends keyof JobOfferFilters>(key: K, value: JobOfferFilters[K]) => void;
  onReset: () => void;
  showStatusFilter?: boolean;
}

export function VacancyFiltersDialog({
  filters,
  onChange,
  onReset,
  showStatusFilter = false,
}: VacancyFiltersDialogProps) {
  const activeCount = [
    filters.dateFrom !== "" || filters.dateTo !== "",
    filters.modality !== "",
    filters.contractType !== "",
    filters.applicants !== DEFAULT_JOB_OFFER_FILTERS.applicants,
    showStatusFilter && filters.status !== DEFAULT_JOB_OFFER_FILTERS.status,
  ].filter(Boolean).length;

  const range: DateRange | undefined = filters.dateFrom
    ? {
        from: parseISO(filters.dateFrom),
        to: filters.dateTo ? parseISO(filters.dateTo) : undefined,
      }
    : undefined;

  const handleRangeSelect = (next: DateRange | undefined) => {
    onChange("dateFrom", next?.from ? format(next.from, DATE_FORMAT) : "");
    onChange("dateTo", next?.to ? format(next.to, DATE_FORMAT) : "");
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" className="max-md:min-h-11" />}>
        <ListFilter aria-hidden="true" />
        Filtrar por{activeCount > 0 ? ` (${activeCount})` : ""}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Filtros de búsqueda</DialogTitle>
        </DialogHeader>
        <div
          className={
            showStatusFilter
              ? "grid gap-6 sm:grid-cols-[auto_repeat(4,minmax(0,1fr))]"
              : "grid gap-6 sm:grid-cols-[auto_repeat(3,minmax(0,1fr))]"
          }
        >
          <div className="space-y-2">
            <h3 className="border-b border-border pb-2 text-xs font-bold text-text-secondary uppercase">
              Fecha
            </h3>
            <Calendar
              mode="range"
              locale={es}
              selected={range}
              onSelect={handleRangeSelect}
              defaultMonth={range?.from}
              classNames={{ today: "underline underline-offset-4" }}
              className="p-0 [&_button[data-range-middle=true]]:bg-primary/15"
            />
          </div>
          <FilterColumn
            title="Modalidad"
            options={MODALITIES.map((item) => ({ value: item as string, label: item }))}
            selected={filters.modality}
            onSelect={(value) => onChange("modality", value === filters.modality ? "" : value)}
          />
          <FilterColumn
            title="Tipo de contrato"
            options={CONTRACT_TYPES.map((item) => ({ value: item as string, label: item }))}
            selected={filters.contractType}
            onSelect={(value) =>
              onChange("contractType", value === filters.contractType ? "" : value)
            }
          />
          <FilterColumn
            title="Postulantes"
            options={APPLICANTS_OPTIONS}
            selected={filters.applicants}
            onSelect={(value) =>
              onChange(
                "applicants",
                value === filters.applicants ? DEFAULT_JOB_OFFER_FILTERS.applicants : value,
              )
            }
          />
          {showStatusFilter ? (
            <FilterColumn
              title="Estado"
              options={STATUS_FILTER_OPTIONS.map((item) => ({
                value: item.value as string,
                label: item.label,
              }))}
              selected={filters.status}
              onSelect={(value) => onChange("status", value)}
            />
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onReset}>
            Limpiar filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}