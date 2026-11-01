import { cleanup, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { BlockAppointmentDetail } from "./block-appointment-detail"
import type { AvailabilityBlock } from "../types/availability-block.types"
import type { BlockAppointment } from "../types/block-appointment.types"

const block: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2030-05-13T14:00:00Z",
  endAt: "2030-05-13T15:00:00Z",
  state: "confirmed",
  createdAt: "",
  updatedAt: "",
}

const appointment: BlockAppointment = {
  id: "a1",
  counterpart: { id: "s1", fullName: "Luis Flores", role: "student" },
  orientationType: { id: "o1", name: "Orientación profesional" },
}

describe("BlockAppointmentDetail", () => {
  afterEach(() => {
    cleanup()
  })

  it("muestra la cita confirmada con la fecha, el horario, quién reservó y el tema", () => {
    render(<BlockAppointmentDetail block={block} appointment={appointment} />)

    const card = screen.getByLabelText("Cita confirmada")
    expect(within(card).getByText("Cita confirmada")).toBeInTheDocument()
    expect(within(card).getByText("Lunes 13 de mayo de 2030 · 10:00 - 11:00")).toBeInTheDocument()
    expect(within(card).getByText("Reservada por")).toBeInTheDocument()
    expect(within(card).getByText("Luis Flores")).toBeInTheDocument()
    expect(within(card).getByText("Tema")).toBeInTheDocument()
    expect(within(card).getByText("Orientación profesional")).toBeInTheDocument()
  })

  it("avisa cuando la cita no tiene tema registrado", () => {
    render(<BlockAppointmentDetail block={block} appointment={{ ...appointment, orientationType: null }} />)

    expect(screen.getByText("Sin tema registrado")).toBeInTheDocument()
  })
})
