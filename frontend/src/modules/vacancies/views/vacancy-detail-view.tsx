"use client";

import { useRouter } from "next/navigation";
import type { VacancyDetailViewProps } from "../types/vacancy-detail-view-props.types";
import { VacanciesView } from "./vacancies-view";

export function VacancyDetailView({ id }: VacancyDetailViewProps) {
  const router = useRouter();
  return <VacanciesView initialVacancyId={id} onInitialClose={() => router.replace("/vacancies", { scroll: false })} />;
}
