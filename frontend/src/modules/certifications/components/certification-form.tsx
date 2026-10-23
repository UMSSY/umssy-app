"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/shared/components/date-field";
import { Input } from "@/components/ui/input";
import type { CertificationDocumentChange } from "../types/certification-document-change.types";
import type { CertificationErrors } from "../types/certification-errors.types";
import type { CertificationFormProps } from "../types/certification-form-props.types";
import type { CreateCertificationDto } from "../types/create-certification-dto.types";
import { getFieldErrorProps } from "@/modules/profile";
import { trimFormValues } from "@/modules/profile";
import {
  CERTIFICATION_NAME_MAX_LENGTH,
  CERTIFICATION_VALIDATION_MESSAGES,
  ISSUING_ORGANIZATION_MAX_LENGTH,
} from "../config/certification-validation.config";
import { CERTIFICATION_MIN_ISSUE_DATE } from "../constants/certification-form.constants";
import { readCertificateFile } from "../utils/read-certificate-file";
import { getTodayIsoDate, validateCertification } from "../utils/validate-certification";
import { CertificationDocumentField } from "./certification-document-field";
import { FormFieldset } from "@/shared/components/layout/form-fieldset";
import { FormField } from "@/modules/profile";

const EMPTY_CERTIFICATION_VALUES: CreateCertificationDto = {
  name: "",
  issuingOrganization: "",
  issueDate: "",
};

function getDocumentChange(
  selectedFile: File | null,
  isRemovingDocument: boolean,
): CertificationDocumentChange {
  if (selectedFile) {
    return { type: "replace", file: selectedFile };
  }
  return isRemovingDocument ? { type: "remove" } : { type: "keep" };
}

export function CertificationForm({
  initialData,
  currentDocumentName,
  onSubmit,
  onCancel,
  onValuesChange,
}: CertificationFormProps) {
  const [values, setValues] = useState<CreateCertificationDto>(
    initialData ?? EMPTY_CERTIFICATION_VALUES,
  );
  const [errors, setErrors] = useState<CertificationErrors>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [submitFileError, setSubmitFileError] = useState<string | undefined>();
  const [isRemovingDocument, setIsRemovingDocument] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectionIdRef = useRef(0);
  const isEditing = Boolean(initialData);
  const isBusy = isSubmitting;
  const title = isEditing ? "Editar certificación" : "Agregar certificación";

  const handleValueChange = (field: keyof CreateCertificationDto, value: string) => {
    onValuesChange?.();
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => handleValueChange(event.target.name as keyof CreateCertificationDto, event.target.value);

  const handleSelectFile = async (file: File) => {
    onValuesChange?.();
    const selectionId = ++selectionIdRef.current;
    setSubmitFileError(undefined);
    setFileError(undefined);
    setSelectedFile(null);
    setIsReadingFile(true);
    const error = await readCertificateFile(file);
    if (selectionId !== selectionIdRef.current) {
      return;
    }

    setIsReadingFile(false);
    if (error) {
      setFileError(error);
      return;
    }

    setSelectedFile(file);
    setIsRemovingDocument(false);
  };

  const handleClearFile = () => {
    onValuesChange?.();
    selectionIdRef.current += 1;
    setIsReadingFile(false);
    setSelectedFile(null);
    setFileError(undefined);
    setSubmitFileError(undefined);
  };

  const handleRemoveCurrentDocument = () => {
    onValuesChange?.();
    selectionIdRef.current += 1;
    setIsReadingFile(false);
    setSelectedFile(null);
    setFileError(undefined);
    setSubmitFileError(undefined);
    setIsRemovingDocument(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isReadingFile || isSubmitting) {
      return;
    }

    const trimmedValues = trimFormValues(values);
    const validationErrors = validateCertification(trimmedValues);

    let currentFileError = fileError;
    const hasDocument = Boolean(selectedFile) || Boolean(currentDocumentName && !isRemovingDocument);
    if (!hasDocument) {
      currentFileError = CERTIFICATION_VALIDATION_MESSAGES.documentRequired;
      setFileError(currentFileError);
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0 || currentFileError) {
      return;
    }

    setSubmitFileError(undefined);
    setIsSubmitting(true);
    try {
      const failureMessage = await onSubmit(
        trimmedValues,
        getDocumentChange(selectedFile, isRemovingDocument),
      );
      if (failureMessage) {
        setSubmitFileError(failureMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form aria-label={title} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h3 className="font-tight text-lg font-bold text-ink">{title}</h3>
      <FormFieldset title="Certificación">
      <FormField
        id="certification-name"
        label="Nombre de la certificación"
        isRequired
        error={errors.name}
      >
        <Input
          id="certification-name"
          name="name"
          type="text"
          maxLength={CERTIFICATION_NAME_MAX_LENGTH}
          placeholder="Ej. AWS Certified Cloud Practitioner"
          value={values.name}
          disabled={isBusy}
          onChange={handleChange}
          className="h-11"
          {...getFieldErrorProps("certification-name", errors.name)}
        />
      </FormField>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          id="certification-issuingOrganization"
          label="Entidad emisora"
          isRequired
          error={errors.issuingOrganization}
        >
          <Input
            id="certification-issuingOrganization"
            name="issuingOrganization"
            type="text"
            maxLength={ISSUING_ORGANIZATION_MAX_LENGTH}
            placeholder="Ej. Amazon Web Services"
            value={values.issuingOrganization}
            disabled={isBusy}
            onChange={handleChange}
            className="h-11"
            {...getFieldErrorProps("certification-issuingOrganization", errors.issuingOrganization)}
          />
        </FormField>
        <FormField
          id="certification-issueDate"
          label="Fecha de obtención"
          isRequired
          error={errors.issueDate}
        >
          <DateField
            id="certification-issueDate"
            name="issueDate"

            min={CERTIFICATION_MIN_ISSUE_DATE}
            max={getTodayIsoDate()}
            value={values.issueDate}
            disabled={isBusy}
            onValueChange={(value) => handleValueChange("issueDate", value)}
            className="h-11"
            {...getFieldErrorProps("certification-issueDate", errors.issueDate)}
          />
        </FormField>
      </div>
      </FormFieldset>
      <FormFieldset title="Documento de respaldo">
      <CertificationDocumentField
        id={isEditing ? "edit-certification-document" : "create-certification-document"}
        selectedFile={selectedFile}
        currentDocumentName={currentDocumentName}
        isRemovalPending={isRemovingDocument}
        isRequired={true}
        error={fileError ?? submitFileError}
        disabled={isBusy}
        isReading={isReadingFile}
        onSelectFile={handleSelectFile}
        onClearFile={handleClearFile}
        onRemoveCurrent={handleRemoveCurrentDocument}
      />
      </FormFieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-text-secondary">* Campos obligatorios</p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
            disabled={isBusy}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="h-10 min-w-40 bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover"
            disabled={isBusy || isReadingFile}
          >
            {isBusy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            {isBusy ? "Guardando..." : "Guardar certificación"}
          </Button>
        </div>
      </div>
    </form>
  );
}
