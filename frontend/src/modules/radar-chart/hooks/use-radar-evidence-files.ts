"use client";

import { useQueryClient } from "@tanstack/react-query";
import { certificationsService } from "@/modules/certifications";
import { documentsService } from "@/modules/documents";

export function useRadarEvidenceFiles() {
  const queryClient = useQueryClient();

  const getFile = (
    kind: "cv" | "certification",
    id: string,
  ): Promise<Blob | null> =>
    queryClient.fetchQuery({
      queryKey: ["radar-integration", "evidence-file", kind, id],
      queryFn: () =>
        kind === "cv"
          ? documentsService.getCvFile(id)
          : certificationsService.getDocument(id),
      staleTime: 30_000,
    });

  return { getFile };
}
