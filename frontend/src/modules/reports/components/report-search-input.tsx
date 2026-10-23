import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportSearchInputProps } from "../types/report-search-input-props.types";

export function ReportSearchInput({ value, onChange, label }: ReportSearchInputProps) {
  return (
    <div className="relative w-full sm:w-96">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
        maxLength={100}
        className="h-auto rounded-md border-border bg-surface px-10 py-2.5 text-sm text-ink placeholder:text-text-secondary focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-interaction"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-1 size-8 -translate-y-1/2 rounded-md text-text-secondary hover:bg-transparent hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
