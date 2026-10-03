import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SECONDARY_BUTTON_CLASS } from "../config/form-styles.config";
import type { ProfilePhotoFieldProps } from "../types/profile-photo-field-props.types";
import { ProfileAvatar } from "./profile-avatar";

// The actual photo upload is implemented in issue #64.
export function ProfilePhotoField({ onSelectPhoto }: ProfilePhotoFieldProps) {
  return (
    <div className="flex items-center gap-8 border-b border-border pb-8">
      <ProfileAvatar label="Foto" />
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold text-ink">Fotografía de perfil</p>
        <p className="text-[13px] text-text-secondary">Ayuda a que otras personas te reconozcan.</p>
        <Button
          type="button"
          variant="outline"
          className={cn(SECONDARY_BUTTON_CLASS, "mt-3 w-fit")}
          disabled={!onSelectPhoto}
          title={onSelectPhoto ? undefined : "Disponible próximamente"}
          onClick={onSelectPhoto}
        >
          Subir fotografía
        </Button>
      </div>
    </div>
  );
}
