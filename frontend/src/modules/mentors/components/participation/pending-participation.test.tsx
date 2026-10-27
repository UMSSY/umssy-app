
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { PendingParticipation } from "./pending-participation";
import * as participationService from "../../services/mentor-participation.service";

vi.mock("@/modules/mentorship/hooks/use-mentorship-catalogs", () => ({
  useMentorshipCatalogs: () => ({
    technicalAreas: [
      { id: "area-backend", name: "Backend" },
      { id: "area-database", name: "Bases de Datos" },
    ],
    orientationTypes: [
      { id: "orientation-technical", name: "Orientación técnica" },
      { id: "orientation-cv", name: "Revisión de CV" },
    ],
    isTechnicalAreasLoading: false,
    isOrientationTypesLoading: false,
  }),
}));

const pendingRequest: participationService.MentorParticipationRequest = {
  id: "request-1",
  userId: "user-1",
  status: "PENDING",
  queuedAt: "2026-10-26T15:00:00.000Z",
  createdAt: "2026-10-26T15:00:00.000Z",
  technicalAreaIds: ["area-backend"],
  orientationTypeIds: ["orientation-technical"],
};

beforeEach(() => {
  vi.spyOn(
    participationService.mentorParticipationService,
    "getHistory",
  ).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Participación pendiente HU7-2", () => {
  it("muestra la solicitud pendiente y sus preferencias", () => {
    renderWithQuery(
      <PendingParticipation request={pendingRequest} />,
    );

    expect(
      screen.getByRole("heading", { name: "Solicitud pendiente" }),
    ).toBeInTheDocument();

    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Orientación técnica")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Modificar solicitud" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Cancelar solicitud" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Ver historial" }),
    ).toBeInTheDocument();
  });

  it("permite abrir el formulario para modificar preferencias", () => {
    renderWithQuery(
      <PendingParticipation request={pendingRequest} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Modificar solicitud" }),
    );

    expect(
      screen.getByRole("dialog", {
        name: "Modificar solicitud pendiente",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("checkbox", { name: "Backend" }),
    ).toBeChecked();

    expect(
      screen.getByRole("checkbox", { name: "Orientación técnica" }),
    ).toBeChecked();
  });

  it("actualiza las preferencias usando el servicio real", async () => {
    const update = vi
      .spyOn(
        participationService.mentorParticipationService,
        "update",
      )
      .mockResolvedValue({
        ...pendingRequest,
        technicalAreaIds: ["area-database"],
      });

    renderWithQuery(
      <PendingParticipation request={pendingRequest} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Modificar solicitud" }),
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Backend" }),
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: "Bases de Datos" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" }),
    );

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        technicalAreaIds: ["area-database"],
        orientationTypeIds: ["orientation-technical"],
      });
    });
  });

  it("abre la confirmación antes de cancelar", () => {
    renderWithQuery(
      <PendingParticipation request={pendingRequest} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar solicitud" }),
    );

    expect(
      screen.getByRole("dialog", {
        name: "¿Cancelar solicitud de cupo?",
      }),
    ).toBeInTheDocument();
  });

  it("cancela la solicitud mediante el servicio", async () => {
    const cancel = vi
      .spyOn(
        participationService.mentorParticipationService,
        "cancel",
      )
      .mockResolvedValue({
        ...pendingRequest,
        status: "CANCELLED",
      });

    renderWithQuery(
      <PendingParticipation request={pendingRequest} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar solicitud" }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirmar cancelación",
      }),
    );

    await waitFor(() => {
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });

  it("consulta el historial de solicitudes", async () => {
    const getHistory = vi
      .spyOn(
        participationService.mentorParticipationService,
        "getHistory",
      )
      .mockResolvedValue([
        {
          ...pendingRequest,
          id: "request-previous",
          status: "CANCELLED",
        },
      ]);

    renderWithQuery(
      <PendingParticipation request={pendingRequest} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Ver historial" }),
    );

    await waitFor(() => {
      expect(getHistory).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("Estado: CANCELLED"),
    ).toBeInTheDocument();
  });
});
