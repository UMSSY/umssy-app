"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SELECT_ITEM_CONTRAST_CLASS } from "@/shared/constants/select.constants";
import { DOCUMENT_TYPE_OPTIONS, type DocumentType } from "../../constants/document-types.constants";
import type { DocumentTypeFieldProps } from "../../types/document-type-field-props.types";
import { FieldError } from "../personal-data/field-error";
import { RequiredMark } from "../personal-data/required-mark";

export function DocumentTypeField({ value, onChange, isDisabled = false, id = "documentType", error = null }: DocumentTypeFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 text-xs font-semibold text-ink">
        Tipo de documento
        <RequiredMark />
      </Label>
      <Select
        name={id}
        items={DOCUMENT_TYPE_OPTIONS}
        value={value}
        onValueChange={(next) => { if (next) onChange(next as DocumentType); }}
        disabled={isDisabled}
      >
        <SelectTrigger
          id={id}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="w-full rounded-md border-border bg-surface px-3 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction data-[size=default]:h-11"
        >
          <SelectValue placeholder="Elige el tipo de documento" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {DOCUMENT_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={errorId} message={error ?? undefined} />
    </div>
  );
}
