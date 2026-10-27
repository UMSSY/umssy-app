import type { MentorSort } from "../types/mentor-directory.types";

export const MENTOR_DIRECTORY_DEFAULTS = {
  page: 1,
  search: "",
  area: "",
  orientation: "",
  available: false,
  sort: "name_asc",
} as const;

export interface MentorDirectoryNavigationState {
  page: number;
  search: string;
  area: string;
  orientation: string;
  available: boolean;
  sort: MentorSort;
}

const VALID_SORTS: readonly MentorSort[] = [
  "name_asc",
  "name_desc",
  "affinity",
];

export function parseMentorDirectoryState(
  params: URLSearchParams,
): MentorDirectoryNavigationState {
  const rawPage = params.get("page");
  const parsedPage = rawPage !== null && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;

  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const rawSort = params.get("sort");
  const sort = VALID_SORTS.includes(rawSort as MentorSort)
    ? (rawSort as MentorSort)
    : MENTOR_DIRECTORY_DEFAULTS.sort;

  return {
    page,
    search: params.get("search") ?? "",
    area: params.get("area") ?? "",
    orientation: params.get("orientation") ?? "",
    available: params.get("available") === "true",
    sort,
  };
}

export function normalizeMentorDirectoryParams(
  current: URLSearchParams,
  totalPages?: number,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const state = parseMentorDirectoryState(current);
  const page = totalPages === undefined
    ? state.page
    : Math.min(state.page, Math.max(1, totalPages));

  if (current.has("page")) {
    next.set("page", String(page));
  }
  if (current.has("sort")) {
    next.set("sort", state.sort);
  }
  if (current.has("available")) {
    next.set("available", String(state.available));
  }

  return next;
}

export function updateMentorDirectoryParams(
  current: URLSearchParams,
  updates: Partial<MentorDirectoryNavigationState>,
): URLSearchParams {
  const next = new URLSearchParams(current);

  const resetsPage =
    updates.search !== undefined ||
    updates.area !== undefined ||
    updates.orientation !== undefined ||
    updates.available !== undefined ||
    updates.sort !== undefined;

  if (resetsPage) {
    next.set("page", "1");
  } else if (updates.page !== undefined) {
    next.set("page", String(updates.page));
  }

  if (updates.search !== undefined) {
    if (updates.search) {
      next.set("search", updates.search);
    } else {
      next.delete("search");
    }
  }

  if (updates.area !== undefined) {
    if (updates.area) {
      next.set("area", updates.area);
    } else {
      next.delete("area");
    }
  }

  if (updates.orientation !== undefined) {
    if (updates.orientation) {
      next.set("orientation", updates.orientation);
    } else {
      next.delete("orientation");
    }
  }

  if (updates.available !== undefined) {
    if (updates.available === MENTOR_DIRECTORY_DEFAULTS.available) {
      next.delete("available");
    } else {
      next.set("available", "true");
    }
  }

  if (updates.sort !== undefined) {
    if (updates.sort === MENTOR_DIRECTORY_DEFAULTS.sort) {
      next.delete("sort");
    } else {
      next.set("sort", updates.sort);
    }
  }

  return next;
}
