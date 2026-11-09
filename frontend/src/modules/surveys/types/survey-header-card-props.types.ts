import type { SurveyFieldName } from "./survey-field-name.types";
import type { SurveyHeaderValues } from "./survey-header-values.types";
import type { SurveyErrorMap } from "./survey-error-map.types";
import type { Career } from "./career.types";

export interface SurveyHeaderCardProps {
  values: SurveyHeaderValues;
  careers: Career[];
  isLoadingCareers: boolean;
  careersErrorMessage?: string;
  academicPeriods: string[];
  minDate: Date;
  errors: SurveyErrorMap;
  onFieldChange: (field: SurveyFieldName, value: string) => void;
}
