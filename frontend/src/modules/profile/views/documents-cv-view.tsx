"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ConfirmDeleteDialog } from "../components/confirm-delete-dialog";
import { CvUploadCard } from "../components/cv-upload-card";
import { FeedbackMessage } from "../components/feedback-message";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { SavedCvCard } from "../components/saved-cv-card";
import {
  CV_DELETE_DIALOG_TEXTS,
  CV_FEEDBACK_MESSAGES,
  CV_FILE_INPUT_ACCEPT,
  CV_UPLOAD_LABELS,
} from "../config/cv-upload.config";
import type { DocumentsCvViewProps } from "../types/documents-cv-view-props.types";
import type { Feedback } from "../types/feedback.types";
import type { SavedCv } from "../types/saved-cv.types";
import { deleteCvInMemory } from "../utils/delete-cv-in-memory";
import { uploadCvInMemory } from "../utils/upload-cv-in-memory";
import { validateCvFile } from "../utils/validate-cv-file";

export function DocumentsCvView({
  uploadCv = uploadCvInMemory,
  deleteCv = deleteCvInMemory,
}: DocumentsCvViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedCv, setSavedCv] = useState<SavedCv | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isBusy = isUploading || isDeleting;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateCvFile(file);

    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setFeedback(null);
    setSelectedFile(file);
  };

  const handleConfirmUpload = async (file: File) => {
    const isReplacing = savedCv !== null;
    setFeedback(null);
    setIsUploading(true);

    const uploadedCv = await uploadCv(file);

    setSavedCv(uploadedCv);
    setSelectedFile(null);
    setIsUploading(false);
    setFeedback({
      type: "success",
      message: isReplacing ? CV_FEEDBACK_MESSAGES.replaced : CV_FEEDBACK_MESSAGES.uploaded,
    });
  };

  const openDeleteDialog = () => {
    setFeedback(null);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    await deleteCv();

    setSavedCv(null);
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
    setFeedback({ type: "success", message: CV_FEEDBACK_MESSAGES.deleted });
  };

  return (
    <ProfilePageLayout
      activeTab="documents"
      title="Currículum Vitae"
      description="Sube tu CV para tenerlo disponible en el perfil y mantenerlo actualizado"
    >
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}
      <input
        ref={fileInputRef}
        type="file"
        accept={CV_FILE_INPUT_ACCEPT}
        aria-label={CV_UPLOAD_LABELS.fileInput}
        hidden
        onChange={handleFileChange}
      />
      <div className="grid grid-cols-2 items-start gap-6">
        <CvUploadCard
          selectedFile={selectedFile}
          isUploading={isUploading}
          isBusy={isBusy}
          onSelectFile={openFilePicker}
          onConfirmUpload={handleConfirmUpload}
        />
        <SavedCvCard
          savedCv={savedCv}
          isBusy={isBusy}
          onReplace={openFilePicker}
          onDelete={openDeleteDialog}
        />
      </div>
      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        title={CV_DELETE_DIALOG_TEXTS.title}
        message={CV_DELETE_DIALOG_TEXTS.message}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />
    </ProfilePageLayout>
  );
}
