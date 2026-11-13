"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { CV_EXTRACTION_FALLBACK_TEXTS, CV_MANUAL_FILL_HREF } from "../constants/cv-extraction.constants";
import type { CvExtractionFallbackProps } from "../types/cv-extraction-fallback-props.types";

export function CvExtractionFallback({
  title,
  message,
  canRetry = false,
  onRetry,
  onManualFill,
}: CvExtractionFallbackProps) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-3">
        {canRetry && onRetry ? (
          <Button type="button" variant="outline" className="h-10 border-border-strong px-4 text-sm" onClick={onRetry}>
            <RotateCcw aria-hidden="true" className="size-4" />
            {CV_EXTRACTION_FALLBACK_TEXTS.retry}
          </Button>
        ) : null}
        <Link
          href={CV_MANUAL_FILL_HREF}
          className={buttonVariants({ variant: canRetry ? "ghost" : "outline", className: "h-10 px-4 text-sm" })}
          onClick={onManualFill}
        >
          {CV_EXTRACTION_FALLBACK_TEXTS.manualFill}
        </Link>
      </div>
    </div>
  );
}
