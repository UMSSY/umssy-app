
"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { PageHeading } from "@/shared/components/layout";
import { MentorDirectoryGrid } from "../components/mentor/mentor-directory-grid";
import { MentorSearchBar } from "../components/mentor/mentor-search-bar";
import { MentorFiltersBar } from "../components/mentor/mentor-filters-bar";
import { MentorFiltersSummary } from "../components/mentor/mentor-filters-summary";
import { MentorDirectoryPagination } from "../components/mentor/mentor-directory-pagination";
import { MentorQueryFeedback } from "../components/mentor/mentor-query-feedback";
import { MentorQuerySkeleton } from "../components/mentor/mentor-query-skeleton";
import { useCurrentUserId } from "../hooks/use-current-user-id";
import { useMentorDirectory } from "../hooks/use-mentor-directory";
import { useMentorshipCatalogs } from "../hooks/use-mentorship-catalogs";
import type {
  DirectoryPage,
  MentorSort,
} from "../types/mentor-directory.types";
import {
  normalizeMentorDirectoryParams,
  parseMentorDirectoryState,
  updateMentorDirectoryParams,
} from "../utils/mentor-directory-navigation";

type MentorDirectoryViewProps = {
  directoryState?: Pick<
    DirectoryPage,
    "effectiveSort" | "affinityStatus"
  > &
    Partial<Pick<DirectoryPage, "totalPages">>;
};

export function MentorDirectoryView({
  directoryState,
}: MentorDirectoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const {
    page,
    search,
    area,
    orientation,
    available: isAvailableOnly,
    sort: sortBy,
  } = parseMentorDirectoryState(new URLSearchParams(queryString));

  const { currentUserId } = useCurrentUserId();

  const { technicalAreas, orientationTypes } = useMentorshipCatalogs();

  const {
    data: directory,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useMentorDirectory({
    page,
    search,
    area,
    orientation,
    available: isAvailableOnly,
    sort: sortBy,
  });

  const mentors = useMemo(
    () => directory?.items ?? [],
    [directory?.items],
  );

  const totalItems = directory?.totalItems ?? 0;
  const totalPages =
    directory?.totalPages ?? directoryState?.totalPages ?? 0;

  const effectiveSort: MentorSort =
    sortBy !== "affinity"
      ? sortBy
      : directory?.effectiveSort ??
        directoryState?.effectiveSort ??
        "name_asc";

  const affinityStatus =
    directory?.affinityStatus ?? directoryState?.affinityStatus;
  const hasFilters = Boolean(search.trim() || area || orientation || isAvailableOnly);

  useEffect(() => {
    if (!directory && directoryState?.totalPages === undefined) {
      return;
    }

    const normalized = normalizeMentorDirectoryParams(
      new URLSearchParams(queryString),
      totalPages,
    ).toString();

    if (normalized !== queryString) {
      router.replace(
        normalized ? `${pathname}?${normalized}` : pathname,
        { scroll: false },
      );
    }
  }, [
    directory,
    directoryState?.totalPages,
    pathname,
    queryString,
    router,
    totalPages,
  ]);

  const affinityMessage =
    sortBy !== "affinity" || effectiveSort === "affinity"
      ? null
      : affinityStatus === "no_skills"
        ? "Agrega habilidades profesionales a tu perfil para encontrar mentores con mayor afinidad. Se muestran los mentores por nombre."
        : affinityStatus === "unmapped_skills"
          ? "Tus habilidades profesionales aún no tienen correspondencia con las áreas técnicas. Se muestran los mentores por nombre."
          : affinityStatus === "ready"
            ? "El orden por afinidad no se aplicó. Se muestran los mentores por nombre."
            : "La afinidad todavía no está disponible. Se muestran los mentores por nombre.";

  const navigateWithUpdates = useCallback(
    (updates: {
      search?: string;
      area?: string;
      orientation?: string;
      available?: boolean;
      sort?: MentorSort;
      page?: number;
    }) => {
      const next = updateMentorDirectoryParams(
        new URLSearchParams(queryString),
        updates,
      );

      const query = next.toString();

      router.replace(
        query ? `${pathname}?${query}` : pathname,
        { scroll: false },
      );
    },
    [pathname, queryString, router],
  );

  function handleClearFilters() {
    navigateWithUpdates({
      search: "",
      area: "",
      orientation: "",
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
          <MentorSearchBar
            key={search}
            value={search}
            onSearchChange={(nextSearch) =>
              navigateWithUpdates({
                search: nextSearch,
              })
            }
          />

          <MentorFiltersBar
            area={area}
            orientation={orientation}
            technicalAreas={technicalAreas.map((item) => item.name)}
            orientationTypes={orientationTypes.map((item) => item.name)}
            onAreaChange={(value) =>
              navigateWithUpdates({ area: value })
            }
            onOrientationChange={(value) =>
              navigateWithUpdates({ orientation: value })
            }
          />

          <Label className="flex items-center gap-2">
            <Checkbox
              checked={isAvailableOnly}
              onCheckedChange={(checked) =>
                navigateWithUpdates({
                  available: checked === true,
                })
              }
            />
            Solo disponibles
          </Label>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mentor-sort">Ordenar por</Label>

            <NativeSelect
              id="mentor-sort"
              aria-label="Ordenar mentores"
              className={
                sortBy === "affinity"
                  ? "rounded-lg ring-2 ring-accent"
                  : undefined
              }
              value={sortBy}
              onChange={(event) =>
                navigateWithUpdates({
                  sort: event.target.value as MentorSort,
                })
              }
            >
              <NativeSelectOption value="name_asc">
                Nombre (A–Z)
              </NativeSelectOption>

              <NativeSelectOption value="name_desc">
                Nombre (Z–A)
              </NativeSelectOption>

              <NativeSelectOption value="affinity">
                Mayor afinidad
              </NativeSelectOption>
            </NativeSelect>
          </div>

          <Button
            variant="ghost"
            onClick={handleClearFilters}
          >
            Limpiar
          </Button>
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
            title={
              totalItems > 0
                ? "No hay mentores en esta página"
                : hasFilters
                  ? "No hay mentores que coincidan con tu búsqueda"
                  : "No hay mentores disponibles por el momento"
            }
            description={totalItems > 0 ? "Ajustando la paginación del directorio." : hasFilters ? "Prueba con otros filtros o limpia la búsqueda." : "Vuelve a consultar más adelante."}
            onClearFilters={hasFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <h2 className="text-xl font-semibold text-ink">
              {sortBy === "affinity" ? "Preferencias" : "Sugerencias"}
            </h2>

            {affinityMessage ? (
              <p
                role="note"
                className="rounded-lg border border-border bg-surface p-4 text-sm text-text-secondary"
              >
                {affinityMessage}
              </p>
            ) : null}

            <MentorFiltersSummary
              search={search}
              area={area}
              orientation={orientation}
              available={isAvailableOnly}
              totalItems={totalItems}
            />

            <MentorDirectoryGrid
              mentors={mentors}
              currentUserId={currentUserId}
              returnTo={returnTo}
              showAffinityBadge={effectiveSort === "affinity"}
              selectedArea={area}
            />

            <MentorDirectoryPagination
              page={directory?.page ?? page}
              pageSize={directory?.pageSize ?? 6}
              totalItems={directory?.totalItems ?? 0}
              totalPages={directory?.totalPages ?? 0}
              onPageChange={(nextPage) => {
                if (!isFetching) {
                  navigateWithUpdates({ page: nextPage });
                }
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
