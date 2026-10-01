import { Metadata } from "next";
import { AcceptedUsersReportView } from "@/modules/analytics";

export const metadata: Metadata = {
  title: "Reporte de usuarios registrados aceptados - UMSSY",
  description:
    "Reporte analítico institucional de usuarios registrados y aceptados en la plataforma UMSSY.",
};

export default function AcceptedUsersReportPage() {
  return <AcceptedUsersReportView />;
}
