import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { jobAlertPreferenceService } from "../services/job-alert-preference.service";
import type { JobAlertPreference } from "../types/job-alert-preference.types";
import { JobAlertPreferenceSelector } from "./job-alert-preference-selector";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../services/job-alert-preference.service", () => ({
  jobAlertPreferenceService: { get: vi.fn(), update: vi.fn() },
}));

const mockedService = vi.mocked(jobAlertPreferenceService);

const ALL_OPTION = "Todas las vacantes";
const MATCHING_OPTION = "Solo las que coinciden con mi perfil";
const HIGH_OPTION = "Solo las de alta afinidad";
const SKILLS_NOTICE = "Para activar estas opciones, añade al menos una habilidad a tu perfil.";

const WITH_SKILLS: JobAlertPreference = { mode: "ALL", savedMode: "ALL", canFilterByProfile: true };
const WITHOUT_SKILLS: JobAlertPreference = { mode: "ALL", savedMode: "ALL", canFilterByProfile: false };

describe("HU-15 - JobAlertPreferenceSelector", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedService.get.mockResolvedValue(WITH_SKILLS);
  });

  afterEach(cleanup);

  it("muestra las tres opciones con \"Todas las vacantes\" elegida por defecto (AC-15.4, AC-15.7)", async () => {
    renderWithQuery(<JobAlertPreferenceSelector />);

    expect(await screen.findByRole("radio", { name: ALL_OPTION })).toBeChecked();
    expect(screen.getByRole("radio", { name: MATCHING_OPTION })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: HIGH_OPTION })).not.toBeChecked();
    expect(screen.queryByText(SKILLS_NOTICE)).not.toBeInTheDocument();
  });

  it("muestra la elección guardada", async () => {
    mockedService.get.mockResolvedValue({ mode: "HIGH_AFFINITY", savedMode: "HIGH_AFFINITY", canFilterByProfile: true });

    renderWithQuery(<JobAlertPreferenceSelector />);

    expect(await screen.findByRole("radio", { name: HIGH_OPTION })).toBeChecked();
  });

  it("guarda la opción elegida y avisa que se aplicará a las próximas vacantes (AC-15.4)", async () => {
    mockedService.update.mockResolvedValue({ mode: "MATCHING", savedMode: "MATCHING", canFilterByProfile: true });
    renderWithQuery(<JobAlertPreferenceSelector />);

    fireEvent.click(await screen.findByRole("radio", { name: MATCHING_OPTION }));

    await waitFor(() => expect(mockedService.update).toHaveBeenCalledTimes(1));
    expect(mockedService.update.mock.calls[0][0]).toBe("MATCHING");
    expect(await screen.findByRole("status")).toHaveTextContent("Se aplicará a las próximas vacantes");
    expect(screen.getByRole("radio", { name: MATCHING_OPTION })).toBeChecked();
  });

  it("no vuelve a guardar si se elige la opción que ya está activa", async () => {
    renderWithQuery(<JobAlertPreferenceSelector />);

    fireEvent.click(await screen.findByRole("radio", { name: ALL_OPTION }));

    expect(mockedService.update).not.toHaveBeenCalled();
  });

  it("sin habilidades deshabilita las dos opciones con filtro y muestra el mensaje y el enlace (AC-15.6)", async () => {
    mockedService.get.mockResolvedValue(WITHOUT_SKILLS);

    renderWithQuery(<JobAlertPreferenceSelector />);

    expect(await screen.findByRole("radio", { name: MATCHING_OPTION })).toBeDisabled();
    expect(screen.getByRole("radio", { name: HIGH_OPTION })).toBeDisabled();
    expect(screen.getByRole("radio", { name: ALL_OPTION })).toBeEnabled();
    expect(screen.getByText(SKILLS_NOTICE, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a Habilidades" })).toHaveAttribute("href", "/profile#skills");
  });

  it("sin habilidades no se puede elegir una opción con filtro", async () => {
    mockedService.get.mockResolvedValue(WITHOUT_SKILLS);
    renderWithQuery(<JobAlertPreferenceSelector />);

    fireEvent.click(await screen.findByRole("radio", { name: HIGH_OPTION }));

    expect(mockedService.update).not.toHaveBeenCalled();
  });

  it("si perdió todas sus habilidades muestra \"Todas\" aunque tenga otra elección guardada (AC-15.13)", async () => {
    mockedService.get.mockResolvedValue({ mode: "ALL", savedMode: "HIGH_AFFINITY", canFilterByProfile: false });

    renderWithQuery(<JobAlertPreferenceSelector />);

    expect(await screen.findByRole("radio", { name: ALL_OPTION })).toBeChecked();
    expect(screen.getByRole("radio", { name: MATCHING_OPTION })).toBeDisabled();
    expect(screen.getByRole("radio", { name: HIGH_OPTION })).toBeDisabled();
  });

  it("avisa con un mensaje de error si no se pudo guardar y mantiene la elección anterior", async () => {
    mockedService.update.mockRejectedValue(new Error("Network Error"));
    renderWithQuery(<JobAlertPreferenceSelector />);

    fireEvent.click(await screen.findByRole("radio", { name: MATCHING_OPTION }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("No pudimos guardar tu preferencia. Intenta nuevamente."),
    );
    await waitFor(() => expect(screen.getByRole("radio", { name: ALL_OPTION })).toBeChecked());
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("si no puede cargar la preferencia lo dice y permite reintentar", async () => {
    mockedService.get.mockRejectedValueOnce(new Error("Network Error"));
    renderWithQuery(<JobAlertPreferenceSelector />);

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar tu preferencia de avisos.");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("radio", { name: ALL_OPTION })).toBeChecked();
  });
});
