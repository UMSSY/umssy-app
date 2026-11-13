"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  Compass,
  GraduationCap,
  Layers3,
  Lightbulb,
  Star,
  Text,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { availabilityApi } from "@/modules/availability";
import { educationsService } from "@/modules/education";
import { profilePhotoService, profileService, type ProfileResponse } from "@/modules/profile";
import { workExperienceService } from "@/modules/work-experience";

type Recommendation = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  action: string;
};

type RecommendationData = {
  areas: string[];
  orientations: string[];
  profile?: ProfileResponse;
  hasPhoto?: boolean;
  hasExperience?: boolean;
  hasEducation?: boolean;
  hasUpcomingAvailability?: boolean;
};

export function getParticipationRecommendations(data: RecommendationData): Recommendation[] {
  const recommendations: Recommendation[] = [];
  if (data.hasPhoto === false) recommendations.push({
    id: "photo", icon: Camera, title: "Agrega una foto de perfil",
    description: "Una foto ayuda a generar confianza en tu presentación pública.",
    href: "/profile/personal-info", action: "Editar fotografía",
  });
  if (data.profile && !data.profile.aboutMe?.trim()) recommendations.push({
    id: "description", icon: Text, title: "Completa tu descripción profesional",
    description: "Describe brevemente tu experiencia, enfoque y trayectoria.",
    href: "/profile/presentation", action: "Editar descripción",
  });
  if (data.areas.length === 0) recommendations.push({
    id: "areas", icon: Layers3, title: "Configura tus áreas técnicas",
    description: "Indica los temas técnicos en los que puedes orientar.",
    href: "/mentors/participation/technical-areas", action: "Editar áreas técnicas",
  });
  if (data.hasExperience === false) recommendations.push({
    id: "experience", icon: BriefcaseBusiness, title: "Actualiza tu experiencia laboral",
    description: "Incluye los puestos y empresas de tu trayectoria.",
    href: "/profile/trajectory/experience", action: "Editar experiencia",
  });
  if (data.profile && !data.profile.headline?.trim()) recommendations.push({
    id: "specialty", icon: Star, title: "Añade tu especialidad profesional",
    description: "Escribe un titular que resuma tu campo profesional.",
    href: "/profile/presentation", action: "Editar especialidad",
  });
  if (data.hasEducation === false) recommendations.push({
    id: "education", icon: GraduationCap, title: "Registra tu formación profesional",
    description: "Indica la carrera o especialidad que estudiaste.",
    href: "/profile/trajectory/education", action: "Editar formación",
  });
  if (data.orientations.length === 0) recommendations.push({
    id: "orientations", icon: Compass, title: "Define los tipos de orientación que ofreces",
    description: "Selecciona los temas en los que puedes brindar mentoría.",
    href: "/mentorship/orientation", action: "Editar orientaciones",
  });
  if (data.hasUpcomingAvailability === false) recommendations.push({
    id: "availability", icon: CalendarDays, title: "Configura tu disponibilidad",
    description: "Indica horarios para los próximos siete días.",
    href: "/mentor/availability", action: "Editar disponibilidad",
  });
  return recommendations;
}

export function ParticipationRecommendations({ areas, orientations }: {
  areas: string[];
  orientations: string[];
}) {
  const profile = useQuery({
    queryKey: ["profile", "me"], queryFn: profileService.getProfile,
    refetchOnMount: "always", refetchOnWindowFocus: true, retry: false,
  });
  const photo = useQuery({
    queryKey: ["profile", "photo"], queryFn: profilePhotoService.getPhoto,
    refetchOnMount: "always", refetchOnWindowFocus: true, retry: false,
  });
  const experience = useQuery({
    queryKey: ["work-experience", "experiences"], queryFn: workExperienceService.getWorkExperiences,
    refetchOnMount: "always", refetchOnWindowFocus: true, retry: false,
  });
  const education = useQuery({
    queryKey: ["education", "educations"], queryFn: educationsService.getEducations,
    refetchOnMount: "always", refetchOnWindowFocus: true, retry: false,
  });
  const availability = useQuery({
    queryKey: ["availability", "participation-recommendations"],
    queryFn: () => {
      const from = new Date();
      const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
      return availabilityApi.getAvailabilityBlocks({ from: from.toISOString(), to: to.toISOString() });
    },
    refetchOnMount: "always", refetchOnWindowFocus: true, retry: false,
  });

  const queries = [profile, photo, experience, education, availability];
  const isLoading = queries.some((query) => query.isFetching);
  const hasError = queries.some((query) => query.isError);
  const recommendations = getParticipationRecommendations({
    areas,
    orientations,
    profile: profile.isSuccess ? profile.data : undefined,
    hasPhoto: photo.isSuccess ? Boolean(photo.data) : undefined,
    hasExperience: experience.isSuccess && Array.isArray(experience.data)
      ? experience.data.length > 0 : undefined,
    hasEducation: education.isSuccess && Array.isArray(education.data)
      ? education.data.length > 0 : undefined,
    hasUpcomingAvailability: availability.isSuccess && Array.isArray(availability.data)
      ? availability.data.length > 0 : undefined,
  });

  if (!isLoading && !hasError && recommendations.length === 0) return null;

  return (
    <Card className="gap-0 rounded-lg border border-border bg-surface py-0 shadow-none ring-0">
      <section aria-labelledby="participation-recommendations-title">
        <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Lightbulb aria-hidden="true" className="size-5 text-primary" />
            <CardTitle id="participation-recommendations-title" className="text-lg text-ink">
              Recomendaciones para mejorar tu perfil
            </CardTitle>
            {!isLoading && recommendations.length > 0 && (
              <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-ink">
                {recommendations.length} pendientes
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">
            Completa esta información para enriquecer tu presentación pública como mentor. Estas sugerencias son opcionales.
          </p>
        </CardHeader>
        <CardContent className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
          {isLoading && <p role="status" className="text-sm text-text-secondary">Consultando tu perfil…</p>}
          {!isLoading && hasError && (
            <p role="alert" className="mb-3 text-sm text-text-secondary">
              No se pudo consultar toda tu información. Algunas recomendaciones podrían no aparecer.
            </p>
          )}
          {!isLoading && recommendations.length > 0 && (
            <ul className="space-y-2">
              {recommendations.map(({ id, icon: Icon, title, description, href, action }) => (
                <li key={id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface-soft p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="rounded-md bg-surface p-2 text-primary"><Icon aria-hidden="true" className="size-5" /></span>
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{title}</h3>
                      <p className="text-sm text-text-secondary">{description}</p>
                    </div>
                  </div>
                  <Link href={href} className={cn(buttonVariants({ variant: "outline" }), "h-auto shrink-0 bg-surface text-center whitespace-normal text-ink")}>{action}</Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </section>
    </Card>
  );
}
