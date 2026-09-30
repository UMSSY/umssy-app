"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ProfileAvatar } from "../components/profile-avatar";
import { ProfileLoadState } from "../components/profile-load-state";
import { ProfilePageLayout } from "../components/profile-page-layout";
import { SectionCard } from "../components/section-card";
import { useProfile } from "../hooks/use-profile";
import { profileService } from "../services/profile.service";
import type { UserProfile } from "../types/profile.types";
import { getFullName } from "../utils/profile-format";
import { SECONDARY_BUTTON_CLASS } from "../utils/ui-classes";

function isProfileIncomplete(profile: UserProfile): boolean {
  return [
    profile.city,
    profile.phone,
    profile.personalEmail,
    profile.headline,
    profile.aboutMe,
  ].some((value) => !value);
}

function EditLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={SECONDARY_BUTTON_CLASS}>
      {children}
    </Link>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-[15px] break-words text-ink">{value || "Sin registrar"}</dd>
    </div>
  );
}

function TextBlock({ text, emptyMessage }: { text: string | null; emptyMessage: string }) {
  return text ? (
    <p className="text-[15px] whitespace-pre-line break-words text-ink-soft">{text}</p>
  ) : (
    <p className="text-[15px] text-text-secondary">{emptyMessage}</p>
  );
}

export function ProfileOverviewView() {
  const { status, profile, errorMessage, reload } = useProfile();

  if (status !== "success" || !profile) {
    return (
      <ProfilePageLayout section="Mi perfil">
        <ProfileLoadState
          status={status === "error" ? "error" : "loading"}
          errorMessage={errorMessage}
          onRetry={reload}
        />
      </ProfilePageLayout>
    );
  }

  const fullName = getFullName(profile.firstName, profile.lastName);

  return (
    <ProfilePageLayout section="Mi perfil">
      <div className="flex flex-col gap-6">
        {isProfileIncomplete(profile) ? (
          <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-interaction p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] text-ink">
              Completa tu perfil para que egresados, mentores y empresas puedan identificarte y
              contactarte.
            </p>
            <EditLink href="/profile/edit">Completar perfil</EditLink>
          </div>
        ) : null}

        <SectionCard
          title="Datos personales y contacto"
          action={<EditLink href="/profile/edit?tab=personal">Editar</EditLink>}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <ProfileAvatar
              firstName={profile.firstName}
              lastName={profile.lastName}
              photoUrl={profileService.buildPhotoUrl(profile.photoPath)}
              size="lg"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <div>
                <h1 className="font-tight text-[26px] font-extrabold text-ink">{fullName}</h1>
                <p className="text-[15px] text-ink-soft">
                  {profile.headline || "Aún no agregaste un titular profesional"}
                </p>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Ciudad de residencia" value={profile.city?.title ?? null} />
                <InfoItem label="Teléfono" value={profile.phone} />
                <InfoItem label="Correo personal" value={profile.personalEmail} />
                <InfoItem label="Correo institucional" value={profile.institutionalEmail} />
              </dl>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Presentación profesional"
          action={<EditLink href="/profile/edit?tab=presentation">Editar</EditLink>}
        >
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="mb-1 font-tight text-[15px] font-bold text-ink">Acerca de</h3>
              <TextBlock
                text={profile.aboutMe}
                emptyMessage="Cuenta quién eres y en qué te especializas."
              />
            </div>
            <div>
              <h3 className="mb-1 font-tight text-[15px] font-bold text-ink">
                Oportunidades que me interesan
              </h3>
              <TextBlock
                text={profile.interestedOpportunities}
                emptyMessage="Indica qué oportunidades laborales te interesan."
              />
            </div>
          </div>
        </SectionCard>
      </div>
    </ProfilePageLayout>
  );
}
