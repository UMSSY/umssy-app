import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { EventRoomInfoPanel } from "./event-room-info-panel";

const avatarRootContextError = "AvatarRootContext is missing";

describe("EventRoomInfoPanel", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    cleanup();
  });

  const participants = [
    { id: "user-1", fullName: "Maria Fernandez" },
    { id: "user-2", fullName: "Carlos Rojas" },
  ];

  it("muestra el título, el nombre del grupo y la fecha de creación", () => {
    render(
      <EventRoomInfoPanel
        groupName="Taller de React 2026"
        createdAt="2026-11-01T10:00:00Z"
        participants={participants}
        currentUserId="user-1"
      />,
    );

    expect(screen.getByText("Info del grupo")).toBeInTheDocument();
    expect(screen.getByText("Taller de React 2026")).toBeInTheDocument();
    expect(screen.getByText(/Creado el/)).toBeInTheDocument();
  });

  it("muestra el conteo y la lista de participantes", () => {
    render(
      <EventRoomInfoPanel
        groupName="Grupo"
        createdAt="2026-11-01T10:00:00Z"
        participants={participants}
        currentUserId="user-999"
      />,
    );

    expect(screen.getByText("2 participantes")).toBeInTheDocument();
    expect(screen.getByText("Maria Fernandez")).toBeInTheDocument();
    expect(screen.getByText("Carlos Rojas")).toBeInTheDocument();
  });

  it('muestra al usuario actual como "Tú"', () => {
    render(
      <EventRoomInfoPanel
        groupName="Grupo"
        createdAt="2026-11-01T10:00:00Z"
        participants={participants}
        currentUserId="user-1"
      />,
    );

    expect(screen.getByText("Tú")).toBeInTheDocument();
  });

  it("renderiza con 1 participante sin error de AvatarRootContext", () => {
    const unParticipante = [{ id: "user-9", fullName: "Ana Torres" }];

    render(
      <EventRoomInfoPanel
        groupName="Grupo"
        createdAt="2026-11-01T10:00:00Z"
        participants={unParticipante}
        currentUserId="user-1"
      />,
    );

    expect(screen.getByText("1 participante")).toBeInTheDocument();
    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(avatarRootContextError),
    );
  });

  it("no lanza error de AvatarRootContext al renderizar con varios participantes", () => {
    render(
      <EventRoomInfoPanel
        groupName="Grupo"
        createdAt="2026-11-01T10:00:00Z"
        participants={participants}
        currentUserId="user-1"
      />,
    );

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(avatarRootContextError),
    );
  });

  it("usa el azul de acento solo en el icono del grupo", () => {
    const { container } = render(
      <EventRoomInfoPanel
        groupName="Grupo"
        createdAt="2026-11-01T10:00:00Z"
        participants={participants}
        currentUserId="user-1"
      />,
    );

    expect(container.querySelector("svg")?.parentElement).toHaveClass(
      "bg-accent",
      "text-accent-foreground",
    );

    container.querySelectorAll('[data-slot="avatar"]').forEach((avatar) => {
      expect(avatar).not.toHaveClass("bg-accent");
    });
  });
});
