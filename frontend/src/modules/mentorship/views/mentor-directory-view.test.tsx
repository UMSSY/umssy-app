import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { profileService } from "@/modules/profile/services/profile.service";
import { saveAccessToken, clearAccessToken } from "@/shared/services/storage/access-token-storage";
import * as directoryService from "../services/mentor-directory.service";
import type { MentorDirectoryItem } from "../types/mentor-directory.types";
import { MentorDirectoryView } from "./mentor-directory-view";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  clearAccessToken();
});

const ownId = "0424f370-00f0-43cf-9b8a-997af81840b9";
const otherId = "0fa5e6de-63a4-430e-87fb-22f5eb700ecd";
const mentors: MentorDirectoryItem[] = [
  {
    id: ownId,
    fullName: "María Fernanda Rodríguez",
    headline: "Desarrolladora Backend Senior",
    technicalAreas: ["Backend"],
    photoUrl: null,
    education: null,
    isAvailable: true,
    orientationTypes: ["Orientación técnica"],
  },
  {
    id: otherId,
    fullName: "Carlos Vargas",
    headline: null,
    technicalAreas: [],
    photoUrl: null,
    education: null,
    isAvailable: false,
    orientationTypes: [],
  },
];

describe("MentorDirectoryView", () => {
  it("renderiza el encabezado del directorio", () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue([]);
    render(<MentorDirectoryView />);

    expect(
      screen.getByRole("heading", {
        name: "Encuentra un mentor",
      }),
    ).toBeDefined();
  });

  it("renderiza enlaces hacia los perfiles de los mentores", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue([
      {
        id: "0424f370-00f0-43cf-9b8a-997af81840b9",
        fullName: "María Fernanda Rodríguez",
        headline: "Desarrolladora Backend Senior",
        technicalAreas: ["Backend"],
        photoUrl: null,
        education: null,
        isAvailable: false,
        orientationTypes: [],
      },
    ]);
    render(<MentorDirectoryView />);

    expect(
      (await screen.findAllByRole("link", {
        name: /Ver perfil de/i,
      })).length,
    ).toBeGreaterThan(0);
  });

  it("distingue la tarjeta propia por UUID sin repetir la consulta de identidad", async () => {
    saveAccessToken("test-token");
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(mentors);
    const getProfile = vi.spyOn(profileService, "getProfile").mockResolvedValue({
      id: ownId,
      firstName: "María",
      lastName: "Rodríguez",
      institutionalEmail: "maria@example.test",
      personalEmail: null,
      phone: null,
      city: null,
      headline: null,
      aboutMe: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    render(<MentorDirectoryView />);

    const ownLink = await screen.findByRole("link", { name: "Ver mi perfil de María Fernanda Rodríguez" });
    const otherLink = screen.getByRole("link", { name: "Ver perfil de Carlos Vargas" });
    expect(ownLink).toHaveTextContent("Ver mi perfil");
    expect(ownLink).toHaveAttribute("href", `/mentors/${ownId}`);
    expect(otherLink).toHaveTextContent("Ver perfil");
    expect(otherLink).toHaveAttribute("href", `/mentors/${otherId}`);
    expect(screen.getByText("Disponible para mentoría")).toBeInTheDocument();
    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(screen.getByText("Orientación técnica")).toBeInTheDocument();
    expect(getProfile).toHaveBeenCalledTimes(1);
  });

  it("conserva el directorio público sin sesión", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(mentors);
    const getProfile = vi.spyOn(profileService, "getProfile");

    render(<MentorDirectoryView />);

    expect(await screen.findAllByRole("link", { name: /Ver perfil de/ })).toHaveLength(2);
    expect(screen.queryByText("Ver mi perfil")).not.toBeInTheDocument();
    expect(getProfile).not.toHaveBeenCalled();
  });
  it("combines accent-insensitive search, area and availability filters and can reset them", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(mentors);
    render(<MentorDirectoryView />);
    await screen.findByRole("link", { name: /Ver perfil de María/ });
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar mentor" }), { target: { value: "maria" } });
    expect(screen.queryByRole("link", { name: /Ver perfil de Carlos/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Área" }), { target: { value: "Backend" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Con disponibilidad" }));
    expect(screen.getByRole("link", { name: /Ver perfil de María/ })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar mentor" }), { target: { value: "noexiste" } });
    expect(screen.getByText("No hay mentores con estos filtros")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Limpiar filtros" })[0]);
    expect(screen.getByRole("link", { name: /Ver perfil de Carlos/ })).toBeInTheDocument();
  });
  it("inicia en A–Z, permite Z–A y regresa al orden general", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(mentors);
    render(<MentorDirectoryView />);
    await screen.findByRole("link", { name: /Ver perfil de Carlos/ });

    const selector = screen.getByRole("combobox", { name: "Ordenar mentores" });
    const names = () => within(screen.getByRole("region", { name: "Listado de mentores" }))
      .getAllByRole("heading").map((heading) => heading.textContent);
    expect(selector).toHaveValue("name_asc");
    expect(within(selector).getAllByRole("option").map((option) => option.getAttribute("value")))
      .toEqual(["name_asc", "name_desc", "affinity"]);
    expect(screen.getByRole("heading", { name: "Sugerencias" })).toBeVisible();
    expect(names()).toEqual(["Carlos Vargas", "María Fernanda Rodríguez"]);

    fireEvent.change(selector, { target: { value: "name_desc" } });
    expect(selector).toHaveValue("name_desc");
    expect(names()).toEqual(["María Fernanda Rodríguez", "Carlos Vargas"]);

    fireEvent.change(selector, { target: { value: "affinity" } });
    expect(selector).toHaveValue("affinity");
    expect(selector.parentElement).toHaveClass("ring-accent");
    expect(screen.getByRole("heading", { name: "Preferencias" })).toBeVisible();
    expect(screen.getByRole("note")).toHaveTextContent("todavía no está disponible");
    expect(names()).toEqual(["Carlos Vargas", "María Fernanda Rodríguez"]);
    expect(screen.queryByText(/intereses? en común/)).not.toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "name_asc" } });
    expect(selector).toHaveValue("name_asc");
    expect(selector.parentElement).not.toHaveClass("ring-accent");
    expect(screen.getByRole("heading", { name: "Sugerencias" })).toBeVisible();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("conserva búsqueda, área y disponibilidad al cambiar de orden", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(mentors);
    render(<MentorDirectoryView />);
    await screen.findByRole("link", { name: /Ver perfil de Carlos/ });
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar mentor" }), { target: { value: "maria" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Área" }), { target: { value: "Backend" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Con disponibilidad" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar mentores" }), { target: { value: "affinity" } });
    expect(screen.getByRole("searchbox", { name: "Buscar mentor" })).toHaveValue("maria");
    expect(screen.getByRole("combobox", { name: "Área" })).toHaveValue("Backend");
    expect(screen.getByRole("checkbox", { name: "Con disponibilidad" })).toBeChecked();
    expect(screen.getByRole("link", { name: /Ver perfil de María/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Ver perfil de Carlos/ })).not.toBeInTheDocument();
  });

  it.each([
    ["no_skills", "Agrega habilidades profesionales"],
    ["unmapped_skills", "aún no tienen correspondencia"],
    ["ready", "El orden por afinidad no se aplicó. Se muestran los mentores por nombre."],
  ] as const)("mantiene el directorio en A–Z con estado %s", async (affinityStatus, message) => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(mentors);
    render(<MentorDirectoryView directoryState={{ effectiveSort: "name_asc", affinityStatus }} />);
    await screen.findByRole("link", { name: /Ver perfil de Carlos/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar mentores" }), { target: { value: "affinity" } });
    expect(screen.getByRole("note")).toHaveTextContent(message);
    expect(screen.getByRole("note")).not.toHaveTextContent(/no hay coincidencias/i);
    expect(within(screen.getByRole("region", { name: "Listado de mentores" }))
      .getAllByRole("heading").map((heading) => heading.textContent))
      .toEqual(["Carlos Vargas", "María Fernanda Rodríguez"]);
    expect(screen.getAllByRole("link", { name: /Ver perfil de/ })).toHaveLength(2);
    expect(screen.queryByText("0 intereses en común")).not.toBeInTheDocument();
  });

  it("presenta el orden y los contadores entregados cuando la afinidad está lista", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue([
      { ...mentors[0], sharedInterestsCount: 2 },
      { ...mentors[1], sharedInterestsCount: 0 },
    ]);
    render(<MentorDirectoryView directoryState={{ effectiveSort: "affinity", affinityStatus: "ready" }} />);
    await screen.findByRole("link", { name: /Ver perfil de Carlos/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar mentores" }), { target: { value: "affinity" } });
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Listado de mentores" }))
      .getAllByRole("heading").map((heading) => heading.textContent))
      .toEqual(["María Fernanda Rodríguez", "Carlos Vargas"]);
    expect(screen.getByText("2 intereses en común")).toBeVisible();
    expect(screen.getByText("0 intereses en común")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Ver perfil de/ })).toHaveLength(2);

    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar mentores" }), { target: { value: "name_asc" } });
    expect(screen.queryByText("2 intereses en común")).not.toBeInTheDocument();
    expect(screen.queryByText("0 intereses en común")).not.toBeInTheDocument();
  });

  it("no inventa contadores ausentes aunque el orden efectivo sea afinidad", async () => {
    vi.spyOn(directoryService, "getMentorDirectory").mockResolvedValue(mentors);
    render(<MentorDirectoryView directoryState={{ effectiveSort: "affinity", affinityStatus: "ready" }} />);
    await screen.findByRole("link", { name: /Ver perfil de Carlos/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar mentores" }), { target: { value: "affinity" } });
    expect(screen.queryByText(/intereses? en común/)).not.toBeInTheDocument();
  });
});
