import type { DocumentType } from "../constants/document-types.constants";
import type { FieldErrors } from "./field-errors.types";
import type { PersonalDataFieldName } from "./personal-data-field-name.types";
import type { PersonalDataValues } from "./personal-data-values.types";
import type { SubmitStatus } from "./submit-status.types";
import type { RequestStep } from "./request-step.types";
import type { ClearResult } from "./clear-result.types";
import type { FormNotice } from "./form-notice.types";
import type { Submission } from "./submission.types";
import type { DocumentState } from "./document-state.types";

export interface AccessRequestContextValue {
  values: PersonalDataValues;
  draftId: string | null;
  status: SubmitStatus;
  fieldErrors: FieldErrors;
  notice: FormNotice | null;
  hasData: boolean;
  currentStep: RequestStep;
  document: DocumentState;
  hasDocument: boolean;
  submission: Submission | null;
  submitError: string | null;
  setValue: (field: PersonalDataFieldName, value: string) => void;
  submit: () => Promise<void>;
  clear: () => Promise<ClearResult>;
  goToStep: (step: RequestStep) => void;
  selectDocumentType: (type: DocumentType) => void;
  uploadDocument: (file: File) => Promise<void>;
  removeDocument: () => Promise<void>;
  submitRequest: () => Promise<void>;
  refreshSubmission: () => Promise<void>;
}
