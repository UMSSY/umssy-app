"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CvExportDialog } from "./cv-export-dialog";

export function CvGenerateCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section
      aria-label="Generar CV con los datos del perfil"
      className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">
          ¿Sin CV? Crea uno con los datos de tu perfil
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Genera automáticamente un documento PDF profesional con la información registrada en tu
          perfil de titulado.
        </p>
      </div>
      <Button
        type="button"
        className="h-11 shrink-0 bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
        onClick={() => setIsOpen(true)}
      >
        <Plus aria-hidden="true" className="size-4" />
        Generar CV
      </Button>
      <CvExportDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </section>
  );
}
