import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DocumentsPage from "./documents/page";
import ProfilePage from "./page";
import PersonalInfoPage from "./personal-info/page";
import PresentationPage from "./presentation/page";
import EducationPage from "./trajectory/education/page";

vi.mock("@/modules/profile", () => ({
  DocumentsCvView: () => <p>documents-cv-view</p>,
  PersonalInfoView: () => <p>personal-info-view</p>,
  PresentationView: () => <p>presentation-view</p>,
  EducationView: () => <p>education-view</p>,
  ProfileOverviewView: () => <p>profile-overview-view</p>,
}));

describe("profile pages", () => {
  afterEach(() => {
    cleanup();
  });

  it("mounts the profile overview view", () => {
    render(<ProfilePage />);

    expect(screen.getByText("profile-overview-view")).toBeInTheDocument();
  });

  it("mounts the personal information view", () => {
    render(<PersonalInfoPage />);

    expect(screen.getByText("personal-info-view")).toBeInTheDocument();
  });

  it("mounts the presentation view", () => {
    render(<PresentationPage />);

    expect(screen.getByText("presentation-view")).toBeInTheDocument();
  });

  it("mounts the education view", () => {
    render(<EducationPage />);

    expect(screen.getByText("education-view")).toBeInTheDocument();
  });

  it("mounts the documents cv view", () => {
    render(<DocumentsPage />);

    expect(screen.getByText("documents-cv-view")).toBeInTheDocument();
  });
});
