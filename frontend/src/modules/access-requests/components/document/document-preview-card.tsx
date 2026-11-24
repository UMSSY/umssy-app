"use client";

import { useAccessRequestForm } from "../../contexts/access-request-context";
import { DocumentPreviewContent } from "./document-preview-content";

export function DocumentPreviewCard() {
  const { status, document: documentState, hasDocument, removeDocument } = useAccessRequestForm();
  if (!hasDocument) return null;

  return (
    <DocumentPreviewContent
      document={documentState}
      isDisabled={status !== "idle"}
      isRemoving={status === "removing"}
      onRemove={removeDocument}
    />
  );
}
