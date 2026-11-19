import type { Metadata } from "next";
import { CompanyProfileView } from "@/modules/company-profile";

export const metadata: Metadata = {
  title: "Perfil de Empresa - HU14",
};

export default function CompanyProfilePage() {
  return <CompanyProfileView />;
}