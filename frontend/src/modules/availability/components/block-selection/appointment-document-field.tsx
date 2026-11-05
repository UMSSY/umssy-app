"use client";

import { useRef, type ChangeEvent } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/modules/profile";
import {
  APPOINTMENT_DOCUMENT_ACCEPT,
  APPOINTMENT_DOCUMENT_TEXT,
} from "../../constants/appointment-document.constants";
import type { AppointmentDocumentFieldProps } from "../../types/appointment-document-field-props.types";
import { getAppointmentDocumentTypeLabel } from "../../utils/appointment-document.utils";

const FIELD_ID = "appointment-document";
const ERROR_ID = `${FIELD_ID}-error`;
const HINT_ID = `${FIELD_ID}-hint`;

export function AppointmentDocumentField({
  file,
  error,
  disabled,
  onSelect,
  onRemove,
}: AppointmentDocumentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (selected) onSelect(selected);
  };

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={FIELD_ID} className="font-semibold">
        {APPOINTMENT_DOCUMENT_TEXT.label}
      </FieldLabel>
      <Input
        ref={inputRef}
        id={FIELD_ID}
        type="file"
        accept={APPOINTMENT_DOCUMENT_ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? ERROR_ID : HINT_ID}
      />
      {file ? (
        <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
          <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[0.625rem] font-bold text-accent-foreground">
            {getAppointmentDocumentTypeLabel(file)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-text-secondary">{formatFileSize(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={APPOINTMENT_DOCUMENT_TEXT.removeLabel}
            disabled={disabled}
            onClick={onRemove}
            className="shrink-0 text-primary"
          >
            <X aria-hidden="true" className="size-4" />
            {APPOINTMENT_DOCUMENT_TEXT.remove}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="h-10 w-full justify-start"
        >
          <Paperclip aria-hidden="true" className="size-4" />
          {APPOINTMENT_DOCUMENT_TEXT.select}
        </Button>
      )}
      {error ? (
        <FieldError id={ERROR_ID}>{error}</FieldError>
      ) : (
        <FieldDescription id={HINT_ID} className="text-xs">
          {APPOINTMENT_DOCUMENT_TEXT.hint}
        </FieldDescription>
      )}
    </Field>
  );
}
