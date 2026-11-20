"use client";
import { EducationCatalogCombobox } from "./education-catalog-combobox";
import { EDUCATION_DEGREE_TEXTS } from '../constants/education-degree-ui.constants';
import type { EducationDegreeComboboxProps } from '../types/education-degree-combobox-props.types';

export function EducationDegreeCombobox({
  degrees = [],
  ...props
}: EducationDegreeComboboxProps) {
  return (
    <EducationCatalogCombobox
      {...props}
      options={degrees}
      texts={EDUCATION_DEGREE_TEXTS}
      name="degree"
      autoFocus={false}
    />
  );
}
