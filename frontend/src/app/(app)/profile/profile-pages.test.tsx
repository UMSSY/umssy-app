import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import ProfilePage from "./page";
import SettingsPage from "./settings/page";
import DocumentsPage from "./documents/page";
import PersonalInfoPage from "./personal-info/page";
import PresentationPage from "./presentation/page";
import EducationPage from "./trajectory/education/page";
import ExperiencePage from "./trajectory/experience/page";
import SkillsPage from "./trajectory/skills/page";
import CertificationsPage from "./trajectory/certifications/page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/modules/profile", () => ({ ProfileOverviewView: () => <p>profile-overview-view</p>, ProfileSettingsView: () => <p>profile-settings-view</p> }));
vi.mock("@/modules/documents", () => ({ DocumentsCvView: () => <p>documents-cv-view</p> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Profile routes", () => {
  it.each([[ProfilePage, "profile-overview-view"], [SettingsPage, "profile-settings-view"], [DocumentsPage, "documents-cv-view"]] as const)("renders the canonical view", (Page, label) => {
    render(<Page />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
  it.each([
    [PersonalInfoPage, "/profile/settings#personal-info"],
    [PresentationPage, "/profile/settings#presentation"],
    [EducationPage, "/profile#education"],
    [ExperiencePage, "/profile#experience"],
    [SkillsPage, "/profile#skills"],
    [CertificationsPage, "/profile#certifications"],
  ] as const)("preserves old URLs by redirecting to their section", (Page, href) => {
    Page();
    expect(redirect).toHaveBeenCalledExactlyOnceWith(href);
  });
});
