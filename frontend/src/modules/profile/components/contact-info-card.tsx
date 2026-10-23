"use client";

import { cn } from "@/lib/utils";
import { useProfileSurface } from "../contexts/profile-surface-context";
import { Mail, MapPin, Phone } from "lucide-react";
import type { ContactInfoCardProps } from "../types/contact-info-card-props.types";
import { getInitials } from "../utils/get-initials";
import { EditSectionLink } from "./edit-section-link";
import { ProfileAvatar } from "./profile-avatar";
import { ProfileInfoItem } from "./profile-info-item";

export function ContactInfoCard({ profile, photoUrl }: ContactInfoCardProps) {
  const isEmbedded = useProfileSurface();
  const fullName = (profile.fullName ?? "").trim();
  const headline = (profile.headline ?? "").trim();

  return (
    <section aria-label="Datos personales y contacto" className={cn("overflow-hidden bg-surface", !isEmbedded && "rounded-lg border border-border")}>
      <div className="flex flex-wrap items-center gap-6 bg-availability p-6 lg:p-8">
        <ProfileAvatar label={fullName ? getInitials(fullName) : "Foto"} photoUrl={photoUrl} />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold break-words text-availability-foreground">{fullName || "Tu nombre"}</h2>
          <p className="mt-2 max-w-2xl text-base break-words text-availability-foreground">
            {headline || "Aún no agregaste un titular profesional"}
          </p>
        </div>
        <EditSectionLink href="/profile/settings#personal-info" sectionName="datos personales" />
      </div>
      <dl className="grid gap-6 border-t border-border bg-surface px-6 py-5 md:grid-cols-3 lg:px-8">
        <ProfileInfoItem icon={MapPin} label="Ciudad de residencia" value={profile.city} />
        <ProfileInfoItem icon={Phone} label="Teléfono" value={profile.phone} />
        <ProfileInfoItem icon={Mail} label="Correo personal" value={profile.personalEmail} />
      </dl>
    </section>
  );
}
