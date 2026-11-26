"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CompanyLogoBg } from "../../types/company-logo-bg.types";
import type { CompanyLogoModalProps } from "../../types/company-logo-modal-props.types";

const MODAL_BG_CLASS: Record<CompanyLogoBg, string> = {
  light: "bg-white",
  dark: "bg-slate-900",
  checkered:
    "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:16px_16px]",
};

export function CompanyRequestLogoModal({
  open,
  onOpenChange,
  companyName,
  requestCode,
  logoUrl,
  logoBg,
  onChangeLogoBg,
}: CompanyLogoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-editor-dialog flex-col overflow-hidden p-5 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-border pr-8 pb-3">
          <DialogTitle className="text-base font-bold text-ink">
            Logotipo Oficial: {companyName}
          </DialogTitle>
          <DialogDescription className="text-xs text-text-secondary">
            Inspección ampliada de calidad y contraste visual.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`my-2 flex min-h-[260px] flex-1 items-center justify-center overflow-auto rounded-xl border border-border p-8 ${MODAL_BG_CLASS[logoBg]}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={`Logo de ${companyName}`}
            className="max-h-72 max-w-full object-contain"
          />
        </div>

        <DialogFooter className="flex shrink-0 flex-col gap-2 border-t border-border bg-popover pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <Button
              type="button"
              variant={logoBg === "light" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => onChangeLogoBg("light")}
            >
              Claro
            </Button>
            <Button
              type="button"
              variant={logoBg === "dark" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => onChangeLogoBg("dark")}
            >
              Oscuro
            </Button>
            <Button
              type="button"
              variant={logoBg === "checkered" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => onChangeLogoBg("checkered")}
            >
              Mosaico
            </Button>
          </div>
          <a
            href={logoUrl}
            download={`logo-${requestCode ?? "empresa"}.png`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Download className="size-3.5" aria-hidden="true" /> Descargar
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
