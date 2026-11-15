import { CircleCheck, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CvUploadCardProps } from "../types/cv-upload-card-props.types";
import { formatFileSize } from "@/modules/profile";
import { SectionCard } from "@/modules/profile";
import { CvDropzone } from "./cv-dropzone";

export function CvUploadCard({
  selectedFile,
  hasSavedCv,
  isLoading = false,
  isUploading,
  isBusy,
  uploadProgress,
  onSelectFile,
  onFileDropped,
  onConfirmUpload,
}: CvUploadCardProps) {
  if (isLoading) {
    return (
      <SectionCard title="Subir currículum">
        <div aria-busy="true" className="flex flex-col items-center gap-3 px-6 py-10">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-12 w-40" />
        </div>
      </SectionCard>
    );
  }

  if (hasSavedCv) {
    return (
      <SectionCard title="Subir currículum">
        <CvDropzone
          title="Ya tienes un CV vigente"
          description="Sube una nueva versión en PDF. Tu CV actual pasará al historial."
          selectLabel={isUploading ? "Cargando..." : "Subir nueva versión"}
          icon={<CircleCheck aria-hidden="true" className="size-6 text-ink-soft" />}
          isDisabled={isBusy}
          isUploading={isUploading}
          isSelectPending={isUploading}
          progress={uploadProgress}
          onSelectFile={onSelectFile}
          onFileDropped={onFileDropped}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Subir currículum">
      <CvDropzone
        title="Selecciona tu CV en formato PDF"
        selectLabel="Seleccionar PDF"
        isDisabled={isBusy}
        isUploading={isUploading}
        progress={uploadProgress}
        onSelectFile={onSelectFile}
        onFileDropped={onFileDropped}
      >
        {selectedFile ? (
          <p className="mt-2 text-sm break-all text-text-secondary">
            {selectedFile.name} · {formatFileSize(selectedFile.size)}
          </p>
        ) : null}
      </CvDropzone>
      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          className="h-10 bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover"
          disabled={!selectedFile || isBusy}
          onClick={selectedFile ? () => onConfirmUpload(selectedFile) : undefined}
        >
          {isUploading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {isUploading ? "Cargando..." : "Confirmar carga"}
        </Button>
      </div>
    </SectionCard>
  );
}
