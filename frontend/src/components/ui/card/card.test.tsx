import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./index"

describe("Card components", () => {
  it("renders Card with default size and custom className", () => {
    render(<Card className="custom-class" data-testid="card" />)
    const card = screen.getByTestId("card")
    expect(card).toHaveAttribute("data-slot", "card")
    expect(card).toHaveAttribute("data-size", "default")
    expect(card.className).toContain("custom-class")
  })

  it("renders Card with size sm", () => {
    render(<Card size="sm" data-testid="card-sm" />)
    expect(screen.getByTestId("card-sm")).toHaveAttribute("data-size", "sm")
  })

  it("renders CardHeader", () => {
    render(<CardHeader data-testid="header" />)
    expect(screen.getByTestId("header")).toHaveAttribute("data-slot", "card-header")
  })

  it("renders CardTitle with text", () => {
    render(<CardTitle>Título</CardTitle>)
    expect(screen.getByText("Título")).toHaveAttribute("data-slot", "card-title")
  })

  it("renders CardDescription with text", () => {
    render(<CardDescription>Descripción</CardDescription>)
    expect(screen.getByText("Descripción")).toHaveAttribute("data-slot", "card-description")
  })

  it("renders CardAction", () => {
    render(<CardAction data-testid="action" />)
    expect(screen.getByTestId("action")).toHaveAttribute("data-slot", "card-action")
  })

  it("renders CardContent with text", () => {
    render(<CardContent>Contenido</CardContent>)
    expect(screen.getByText("Contenido")).toHaveAttribute("data-slot", "card-content")
  })

  it("renders CardFooter", () => {
    render(<CardFooter data-testid="footer" />)
    expect(screen.getByTestId("footer")).toHaveAttribute("data-slot", "card-footer")
  })

  it("renders a full composed card", () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Mi título</CardTitle>
          <CardDescription>Mi descripción</CardDescription>
        </CardHeader>
        <CardContent>Cuerpo</CardContent>
        <CardFooter>Pie</CardFooter>
      </Card>
    )
    expect(screen.getByTestId("full-card")).toBeInTheDocument()
    expect(screen.getByText("Mi título")).toBeInTheDocument()
    expect(screen.getByText("Mi descripción")).toBeInTheDocument()
    expect(screen.getByText("Cuerpo")).toBeInTheDocument()
    expect(screen.getByText("Pie")).toBeInTheDocument()
  })
})