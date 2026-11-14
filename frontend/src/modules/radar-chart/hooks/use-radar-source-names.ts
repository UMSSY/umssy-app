"use client";

import { useQuery } from "@tanstack/react-query";
import { documentsService } from "@/modules/documents";
import { useCertifications } from "@/modules/certifications";
import type { Epic2Skill } from "../types/epic2-skill.types";

export function useRadarSourceNames(userId: string, skills: Epic2Skill[]) {
  const cvIds = [...new Set(skills.flatMap(skill => skill.evidenceRefs.filter(ref => ref.type === "cv").map(ref => ref.id)))].sort();
  const certificationIds = [...new Set(skills.flatMap(skill => skill.evidenceRefs.filter(ref => ref.type === "certification").map(ref => ref.id)))].sort();
  const cvs = useQuery({
    queryKey: ["radar-source-names", userId, "cv", cvIds],
    enabled: cvIds.length > 0,
    retry: false,
    queryFn: async () => {
      const names: Record<string, string> = {};
      let page = 1;
      let totalPages = 1;
      do {
        const result = await documentsService.getCvs(page, 10);
        for (const item of result.items) {
          if (cvIds.includes(item.id) && item.fileName.trim()) names[item.id] = item.fileName;
        }
        totalPages = result.totalPages;
        page += 1;
      } while (page <= totalPages && cvIds.some(id => !names[id]));
      return names;
    },
  });
  const certifications = useCertifications({
    enabled: certificationIds.length > 0,
  });

  const getName = (ref: Epic2Skill["evidenceRefs"][number]): string => {
    if (ref.type === "cv") return cvs.data?.[ref.id] ?? (cvs.isFetching ? "Cargando nombre del CV…" : "CV de origen no disponible");
    if (ref.type === "certification") {
      const item = certifications.certifications.find(item => item.id === ref.id);
      return item
        ? (item.document?.fileName?.trim() || item.name)
        : (certifications.isLoading ? "Cargando certificación…" : "Certificación de origen no disponible");
    }
    if (ref.type === "presentation") return "Presentación profesional del perfil";
    if (ref.type === "education") return "Formación académica del perfil";
    if (ref.type === "work-experience") return "Experiencia laboral del perfil";
    return "Fuente de origen no disponible";
  };
  return { getName, hasError: cvs.isError || Boolean(certifications.error), retry: () => {
    if (cvIds.length) void cvs.refetch();
    if (certificationIds.length) void certifications.reload();
  } };
}
