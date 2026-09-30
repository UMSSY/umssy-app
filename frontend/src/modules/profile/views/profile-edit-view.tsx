"use client";

import Link from "next/link";
import { useState } from "react";
import { PersonalInfoForm } from "../components/personal-info-form";
import { PresentationForm } from "../components/presentation-form";
import { ProfileLoadState } from "../components/profile-load-state";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { ProfileTabs } from "../components/profile-tabs";
import { useProfile } from "../hooks/use-profile";
import type { ProfileTab } from "../types/profile.types";
import { TEXT_BUTTON_CLASS } from "../utils/ui-classes";

interface TabContent {
  title: string;
  description: string;
}

const TAB_CONTENT: Record<ProfileTab, TabContent> = {
  personal: {
    title: "Datos personales y contacto",
    description: "Registra tu información para que la comunidad pueda identificarte y contactarte.",
  },
  presentation: {
    title: "Presentación profesional",
    description: "Escribe cómo quieres presentarte ante egresados, mentores y empresas.",
  },
  trajectory: {
    title: "Trayectoria",
    description: "Registra tu formación, experiencia, habilidades y certificaciones.",
  },
  documents: {
    title: "Documentos",
    description: "Sube tu currículum y los respaldos de tus certificaciones.",
  },
};

interface ProfileEditViewProps {
  initialTab?: ProfileTab;
}

export function ProfileEditView({ initialTab = "personal" }: ProfileEditViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const { status, profile, cities, errorMessage, reload, replaceProfile } = useProfile();
  const content = TAB_CONTENT[activeTab];

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `?tab=${tab}`);
  };

  const renderContent = () => {
    if (status !== "success" || !profile) {
      return (
        <ProfileLoadState
          status={status === "error" ? "error" : "loading"}
          errorMessage={errorMessage}
          onRetry={reload}
        />
      );
    }

    if (activeTab === "personal") {
      return (
        <PersonalInfoForm profile={profile} cities={cities} onProfileChange={replaceProfile} />
      );
    }

    if (activeTab === "presentation") {
      return <PresentationForm profile={profile} onProfileChange={replaceProfile} />;
    }

    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-[15px] text-text-secondary">
        Esta sección estará disponible próximamente.
      </p>
    );
  };

  return (
    <ProfilePageLayout section={content.title}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-tight text-[30px] leading-tight font-extrabold text-ink md:text-[36px]">
            {content.title}
          </h1>
          <p className="mt-2 text-[15px] text-text-secondary">{content.description}</p>
        </div>
        <Link href="/profile" className={TEXT_BUTTON_CLASS}>
          Ver mi perfil
        </Link>
      </div>

      <ProfileTabs activeTab={activeTab} onChange={handleTabChange} />
      {renderContent()}
    </ProfilePageLayout>
  );
}
