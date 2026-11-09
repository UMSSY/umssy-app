"use client";
import { EducationCatalogCombobox } from "./education-catalog-combobox";
import { EDUCATION_INSTITUTION_TEXTS } from '../constants/education-institutions.constants';
import type { EducationInstitutionComboboxProps } from '../types/education-institution-combobox-props.types';

export function EducationInstitutionCombobox({
  institutions = [],
  ...props
}: EducationInstitutionComboboxProps) {
  return (
    <EducationCatalogCombobox
      {...props}
      options={institutions}
      texts={EDUCATION_INSTITUTION_TEXTS}
      name="institution"
      autoFocus={true}
    />
  );
}
