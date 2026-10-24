import { describe, expect, it } from "vitest"
import { buildWeeklyRepeatToast } from "./build-weekly-repeat-toast"

describe("buildWeeklyRepeatToast", () => {
  it("avisa cuántos bloques se crearon sin omisiones", () => {
    expect(buildWeeklyRepeatToast({ created: 3, skipped: [] })).toEqual({
      title: "Se crearon 3 bloques.",
      description: undefined,
    })
  })

  it("usa singular cuando se crea un solo bloque", () => {
    expect(buildWeeklyRepeatToast({ created: 1, skipped: [] })).toEqual({
      title: "Se creó 1 bloque.",
      description: undefined,
    })
  })

  it("lista las fechas omitidas cuando hay alguna", () => {
    expect(buildWeeklyRepeatToast({ created: 2, skipped: ["2024-01-22", "2024-01-29"] })).toEqual({
      title: "Se crearon 2 bloques.",
      description: "Fechas omitidas: 2024-01-22, 2024-01-29",
    })
  })

  it("informa cuando no se creó ningún bloque", () => {
    expect(buildWeeklyRepeatToast({ created: 0, skipped: ["2024-01-22"] })).toEqual({
      title: "No se creó ningún bloque.",
      description: "Fechas omitidas: 2024-01-22",
    })
  })
})
