import type { CityOption } from "./city-option.types";
import type { PersonalInfoValues } from "./personal-info-values.types";

export interface PersonalInfoFormProps {
  initialValues: PersonalInfoValues;
  cities: CityOption[];
  isSaving?: boolean;
  onSubmit: (values: PersonalInfoValues) => void;
}
