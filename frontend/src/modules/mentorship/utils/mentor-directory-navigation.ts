export const MENTOR_DIRECTORY_DEFAULTS = {
  page: 1,
  search: "",
  area: "",
  available: false,
  sort: "name_asc",
} as const;

export type MentorDirectorySort =
  | "name_asc"
  | "name_desc"
  | "affinity";

export interface MentorDirectoryNavigationState {
  page: number;
  search: string;
  area: string;
  available: boolean;
  sort: MentorDirectorySort;
}

const VALID_SORTS: readonly MentorDirectorySort[] = [
  "name_asc",
  "name_desc",
  "affinity",
];

export function parseMentorDirectoryState(
  params: URLSearchParams,
): MentorDirectoryNavigationState {
  const rawPage = params.get("page");
  const parsedPage = rawPage === null ? 1 : Number(rawPage);

  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const rawSort = params.get("sort");
  const sort = VALID_SORTS.includes(rawSort as MentorDirectorySort)
    ? (rawSort as MentorDirectorySort)
    : MENTOR_DIRECTORY_DEFAULTS.sort;

  return {
    page,
    search: params.get("search") ?? "",
    area: params.get("area") ?? "",
    available: params.get("available") === "true",
    sort,
  };
}

export function updateMentorDirectoryParams(
  current: URLSearchParams,
  updates: Partial<MentorDirectoryNavigationState>,
): URLSearchParams {
  const next = new URLSearchParams(current);

  const resetsPage =
    updates.search !== undefined ||
    updates.area !== undefined ||
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

  if (updates.available !== undefined) {
    if (updates.available) {
      next.set("available", "true");
    } else {
      next.delete("available");
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