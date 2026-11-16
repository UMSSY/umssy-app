import type { AcademicPeriod } from "./academic-period.types";

export interface ManagementMenuProps {
  value?: AcademicPeriod;
  onChange: (period?: AcademicPeriod) => void;
}
