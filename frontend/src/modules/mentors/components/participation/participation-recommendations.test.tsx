import { cleanup, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { availabilityApi } from "@/modules/availability";
import { educationsService } from "@/modules/education";
import { profilePhotoService, profileService, type ProfileResponse } from "@/modules/profile";
import { workExperienceService } from "@/modules/work-experience";
import { ParticipationOverview } from "./participation-overview";

const profile: ProfileResponse = {
  id: "mentor-1", firstName: "Ana", lastName: "Pérez",
  institutionalEmail: "ana@umss.edu", personalEmail: null,
  phone: null, city: null, headline: null, aboutMe: null,
  updatedAt: "2026-11-01T00:00:00.000Z",
};

function renderOverview(isActive = true, areas: string[] = [], orientations: string[] = []) {
  return renderWithQuery(<ParticipationOverview
    isActive={isActive} areas={areas} orientations={orientations} onAction={vi.fn()}
  />);
}

describe("recomendaciones de participación HU-MEN-13", () => {
  beforeEach(() => {
    vi.spyOn(profileService, "getProfile").mockResolvedValue(profile);
    vi.spyOn(profilePhotoService, "getPhoto").mockResolvedValue(null);
    vi.spyOn(workExperienceService, "getWorkExperiences").mockResolvedValue([]);
    vi.spyOn(educationsService, "getEducations").mockResolvedValue([]);
    vi.spyOn(availabilityApi, "getAvailabilityBlocks").mockResolvedValue([]);
  });

  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("muestra ocho sugerencias opcionales con enlaces de edición reales", async () => {
    renderOverview();
    const section = await screen.findByRole("region", { name: "Recomendaciones para mejorar tu perfil" });
    await waitFor(() => expect(within(section).getAllByRole("listitem")).toHaveLength(8));
    expect(within(section).getByText("8 pendientes")).toBeInTheDocument();
    expect(within(section).getByText(/sugerencias son opcionales/)).toBeInTheDocument();
    const links = within(section).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Editar fotografía", "/profile/personal-info"],
      ["Editar descripción", "/profile/presentation"],
      ["Editar áreas técnicas", "/mentors/participation/technical-areas"],
      ["Editar experiencia", "/profile/trajectory/experience"],
      ["Editar especialidad", "/profile/presentation"],
      ["Editar formación", "/profile/trajectory/education"],
      ["Editar orientaciones", "/mentorship/orientation"],
      ["Editar disponibilidad", "/mentor/availability"],
    ]);
  });

  it("oculta solo los apartados completados", async () => {
    vi.mocked(profileService.getProfile).mockResolvedValue({ ...profile, aboutMe: "Mentora en desarrollo" });
    vi.mocked(profilePhotoService.getPhoto).mockResolvedValue(new Blob(["foto"]));
    renderOverview(true, ["Backend"], []);
    const section = await screen.findByRole("region", { name: "Recomendaciones para mejorar tu perfil" });
    await waitFor(() => expect(within(section).getAllByRole("listitem")).toHaveLength(5));
    expect(within(section).queryByText("Agrega una foto de perfil")).not.toBeInTheDocument();
    expect(within(section).queryByText("Configura tus áreas técnicas")).not.toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
  });

  it("no presenta recomendaciones cuando todo lo evaluado está completo", async () => {
    vi.mocked(profileService.getProfile).mockResolvedValue({ ...profile, aboutMe: "Mentora", headline: "Ingeniera" });
    vi.mocked(profilePhotoService.getPhoto).mockResolvedValue(new Blob(["foto"]));
    vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValue([{}] as Awaited<ReturnType<typeof workExperienceService.getWorkExperiences>>);
    vi.mocked(educationsService.getEducations).mockResolvedValue([{}] as Awaited<ReturnType<typeof educationsService.getEducations>>);
    vi.mocked(availabilityApi.getAvailabilityBlocks).mockResolvedValue([{}] as Awaited<ReturnType<typeof availabilityApi.getAvailabilityBlocks>>);
    renderOverview(true, ["Backend"], ["Empleo"]);
    await waitFor(() => expect(profileService.getProfile).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("region", { name: "Recomendaciones para mejorar tu perfil" })).not.toBeInTheDocument());
  });

  it("no consulta ni muestra recomendaciones sin participación activa", () => {
    renderOverview(false);
    expect(screen.queryByRole("region", { name: "Recomendaciones para mejorar tu perfil" })).not.toBeInTheDocument();
    expect(profileService.getProfile).not.toHaveBeenCalled();
  });

  it("vuelve a consultar al regresar y quita la recomendación completada", async () => {
    const first = renderOverview();
    const section = await screen.findByRole("region", { name: "Recomendaciones para mejorar tu perfil" });
    await within(section).findByText("Completa tu descripción profesional");
    first.unmount();
    vi.mocked(profileService.getProfile).mockResolvedValue({ ...profile, aboutMe: "Mentora en sistemas" });
    renderOverview();
    await waitFor(() => expect(profileService.getProfile).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText("Completa tu descripción profesional")).not.toBeInTheDocument());
  });

  it("no trata un error de carga como un campo incompleto y conserva las otras sugerencias", async () => {
    vi.mocked(profileService.getProfile).mockRejectedValue(new Error("HTTP 500"));
    vi.mocked(availabilityApi.getAvailabilityBlocks).mockRejectedValue(new Error("HTTP 500"));
    renderOverview();
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo consultar toda tu información");
    expect(screen.queryByText("Completa tu descripción profesional")).not.toBeInTheDocument();
    expect(screen.queryByText("Configura tu disponibilidad")).not.toBeInTheDocument();
    expect(screen.getByText("Configura tus áreas técnicas")).toBeInTheDocument();
  });
});
