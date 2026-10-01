import { Metadata } from "next";
import { AcceptedUsersReportView } from "@/modules/analytics";

export const metadata: Metadata = {
  title: "Reportes Analíticos - UMSSY",
  description: "Módulo de análisis institucional UMSSY",
};

export default function AnalyticsPage() {
  return <AcceptedUsersReportView />;
}
