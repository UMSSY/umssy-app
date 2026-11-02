import { PageHeading } from "@/shared/components/layout";
import { VacancyList } from "../components/vacancy-list";

export function VacancyHistoryView() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading
        title="Historial de vacantes"
        description="Consulta todas las vacantes que has publicado, con su estado actual."
      />
      <VacancyList scope="history" />
    </main>
  );
}