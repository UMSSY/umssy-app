import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CV_UPLOAD_LABELS } from "../config/cv-upload.config";
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from "../config/form-styles.config";
import type { CvUploadCardProps } from "../types/cv-upload-card-props.types";
import { formatFileSize } from "../utils/format-file-size";
import { SectionCard } from "./section-card";

export function CvUploadCard({
  selectedFile,
  isUploading,
  isBusy,
  onSelectFile,
  onConfirmUpload,
}: CvUploadCardProps) {
  return (
    <SectionCard title={CV_UPLOAD_LABELS.title}>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-soft px-6 py-10 text-center">
        <p className="text-[15px] font-semibold text-ink">{CV_UPLOAD_LABELS.instructions}</p>
        <Button
          type="button"
          variant="outline"
          className={cn(SECONDARY_BUTTON_CLASS, "mt-3")}
          disabled={isBusy}
          onClick={onSelectFile}
        >
          {CV_UPLOAD_LABELS.select}
        </Button>
        {selectedFile ? (
          <p className="mt-2 text-[13px] break-all text-text-secondary">
            {selectedFile.name} · {formatFileSize(selectedFile.size)}
          </p>
        ) : null}
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          className={PRIMARY_BUTTON_CLASS}
          disabled={!selectedFile || isBusy}
          onClick={selectedFile ? () => onConfirmUpload(selectedFile) : undefined}
        >
          {isUploading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {isUploading ? CV_UPLOAD_LABELS.uploading : CV_UPLOAD_LABELS.confirm}
        </Button>
      </div>
    </SectionCard>
  );
}
