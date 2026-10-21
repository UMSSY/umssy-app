"use client";

import { useEffect, useMemo, useState } from "react";
import type { Vacancy } from "../data/vacancies";
import { vacanciesService } from "../services/vacancies.service";

export function useVacancies() {
  const [search, setSearch] = useState("");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVacancies() {
      try {
        setLoading(true);
        setError(null);

        const data = await vacanciesService.getPublished();

        if (!cancelled) {
          setVacancies(data);
        }
      } catch {
        if (!cancelled) {
          setError(
            "No se pudieron cargar las vacantes. Verifica que el backend esté funcionando.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadVacancies();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredVacancies = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    if (!searchTerm) {
      return vacancies;
    }

    return vacancies.filter((vacancy) => {
      const searchableText = [
        vacancy.cargo,
        vacancy.empresa,
        vacancy.descripcion,
        vacancy.ubicacion,
        vacancy.tipoContrato,
        vacancy.jornada,
        ...vacancy.requisitos,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [search, vacancies]);

  return {
    search,
    setSearch,
    filteredVacancies,
    loading,
    error,
  };
}
