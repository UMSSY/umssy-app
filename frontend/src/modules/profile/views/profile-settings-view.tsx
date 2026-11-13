"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { PersonalInfoSettings } from "../components/personal-info-settings";
import { PresentationSettings } from "../components/presentation-settings";

export function ProfileSettingsView() {
  return (
    <ProfilePageLayout title="Configuración del perfil" description="Actualiza tus datos y tu presentación. Cada sección guarda sus propios cambios." actions={<Link href="/profile" className={buttonVariants({ variant: "outline" })}><ArrowLeft aria-hidden="true" />Ver mi perfil</Link>}>
      <div className="max-w-5xl space-y-10">
        <PersonalInfoSettings />
        <PresentationSettings />
      </div>
    </ProfilePageLayout>
  );
}
