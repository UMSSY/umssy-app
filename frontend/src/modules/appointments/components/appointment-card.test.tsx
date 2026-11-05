import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Appointment } from "../types/appointment.types";
import { AppointmentCard } from "./appointment-card";

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "appointment-1",
    blockId: "block-1",
    startAt: "2026-10-27T00:00:00.000Z",
    endAt: "2026-10-27T01:00:00.000Z",
    counterpart: { id: "mentor-1", fullName: "Ana Pérez", role: "mentor" },
    orientationType: { id: "topic-1", name: "Desarrollo profesional" },
    status: "CONFIRMED",
    message: "Quiero revisar mi CV",
    requestedAt: "2026-10-20T22:42:00.000Z",
    document: null,
    ...overrides,
  };
}

describe("AppointmentCard", () => {
  afterEach(cleanup);

  it("muestra día, número y mes de Bolivia en el bloque de fecha", () => {
    render(<AppointmentCard appointment={makeAppointment()} />);

    expect(screen.getByText("LUN")).toBeInTheDocument();
    expect(screen.getByText("26")).toBeInTheDocument();
    expect(screen.getByText("oct")).toBeInTheDocument();
    expect(screen.getByText("26").parentElement).toHaveClass("bg-accent");
  });

  it("muestra la otra persona, su rol, el tema y el horario con zona horaria", () => {
    render(<AppointmentCard appointment={makeAppointment()} />);

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(
      screen.getByText("Mentor · Desarrollo profesional"),
    ).toBeInTheDocument();
    expect(screen.getByText("20:00 - 21:00 · Hora de Bolivia (GMT-4)")).toBeInTheDocument();
  });

  it("identifica a la otra persona como titulado cuando la cita es del mentor", () => {
    render(
      <AppointmentCard
        appointment={makeAppointment({
          counterpart: {
            id: "student-1",
            fullName: "Luis Flores",
            role: "student",
          },
        })}
      />,
    );

    expect(
      screen.getByText("Titulado · Desarrollo profesional"),
    ).toBeInTheDocument();
  });

  it("muestra una alternativa cuando la cita no tiene tema", () => {
    render(
      <AppointmentCard
        appointment={makeAppointment({ orientationType: null })}
      />,
    );

    expect(
      screen.getByText("Mentor · Tema no especificado"),
    ).toBeInTheDocument();
  });

  it("pinta el estado confirmado con el color success", () => {
    render(<AppointmentCard appointment={makeAppointment()} />);

    expect(screen.getByText("Confirmada")).toHaveClass("text-success");
  });

  it("no usa el color success en un estado distinto de confirmada", () => {
    render(
      <AppointmentCard
        appointment={makeAppointment({ status: "CANCELLED" })}
      />,
    );

    expect(screen.getByText("Cancelada")).not.toHaveClass("text-success");
  });

  it("notifica la selección al hacer clic en la tarjeta", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const appointment = makeAppointment();

    render(<AppointmentCard appointment={appointment} onSelect={onSelect} />);
    await user.click(screen.getByRole("button"));

    expect(onSelect).toHaveBeenCalledWith(appointment);
  });

  it("notifica la selección con la tecla Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const appointment = makeAppointment();

    render(<AppointmentCard appointment={appointment} onSelect={onSelect} />);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(onSelect).toHaveBeenCalledWith(appointment);
  });

  it("notifica la selección con la barra espaciadora", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const appointment = makeAppointment();

    render(<AppointmentCard appointment={appointment} onSelect={onSelect} />);
    await user.tab();

    await user.keyboard(" ");

    expect(onSelect).toHaveBeenCalledWith(appointment);
  });
});
