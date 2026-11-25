import { afterEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import PersonalInfoPage from "./personal-info/page";
import PresentationPage from "./presentation/page";
import EducationPage from "./trajectory/education/page";
import ExperiencePage from "./trajectory/experience/page";
import SkillsPage from "./trajectory/skills/page";
import CertificationsPage from "./trajectory/certifications/page";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
afterEach(() => vi.clearAllMocks());

describe("Profile routes", () => {
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
