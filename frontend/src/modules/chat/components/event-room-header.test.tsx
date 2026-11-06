import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventRoomHeader } from "./event-room-header";

describe("EventRoomHeader", () => {
  it("muestra el nombre del grupo en negrita y el conteo de participantes", () => {
    render(
      <EventRoomHeader groupName="Taller de React 2026" participantCount={5} />,
    );

    expect(screen.getByText("Taller de React 2026")).toBeInTheDocument();
    expect(screen.getByText("5 participantes")).toBeInTheDocument();
  });

  it('usa "1 participante" cuando hay un solo participante', () => {
    render(
      <EventRoomHeader groupName="Taller de React 2026" participantCount={1} />,
    );

    expect(screen.getByText("1 participante")).toBeInTheDocument();
  });

  it("renderiza el icono Users en el círculo", () => {
    render(<EventRoomHeader groupName="Grupo" participantCount={2} />);

    expect(document.querySelector("svg")).not.toBeNull();
  });

  it("usa el azul de acento en el círculo del icono", () => {
    const { container } = render(
      <EventRoomHeader groupName="Grupo" participantCount={2} />,
    );

    expect(container.querySelector('svg')?.parentElement).toHaveClass(
  'bg-accent',
  'text-accent-foreground',
);
  });
});
