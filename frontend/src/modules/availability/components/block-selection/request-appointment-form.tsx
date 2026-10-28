"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "cn";
import {
  APPOINTMENT_MESSAGE_MAX_LENGTH,
  REQUEST_APPOINTMENT_TEXT,
} from "../../constants/request-appointment.constants";
import type { AppointmentRequestErrors } from "../../types/appointment-request-errors.types";
import type { AppointmentRequestValues } from "../../types/appointment-request-values.types";
import type { RequestAppointmentFormProps } from "../../types/request-appointment-form-props.types";
import { validateAppointmentRequest } from "../../utils/appointment-request.utils";

export function RequestAppointmentForm({
  orientationTypes,
  isLoadingTopics,
  isSubmitting,
  onSubmit,
  onDirtyChange,
}: RequestAppointmentFormProps) {
  const [values, setValues] = useState<AppointmentRequestValues>({ orientationTypeId: "", message: "" });
  const [errors, setErrors] = useState<AppointmentRequestErrors>({});

  const topicItems = orientationTypes.map((type) => ({ value: type.id, label: type.name }));
  const isMessageTooLong = values.message.trim().length > APPOINTMENT_MESSAGE_MAX_LENGTH;

  const updateValues = (field: keyof AppointmentRequestValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    onDirtyChange(next.orientationTypeId !== "" || next.message.trim() !== "");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateAppointmentRequest(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field data-invalid={errors.orientationTypeId ? true : undefined}>
        <FieldLabel htmlFor="orientationTypeId" className="font-semibold">
          {REQUEST_APPOINTMENT_TEXT.topicLabel}
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        </FieldLabel>
        <Select
          items={topicItems}
          value={values.orientationTypeId || null}
          disabled={isLoadingTopics || isSubmitting}
          onValueChange={(value) => updateValues("orientationTypeId", value ?? "")}
        >
          <SelectTrigger
            id="orientationTypeId"
            aria-invalid={errors.orientationTypeId ? true : undefined}
            aria-describedby={errors.orientationTypeId ? "orientationTypeId-error" : undefined}
            className="h-10 w-full"
          >
            <SelectValue placeholder={REQUEST_APPOINTMENT_TEXT.topicPlaceholder} />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="max-h-[min(200px,var(--available-height))]">
            {topicItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.orientationTypeId && (
          <FieldError id="orientationTypeId-error">{errors.orientationTypeId}</FieldError>
        )}
      </Field>

      <Field data-invalid={errors.message ? true : undefined}>
        <FieldLabel htmlFor="appointment-message" className="font-semibold">
          {REQUEST_APPOINTMENT_TEXT.messageLabel}
        </FieldLabel>
        <Textarea
          id="appointment-message"
          value={values.message}
          disabled={isSubmitting}
          onChange={(event) => updateValues("message", event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "appointment-message-error" : "appointment-message-count"}
          className="min-h-24 w-full"
        />
        <FieldDescription
          id="appointment-message-count"
          className={cn("text-xs", isMessageTooLong && "text-destructive")}
        >
          {values.message.trim().length} / {APPOINTMENT_MESSAGE_MAX_LENGTH}
        </FieldDescription>
        {errors.message && <FieldError id="appointment-message-error">{errors.message}</FieldError>}
      </Field>

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-brand-hover"
        disabled={isSubmitting}
      >
        {isSubmitting ? REQUEST_APPOINTMENT_TEXT.submitting : REQUEST_APPOINTMENT_TEXT.submit}
      </Button>
      <FieldDescription className="text-xs">
        {REQUEST_APPOINTMENT_TEXT.instantConfirmationNote}
      </FieldDescription>
    </form>
  );
}
