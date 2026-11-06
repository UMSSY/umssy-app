"use client";

import { useAccessRequestForm } from "../../contexts/access-request-context";
import { DocumentDropzoneContent } from "./document-dropzone-content";

export function DocumentDropzone() {
  const { status, document: documentState, uploadDocument } = useAccessRequestForm();

  return (
    <DocumentDropzoneContent
      isDisabled={status !== "idle"}
      isUploading={status === "uploading"}
      progress={documentState.progress}
      error={documentState.error}
      onFileSelected={uploadDocument}
    />
  );
}
