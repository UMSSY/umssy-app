"use client";

import { useState, type DragEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "cn";
import { CV_UPLOAD_PROGRESS } from "../constants/cv-upload.constants";
import type { CvDropzoneProps } from "../types/cv-dropzone-props.types";

export function CvDropzone({
  title,
  description,
  selectLabel,
  icon,
  isDisabled = false,
  isUploading = false,
  isSelectPending = false,
  progress = CV_UPLOAD_PROGRESS.min,
  onSelectFile,
  onFileDropped,
  children,
}: CvDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDisabled) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    // Al cruzar elementos hijos también se dispara dragleave: solo cuenta salir de la zona.
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (!isDisabled && file) onFileDropped(file);
  };

  return (
    <div
      data-slot="cv-dropzone"
      data-dragging={isDragging ? "true" : undefined}
      aria-disabled={isDisabled || undefined}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-interaction/40 px-6 py-12 text-center transition-colors",
        isDragging && "border-ink bg-surface-soft",
        isDisabled && "opacity-60",
      )}
    >
      {icon}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
      <p className="text-xs text-text-secondary">También puedes arrastrar el archivo y soltarlo aquí.</p>
      <Button
        type="button"
        variant="outline"
        className="mt-3 h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
        disabled={isDisabled}
        onClick={onSelectFile}
      >
        {isSelectPending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
        {selectLabel}
      </Button>
      {children}
      {isUploading ? (
        <div aria-live="polite" className="mt-4 flex w-full max-w-sm flex-col gap-2">
          <Progress value={progress} aria-label="Progreso de la subida" />
          <p className="text-xs text-text-secondary">{`Subiendo... ${progress}%`}</p>
        </div>
      ) : null}
    </div>
  );
}
