"use client";

import { ProfilePageLayout } from "@/modules/profile";
import { DocumentsCvContent } from "../components/documents-cv-content";

export function DocumentsCvView() {
  return (
    <ProfilePageLayout
      title="Documentos y CV"
      description="Sube tu CV para tenerlo disponible en el perfil y mantenerlo actualizado"
    >
      <DocumentsCvContent />
    </ProfilePageLayout>
  );
}
