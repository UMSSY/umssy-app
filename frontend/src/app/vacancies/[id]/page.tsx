"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Vacancy } from "@/modules/vacancies/data/vacancies";
import { vacanciesService } from "@/modules/vacancies/services/vacancies.service";

interface VacancyDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function VacancyDetailPage({
  params,
}: VacancyDetailPageProps) {
  const [vacancyId, setVacancyId] = useState<string | null>(null);
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    params.then(({ id }) => {
      if (!cancelled) {
        setVacancyId(id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (vacancyId === null) {
      return;
    }

    let cancelled = false;

    async function loadVacancy() {
      try {
        setLoading(true);
        setError(null);

        const vacancies = await vacanciesService.getPublished();

        const foundVacancy = vacancies.find(
          (item) => String(item.id) === vacancyId,
        );

        if (!cancelled) {
          setVacancy(foundVacancy ?? null);
        }
      } catch {
        if (!cancelled) {
          setError(
            "No se pudo cargar la vacante. Verifica que el backend esté funcionando.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadVacancy();

    return () => {
      cancelled = true;
    };
  }, [vacancyId]);

  return (
    <main className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/vacancies"
          className="mb-6 inline-block text-sm font-medium"
        >
          ← Volver a vacantes
        </Link>

        {loading ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            Cargando detalles de la vacante...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-red-600">{error}</p>
          </div>
        ) : !vacancy ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h1 className="text-2xl font-bold">
              Vacante no encontrada
            </h1>

            <p className="mt-2 text-gray-600">
              La vacante no existe o ya no está publicada.
            </p>
          </div>
        ) : (
          <article className="rounded-lg bg-white p-8 shadow">
            <h1 className="text-3xl font-bold">
              {vacancy.cargo}
            </h1>

            <p className="mt-2 text-lg font-medium">
              {vacancy.empresa}
            </p>

            <div className="mt-6">
              <h2 className="text-xl font-semibold">
                Descripción
              </h2>

              <p className="mt-2 text-gray-600">
                {vacancy.descripcion}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold">Salario</h3>
                <p className="mt-1 text-gray-600">
                  {vacancy.salario}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Ubicación</h3>
                <p className="mt-1 text-gray-600">
                  {vacancy.ubicacion}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Tipo de contrato</h3>
                <p className="mt-1 text-gray-600">
                  {vacancy.tipoContrato}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Jornada</h3>
                <p className="mt-1 text-gray-600">
                  {vacancy.jornada}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-semibold">
                Requisitos
              </h2>

              {vacancy.requisitos.length === 0 ? (
                <p className="mt-2 text-gray-600">
                  No se especificaron requisitos.
                </p>
              ) : (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">
                  {vacancy.requisitos.map((requisito, index) => (
                    <li key={index}>{requisito}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        )}
      </div>
    </main>
  );
}