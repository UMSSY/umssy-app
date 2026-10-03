import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AvailabilityBlockList } from "./availability-block-list"
import type { AvailabilityBlock } from "../types/availability"

const mockBlock: AvailabilityBlock = {
  id: "1",
  mentorId: "m1",
  startAt: "2024-01-15T14:00:00Z",
  endAt: "2024-01-15T15:00:00Z",
  state: "free",
  createdAt: "",
  updatedAt: "",
}

describe("AvailabilityBlockList", () => {
  it("muestra el mensaje vacío cuando no hay bloques", () => {
    render(<AvailabilityBlockList blocks={[]} emptyMessage="Sin bloques" />)

    expect(screen.getByText("Sin bloques")).toBeInTheDocument()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  })

  it("muestra inicio y fin de cada bloque con locale es-BO", () => {
    render(<AvailabilityBlockList blocks={[mockBlock]} emptyMessage="Sin bloques" />)

    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    expect(
      screen.getByText(`Inicio: ${new Date(mockBlock.startAt).toLocaleString("es-BO")}`)
    ).toBeInTheDocument()
    expect(
      screen.getByText(`Fin: ${new Date(mockBlock.endAt).toLocaleString("es-BO")}`)
    ).toBeInTheDocument()
  })
})
