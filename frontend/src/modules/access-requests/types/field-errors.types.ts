import type { PersonalDataFieldName } from "./personal-data-field-name.types";

export type FieldErrors = Partial<
  Record<PersonalDataFieldName | "documentType", string>
>;
