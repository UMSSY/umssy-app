import type { Metadata } from "next";
import { CompanyProfileContainer } from "@/modules/company-profile";

export const metadata: Metadata = {
  title: "Perfil de Empresa - HU10",
};

export default function CompanyProfilePage() {
  return <CompanyProfileContainer />;
}