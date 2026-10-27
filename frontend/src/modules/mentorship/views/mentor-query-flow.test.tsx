
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import * as directoryService from "../services/mentor-directory.service";
import * as profileService from "../services/mentor-profile.service";
import { MENTOR_PROFILE_FIXTURE } from "../testing/mentor-profile.fixture";
import type { DirectoryPage } from "../types/mentor-directory.types";
import { MentorDirectoryView } from "./mentor-directory-view";
import { MentorProfileView } from "./mentor-profile-view";

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

const mentors = [
  {
    id: "0424f370-00f0-43cf-9b8a-997af81840b9",
    fullName: "María Fernanda Rodríguez",
    headline: "Desarrolladora Backend Senior",
    technicalAreas: ["Backend", "APIs"],
    photoUrl: null,
    education: null,
    isAvailable: false,
    orientationTypes: [],
  },
  {
    id: "0fa5e6de-63a4-430e-87fb-22f5eb700ecd",
    fullName: "Carlos Andrés Vargas",
    headline: null,
    technicalAreas: [],
    photoUrl: null,
    education: null,
    isAvailable: false,
    orientationTypes: [],
  },
];

const directoryPage: DirectoryPage = {
  items: mentors,
  page: 1,
  pageSize: 6,
  totalItems: mentors.length,
  totalPages: 1,
  effectiveSort: "name_asc",
};

const emptyDirectoryPage: DirectoryPage = {
  items: [],
  page: 1,
  pageSize: 6,
  totalItems: 0,
  totalPages: 0,
  effectiveSort: "name_asc",
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

describe("Directory and profile query flows", () => {
  it("hides profile links during loading and then shows active mentors", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      directoryPage,
    );

    renderWithQuery(<MentorDirectoryView />);

    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    expect(
      await screen.findAllByRole("link", { name: /Ver perfil de/ }),
    ).toHaveLength(2);

    expect(screen.getByRole("status")).toHaveTextContent(
      "2 mentores encontrados",
    );
  });

  it("shows an informative empty state without fabricated cards", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(
      emptyDirectoryPage,
    );

    renderWithQuery(<MentorDirectoryView />);

    expect(
      await screen.findByText("No hay mentores disponibles por el momento"),
    ).toBeInTheDocument();

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("retries a failed directory query and replaces the error with results", async () => {
    const request = vi
      .spyOn(directoryService, "getMentorDirectory")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(directoryPage);

    renderWithQuery(<MentorDirectoryView />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No pudimos cargar el directorio",
    );

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findAllByRole("link", { name: /Ver perfil de/ }),
    ).toHaveLength(2);

    expect(request).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("retries a failed profile query using the real UUID", async () => {
    const request = vi
      .spyOn(profileService, "getMentorProfile")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(MENTOR_PROFILE_FIXTURE);

    renderWithQuery(
      <MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Cargando perfil");
    await screen.findByRole("alert");

    expect(
      screen.getByRole("link", { name: "Volver al directorio" }),
    ).toHaveAttribute("href", "/mentorship/mentors");

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findByRole("heading", { name: "Ana Rojas" }),
    ).toBeInTheDocument();

    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenLastCalledWith(
      MENTOR_PROFILE_FIXTURE.id,
      expect.any(AbortSignal),
    );
  });

  it("keeps the error actionable without falling back to a fixture", async () => {
    const request = vi
      .spyOn(profileService, "getMentorProfile")
      .mockRejectedValue(new Error("offline"));

    renderWithQuery(
      <MentorProfileView mentorId={MENTOR_PROFILE_FIXTURE.id} />,
    );

    await screen.findByRole("alert");

    expect(screen.queryByText("Ana Rojas")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));

    expect(
      await screen.findByRole("button", { name: "Reintentar" }),
    ).toBeEnabled();

    expect(screen.queryByText("Ana Rojas")).not.toBeInTheDocument();
  });

  it("provides a return link for an invalid or nonexistent mentor", async () => {
    vi.spyOn(profileService, "getMentorProfile").mockResolvedValue(null);

    renderWithQuery(<MentorProfileView mentorId="not-a-valid-mentor-id" />);

    await screen.findByText("Mentor no encontrado");

    expect(
      screen.getByRole("link", { name: "Volver al directorio" }),
    ).toHaveAttribute("href", "/mentorship/mentors");
  });
});
