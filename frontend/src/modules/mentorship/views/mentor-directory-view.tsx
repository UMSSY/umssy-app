"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { normalizeSearch } from "@/shared/utils/get-workspace-tasks";
import { PageHeading } from "@/shared/components/layout";
import { MentorDirectoryGrid } from "../components/mentor/mentor-directory-grid";
import { MentorQueryFeedback } from "../components/mentor/mentor-query-feedback";
import { MentorQuerySkeleton } from "../components/mentor/mentor-query-skeleton";
import { useCurrentUserId } from "../hooks/use-current-user-id";
import { useMentorDirectory } from "../hooks/use-mentor-directory";
import type { DirectoryPage, MentorSort } from "../types/mentor-directory.types";
import {
  normalizeMentorDirectoryParams,
  parseMentorDirectoryState,
  updateMentorDirectoryParams,
} from "../utils/mentor-directory-navigation";

type MentorDirectoryViewProps = {
  directoryState?: Pick<DirectoryPage, "effectiveSort" | "affinityStatus"> &
    Partial<Pick<DirectoryPage, "totalPages">>;
};

export function MentorDirectoryView({ directoryState }: MentorDirectoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const { search, area, available: isAvailableOnly, sort: sortBy } =
    parseMentorDirectoryState(new URLSearchParams(queryString));

  const { currentUserId } = useCurrentUserId();

  const {
    data: mentors = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useMentorDirectory();

  useEffect(() => {
    const normalized = normalizeMentorDirectoryParams(
      new URLSearchParams(queryString),
      directoryState?.totalPages,
    ).toString();
    if (normalized !== queryString) {
      router.replace(normalized ? `${pathname}?${normalized}` : pathname, {
        scroll: false,
      });
    }
  }, [directoryState?.totalPages, pathname, queryString, router]);

  const areas = useMemo(
    () =>
      [...new Set(mentors.flatMap((mentor) => mentor.technicalAreas))].sort(
        (a, b) => a.localeCompare(b, "es"),
      ),
    [mentors],
  );

  const filteredMentors = useMemo(
    () =>
      mentors.filter(
        (mentor) =>
          normalizeSearch(
            [mentor.fullName, mentor.headline, ...mentor.technicalAreas].join(
              " ",
            ),
          ).includes(normalizeSearch(search)) &&
          (!area || mentor.technicalAreas.includes(area)) &&
          (!isAvailableOnly || mentor.isAvailable),
      ),
    [mentors, search, area, isAvailableOnly],
  );

  const effectiveSort = sortBy === "affinity"
    ? directoryState?.effectiveSort === "affinity" && directoryState.affinityStatus === "ready"
      ? "affinity"
      : "name_asc"
    : sortBy;
  const sortedMentors = useMemo(
    () => effectiveSort === "affinity" ? filteredMentors : [...filteredMentors].sort((a, b) => {
      const comparison = a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" });
      return effectiveSort === "name_asc" ? comparison : -comparison;
    }),
    [effectiveSort, filteredMentors],
  );
  const affinityMessage = sortBy !== "affinity" || effectiveSort === "affinity"
    ? null
    : directoryState?.affinityStatus === "no_skills"
      ? "Agrega habilidades profesionales a tu perfil para encontrar mentores con mayor afinidad. Se muestran los mentores por nombre."
      : directoryState?.affinityStatus === "unmapped_skills"
        ? "Tus habilidades profesionales aún no tienen correspondencia con las áreas técnicas. Se muestran los mentores por nombre."
        : directoryState?.affinityStatus === "ready"
          ? "El orden por afinidad no se aplicó. Se muestran los mentores por nombre."
          : "La afinidad todavía no está disponible. Se muestran los mentores por nombre.";

  const navigateWithUpdates = useCallback(
    (updates: {
      search?: string;
      area?: string;
      available?: boolean;
      sort?: MentorSort;
      page?: number;
    }) => {
      const next = updateMentorDirectoryParams(
        new URLSearchParams(queryString),
        updates,
      );

      const query = next.toString();

      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, queryString, router],
  );

  function handleClearFilters() {
    navigateWithUpdates({
      search: "",
      area: "",
      available: false,
    });
  }

  const returnTo = useMemo(
    () => (queryString ? `${pathname}?${queryString}` : pathname),
    [pathname, queryString],
  );

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header>
          <PageHeading
            title="Encuentra un mentor"
            description="Busca por nombre o área de experiencia."
          />
        </header>

        <div
          role="search"
          aria-label="Filtros de mentores"
          className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4"
        >
          <Input
            type="search"
            className="min-w-56 flex-1"
            aria-label="Buscar mentor"
            placeholder="Nombre o especialidad"
            value={search}
            onChange={(event) => navigateWithUpdates({ search: event.target.value })}
          />

          <div className="flex items-center gap-2">
            <Label htmlFor="mentor-area">Área</Label>

            <NativeSelect
              id="mentor-area"
              className="max-w-64"
              value={area}
              onChange={(event) => {
                navigateWithUpdates({ area: event.target.value });
              }}
            >
              <NativeSelectOption value="">
                Todas las áreas
              </NativeSelectOption>

              {areas.map((name) => (
                <NativeSelectOption key={name} value={name}>
                  {name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <Label className="flex items-center gap-2">
            <Checkbox
              checked={isAvailableOnly}
              onCheckedChange={(checked) => {
                navigateWithUpdates({ available: checked === true });
              }}
            />
            Con disponibilidad
          </Label>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mentor-sort">Ordenar por</Label>
            <NativeSelect
              id="mentor-sort"
              aria-label="Ordenar mentores"
              className={sortBy === "affinity" ? "rounded-lg ring-2 ring-accent" : undefined}
              value={sortBy}
              onChange={(event) => navigateWithUpdates({ sort: event.target.value as MentorSort })}
            >
              <NativeSelectOption value="name_asc">Nombre (A–Z)</NativeSelectOption>
              <NativeSelectOption value="name_desc">Nombre (Z–A)</NativeSelectOption>
              <NativeSelectOption value="affinity">Mayor afinidad</NativeSelectOption>
            </NativeSelect>
          </div>

          {search || area || isAvailableOnly ? (
            <Button variant="ghost" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          ) : null}
        </div>

        {isPending || (isError && isFetching) ? (
          <MentorQuerySkeleton />
        ) : isError ? (
          <MentorQueryFeedback
            title="No pudimos cargar el directorio"
            description="Ocurrió un problema al consultar los perfiles. Puedes volver a intentarlo."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : mentors.length === 0 ? (
          <MentorQueryFeedback
            title="No hay mentores activos"
            description="Por el momento no hay mentores activos para mostrar. Vuelve a consultar más adelante."
          />
        ) : (
          <>
            <h2 className="text-xl font-semibold text-ink">
              {sortBy === "affinity" ? "Preferencias" : "Sugerencias"}
            </h2>
            {affinityMessage ? (
              <p role="note" className="rounded-lg border border-border bg-surface p-4 text-sm text-text-secondary">
                {affinityMessage}
              </p>
            ) : null}
            <p role="status" className="text-sm text-text-secondary">
              {filteredMentors.length} mentores encontrados
            </p>

            {filteredMentors.length > 0 ? (
              <MentorDirectoryGrid
                mentors={sortedMentors}
                currentUserId={currentUserId}
                returnTo={returnTo}
                showAffinityBadge={effectiveSort === "affinity"}
                selectedArea={area}
              />
            ) : (
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <h2 className="mb-4 text-lg font-semibold">
                  No hay mentores con estos filtros
                </h2>

                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
