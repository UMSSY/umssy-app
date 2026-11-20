import type { Metadata } from "next";
import { CompanyRequestDetailView } from "@/modules/request-review/views/company-request-detail-view";

export const metadata: Metadata = {
  title: "Revisar solicitud de empresa",
};

export default async function BackofficeCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompanyRequestDetailView id={id} />;
}