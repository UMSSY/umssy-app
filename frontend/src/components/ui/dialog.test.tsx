import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"

describe("Dialog", () => {
  afterEach(() => cleanup())

  it("renders its content when open", async () => {
    render(
      <Dialog open>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Titulo</DialogTitle>
            <DialogDescription>Descripcion</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cerrar</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(await screen.findByText("Titulo")).toBeInTheDocument()
    expect(screen.getByText("Descripcion")).toBeInTheDocument()
    expect(screen.getByText("Cerrar")).toBeInTheDocument()
  })

  it("does not render its content when closed", () => {
    render(
      <Dialog>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogTitle>Titulo</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    expect(screen.queryByText("Titulo")).not.toBeInTheDocument()
  })
})
