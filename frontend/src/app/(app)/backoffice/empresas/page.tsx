import type { Metadata } from "next";
import { CompanyRequestInboxView } from "@/modules/request-review/views/company-request-inbox-view";

export const metadata: Metadata = {
  title: "Solicitudes de empresas",
};

export default function BackofficeCompaniesPage() {
  return <CompanyRequestInboxView />;
}