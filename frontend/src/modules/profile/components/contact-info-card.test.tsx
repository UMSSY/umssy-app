import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProfileSummary } from "../types/profile-summary.types";
import { ContactInfoCard } from "./contact-info-card";

const PROFILE: ProfileSummary = {
  fullName: "María Fernanda Condori Humeres de la Torre",
  headline: "Ingeniera de sistemas especializada en desarrollo backend",
  city: "Cochabamba",
  phone: "+591 70012345",
  personalEmail: "maria@example.com",
  aboutMe: "",
};

describe("ContactInfoCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the name, the headline and the contact data", () => {
    render(<ContactInfoCard profile={PROFILE} />);

    expect(screen.getByRole("heading", { level: 2, name: PROFILE.fullName })).toBeInTheDocument();
    expect(screen.getByText(PROFILE.headline)).toBeInTheDocument();
    expect(screen.getByText("Cochabamba")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar datos personales" })).toBeInTheDocument();
  });

  it("gives the name its own row on small screens and keeps it beside the avatar from sm", () => {
    render(<ContactInfoCard profile={PROFILE} />);

    const nameBlock = screen.getByRole("heading", { level: 2 }).parentElement;

    expect(nameBlock).toHaveClass("min-w-0", "flex-1", "max-sm:order-last", "max-sm:basis-full");
    expect(nameBlock?.parentElement).toHaveClass("flex-wrap", "max-sm:justify-between");
  });
});
