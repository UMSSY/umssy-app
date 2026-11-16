import { format } from "date-fns/format";
import { es } from "date-fns/locale/es";

export function formatExpirationDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}