"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CvExportDialog } from "./cv-export-dialog";

export function CvExportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className="h-10 bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover"
        onClick={() => setIsOpen(true)}
      >
        <Download aria-hidden="true" className="size-4" />
        Descargar CV en PDF
      </Button>
      <CvExportDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
