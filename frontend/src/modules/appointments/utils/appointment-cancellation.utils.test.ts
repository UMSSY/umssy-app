import { describe, expect, it } from "vitest"
import type { Appointment } from "../types/appointment.types"
import { canRebookAfterCancellation, getCancellationLabel } from "./appointment-cancellation.utils"

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "a1",
    blockId: "b1",
    startAt: "2026-10-13T13:00:00.000Z",
    endAt: "2026-10-13T14:00:00.000Z",
    counterpart: { id: "mentor-1", fullName: "Ana Rojas", role: "mentor" },
    orientationType: null,
    status: "CANCELLED",
    message: null,
    requestedAt: "2026-10-08T22:42:00.000Z",
    document: null,
    cancellation: null,
    ...overrides,
  }
}

describe("getCancellationLabel", () => {
  it("usa el fallback cuando no hay datos de cancelación", () => {
    expect(getCancellationLabel(null)).toBe("Cancelada")
  })

  it("prioriza «Cancelada por ti» cuando el propio usuario canceló", () => {
    expect(
      getCancellationLabel({ cancelledBy: "MENTOR", cancelledByMe: true, reason: null, cancelledAt: null }),
    ).toBe("Cancelada por ti")
  })

  it("muestra «Cancelada por el mentor» cuando canceló el mentor y no es el usuario", () => {
    expect(
      getCancellationLabel({ cancelledBy: "MENTOR", cancelledByMe: false, reason: null, cancelledAt: null }),
    ).toBe("Cancelada por el mentor")
  })

  it("muestra «Cancelada por el titulado» cuando canceló el titulado y no es el usuario", () => {
    expect(
      getCancellationLabel({ cancelledBy: "STUDENT", cancelledByMe: false, reason: null, cancelledAt: null }),
    ).toBe("Cancelada por el titulado")
  })
})

describe("canRebookAfterCancellation", () => {
  it("permite reservar otro horario cuando el mentor canceló y el usuario no fue quien canceló", () => {
    const appointment = makeAppointment({
      cancellation: { cancelledBy: "MENTOR", cancelledByMe: false, reason: null, cancelledAt: null },
    })

    expect(canRebookAfterCancellation(appointment)).toBe(true)
  })

  it("no permite reservar si quien cancela ve su propia cita", () => {
    const appointment = makeAppointment({
      cancellation: { cancelledBy: "MENTOR", cancelledByMe: true, reason: null, cancelledAt: null },
    })

    expect(canRebookAfterCancellation(appointment)).toBe(false)
  })

  it("no permite reservar cuando canceló el titulado", () => {
    const appointment = makeAppointment({
      cancellation: { cancelledBy: "STUDENT", cancelledByMe: false, reason: null, cancelledAt: null },
    })

    expect(canRebookAfterCancellation(appointment)).toBe(false)
  })

  it("no permite reservar en una cita que no está cancelada", () => {
    const appointment = makeAppointment({
      status: "CONFIRMED",
      cancellation: null,
    })

    expect(canRebookAfterCancellation(appointment)).toBe(false)
  })
})
