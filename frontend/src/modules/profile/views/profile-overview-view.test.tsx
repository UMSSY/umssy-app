import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProfileSummary } from "../types/profile-summary.types";
import { ProfileOverviewView } from "./profile-overview-view";

const COMPLETE_PROFILE: ProfileSummary = {
  fullName: "Valeria Quispe",
  headline: "Desarrolladora web junior",
  city: "Cochabamba",
  phone: "+591 70000000",
  personalEmail: "valeria@correo.com",
  aboutMe: "Systems engineering graduate from UMSS.",
  interestedOpportunities: "Remote frontend roles.",
};

describe("ProfileOverviewView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the profile page without an active tab", () => {
    render(<ProfileOverviewView />);

    expect(screen.getByRole("heading", { level: 1, name: "Mi perfil" })).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: /Datos personales|Presentación|Trayectoria/ })) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("invites the user to complete an empty profile", () => {
    render(<ProfileOverviewView />);

    expect(screen.getByRole("status")).toHaveTextContent("Completa tu perfil");
    expect(screen.getByRole("link", { name: "Completar perfil" })).toHaveAttribute(
      "href",
      "/profile/personal-info",
    );
    expect(screen.getByText("Tu nombre")).toBeInTheDocument();
    expect(screen.getByText("Foto")).toBeInTheDocument();
    expect(screen.getByText("Aún no agregaste un titular profesional")).toBeInTheDocument();
    expect(screen.getAllByText("Sin registrar")).toHaveLength(3);
    expect(screen.getByText("Cuenta quién eres y en qué te especializas.")).toBeInTheDocument();
    expect(screen.getByText("Indica qué oportunidades laborales te interesan.")).toBeInTheDocument();
  });

  it("shows the registered data of a complete profile", () => {
    render(<ProfileOverviewView profile={COMPLETE_PROFILE} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Valeria Quispe")).toBeInTheDocument();
    expect(screen.getByText("VQ")).toBeInTheDocument();
    expect(screen.getByText("Desarrolladora web junior")).toBeInTheDocument();
    expect(screen.getByText("Cochabamba")).toBeInTheDocument();
    expect(screen.getByText("+591 70000000")).toBeInTheDocument();
    expect(screen.getByText("valeria@correo.com")).toBeInTheDocument();
    expect(screen.getByText("Systems engineering graduate from UMSS.")).toBeInTheDocument();
    expect(screen.getByText("Remote frontend roles.")).toBeInTheDocument();
  });

  it("links each section to its edit page", () => {
    render(<ProfileOverviewView profile={COMPLETE_PROFILE} />);

    expect(screen.getByRole("link", { name: "Editar datos personales" })).toHaveAttribute(
      "href",
      "/profile/personal-info",
    );
    expect(screen.getByRole("link", { name: "Editar presentación profesional" })).toHaveAttribute(
      "href",
      "/profile/presentation",
    );
  });
});
