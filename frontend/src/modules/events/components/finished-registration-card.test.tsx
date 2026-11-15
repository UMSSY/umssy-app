import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinishedRegistrationCard } from "./finished-registration-card";

const registration = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Taller de historia",
  date: "2026-09-20T00:00:00.000Z",
  startTime: "1970-01-01T09:00:00.000Z",
  endTime: "1970-01-01T12:00:00.000Z",
  location: "Aula 101",
  status: "Confirmada",
};

describe("FinishedRegistrationCard", () => {
  it("shows the finished workshop without pass actions", () => {
    render(<FinishedRegistrationCard registration={registration} />);
    expect(screen.getByText("Finalizado")).toBeInTheDocument();
    expect(screen.getByText("Taller de historia")).toBeInTheDocument();
    expect(screen.getByText(/20 de septiembre de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/09:00 - 12:00/)).toBeInTheDocument();
    expect(screen.getByText("Aula 101")).toBeInTheDocument();
    expect(screen.getByText(registration.id)).toHaveClass("break-all");
    expect(screen.queryByRole("img", { name: /QR/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a fallback when the location is absent", () => {
    render(<FinishedRegistrationCard registration={{ ...registration, location: "" }} />);
    expect(screen.getByText("Ubicación no especificada")).toBeInTheDocument();
  });
});
