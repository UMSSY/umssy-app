"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useProfileMutations } from "../hooks/use-profile-mutations";
import { profileService } from "../services/profile.service";
import type { FormFeedback, UserProfile } from "../types/profile.types";
import { getApiErrorMessage } from "../utils/api-error";
import { validatePhotoFile } from "../utils/profile-validation";
import { SECONDARY_BUTTON_CLASS, TEXT_BUTTON_CLASS } from "../utils/ui-classes";
import { FormFeedbackMessage } from "./form-feedback-message";
import { ProfileAvatar } from "./profile-avatar";

interface ProfilePhotoUploaderProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

export function ProfilePhotoUploader({ profile, onProfileChange }: ProfilePhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { pendingMutation, uploadPhoto, removePhoto } = useProfileMutations();
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);

  const photoUrl = profileService.buildPhotoUrl(profile.photoPath);
  const isBusy = pendingMutation !== null;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validatePhotoFile(file);
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    try {
      onProfileChange(await uploadPhoto(file));
      setFeedback({ type: "success", message: "Tu fotografía se actualizó correctamente." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "No se pudo subir la fotografía. Intenta nuevamente."),
      });
    }
  };

  const handleRemove = async () => {
    try {
      onProfileChange(await removePhoto());
      setFeedback({ type: "success", message: "Se quitó tu fotografía de perfil." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "No se pudo quitar la fotografía. Intenta nuevamente."),
      });
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-6">
      <div className="flex items-center gap-4 md:gap-8">
        <ProfileAvatar
          firstName={profile.firstName}
          lastName={profile.lastName}
          photoUrl={photoUrl}
          size="lg"
          placeholder="Foto"
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-[15px] font-semibold text-ink">Fotografía de perfil</p>
          <p className="hidden text-[13px] text-text-secondary sm:block">
            Ayuda a que otras personas te reconozcan. JPG, PNG o WEBP, máximo 2 MB.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Seleccionar fotografía de perfil"
              className="sr-only"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={SECONDARY_BUTTON_CLASS}
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
            >
              {pendingMutation === "upload-photo"
                ? "Subiendo..."
                : photoUrl
                  ? "Cambiar fotografía"
                  : "Subir fotografía"}
            </button>
            {photoUrl ? (
              <button
                type="button"
                className={TEXT_BUTTON_CLASS}
                disabled={isBusy}
                onClick={handleRemove}
              >
                {pendingMutation === "remove-photo" ? "Quitando..." : "Quitar"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <FormFeedbackMessage feedback={feedback} />
    </div>
  );
}
