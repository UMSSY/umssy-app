import type { CompanyAccessRequestItem } from "@/modules/access-requests";

export interface CompanyRequestTableProps {
  items: CompanyAccessRequestItem[];
  isLoading?: boolean;
}
