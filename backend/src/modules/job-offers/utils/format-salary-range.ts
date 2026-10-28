import { JOB_OFFER_SALARY_TO_BE_AGREED } from '../constants/job-offer.constants.js';

const THOUSANDS_SEPARATOR_REGEX = /\B(?=(\d{3})+(?!\d))/g;

export function formatBolivianos(amount: number): string {
  return `Bs ${amount.toString().replace(THOUSANDS_SEPARATOR_REGEX, '.')}`;
}

export function formatSalaryRange(salaryMin?: number, salaryMax?: number): string {
  if (salaryMin === undefined) return JOB_OFFER_SALARY_TO_BE_AGREED;
  if (salaryMax === undefined) return formatBolivianos(salaryMin);
  return `${formatBolivianos(salaryMin)} - ${formatBolivianos(salaryMax).replace('Bs ', '')}`;
}
