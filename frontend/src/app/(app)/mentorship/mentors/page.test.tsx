
import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMentorDirectory } from "@/modules/mentorship/services/mentor-directory.service";
import MentorDirectoryPage from "./page";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  pathname: "/mentorship/mentors",
  search: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: navigationMocks.replace,
    push: navigationMocks.push,
    back: navigationMocks.back,
    refresh: navigationMocks.refresh,
    forward: navigationMocks.forward,
    prefetch: navigationMocks.prefetch,
  }),
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => new URLSearchParams(navigationMocks.search),
}));

vi.mock("@/modules/mentorship/services/mentor-directory.service", () => ({
  getMentorDirectory: vi.fn(),
}));

let queryClient: ReturnType<typeof render>["client"] | undefined;

beforeEach(() => {
  navigationMocks.replace.mockReset();
  navigationMocks.push.mockReset();
  navigationMocks.back.mockReset();
  navigationMocks.refresh.mockReset();
  navigationMocks.forward.mockReset();
  navigationMocks.prefetch.mockReset();
  navigationMocks.pathname = "/mentorship/mentors";
  navigationMocks.search = "";
});

afterEach(() => {
  cleanup();
  queryClient?.clear();
  queryClient = undefined;
  vi.clearAllMocks();
});

describe("MentorDirectoryPage", () => {
  it("renderiza el directorio despues de resolver la consulta", async () => {
    const mentor = {
      id: "0424f370-00f0-43cf-9b8a-997af81840b9",
      fullName: "Ana Rojas",
      headline: "Desarrolladora Backend",
      technicalAreas: ["Backend"],
      photoUrl: null,
      education: null,
      isAvailable: false,
      orientationTypes: [],
    };

    vi.mocked(getMentorDirectory).mockResolvedValue({
      items: [mentor],
      page: 1,
      pageSize: 6,
      totalItems: 1,
      totalPages: 1,
      effectiveSort: "name_asc",
      affinityStatus: "ready",
    });

    queryClient = render(<MentorDirectoryPage />).client;

    expect(
      await screen.findByRole("link", {
        name: `Ver perfil de ${mentor.fullName}`,
      }),
    ).toHaveAttribute(
      "href",
      `/mentors/${mentor.id}?returnTo=%2Fmentorship%2Fmentors`,
    );

    expect(getMentorDirectory).toHaveBeenCalledExactlyOnceWith(
      expect.any(Object),
      expect.any(AbortSignal),
    );

    await waitFor(() => {
      expect(queryClient?.isFetching()).toBe(0);
    });

    expect(
      screen.getByRole("heading", {
        name: "Encuentra un mentor",
      }),
    ).toBeInTheDocument();
  });
});
