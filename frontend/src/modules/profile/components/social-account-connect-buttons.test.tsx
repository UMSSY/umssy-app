import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PORTFOLIO_ACCOUNT_MESSAGES } from "../constants/portfolio-accounts.constants";
import { portfolioAccountsService } from "../services/portfolio-accounts.service";
import { assignWindowLocation } from "../utils/assign-window-location";
import { SocialAccountConnectButtons } from "./social-account-connect-buttons";
import type { PortfolioAccountStatusResponse } from "../types/portfolio-account-status-response.types";
import type { PortfolioOAuthUrlResponse } from "../types/portfolio-oauth-url-response.types";

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}));

vi.mock("../utils/github-oauth", () => ({ prepareGithubAuthorization: vi.fn().mockResolvedValue({ value: "test-verifier", challenge: "test-challenge" }) }));

vi.mock("../utils/assign-window-location", () => ({
  assignWindowLocation: vi.fn(),
}));

vi.mock("../services/portfolio-accounts.service", () => ({
  portfolioAccountsService: {
    getSocialAccounts: vi.fn(),
    getOAuthAuthorizationUrl: vi.fn(),
    completeOAuthCallback: vi.fn(),
    disconnectSocialAccount: vi.fn(),
  },
}));

describe("SocialAccountConnectButtons", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    vi.mocked(portfolioAccountsService.getSocialAccounts).mockResolvedValue([
      {
        provider: "github",
        connected: false,
        username: null,
        profileUrl: null,
      },
      {
        provider: "gitlab",
        connected: false,
        username: null,
        profileUrl: null,
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders connect buttons for GitHub and GitLab when disconnected (CA-1)", async () => {
    render(<SocialAccountConnectButtons />);

    const group = screen.getByRole("group", { name: "Cuentas de desarrollo" });
    const github = await within(group).findByRole("button", { name: "Conectar con GitHub" });
    const gitlab = within(group).getByRole("button", { name: "Conectar con GitLab" });

    expect(screen.queryByText("Cuentas de desarrollo")).not.toBeInTheDocument();
    expect(github.querySelector("img")).toHaveAttribute("src", "/icons/github.svg");
    expect(gitlab.querySelector("img")).toHaveAttribute("src", "/icons/gitlab.svg");
    expect(github.querySelector("img")).toHaveAttribute("alt", "");
    expect(gitlab.querySelector("img")).toHaveAttribute("alt", "");
  });

  it.each([
    { provider: "github", label: "GitHub", url: "https://github.com/login/oauth/authorize?client_id=github-id&state=github-test-state" },
    { provider: "gitlab", label: "GitLab", url: "https://gitlab.com/oauth/authorize?client_id=gitlab-id" },
  ])("requests the $label authorization URL and redirects on the same tab (CA-2)", async ({ provider, label, url }) => {
    const mockAuthUrl: PortfolioOAuthUrlResponse = {
      url,
    };
    vi.mocked(portfolioAccountsService.getOAuthAuthorizationUrl).mockResolvedValueOnce(mockAuthUrl);

    render(<SocialAccountConnectButtons />);

    const button = await screen.findByRole("button", { name: `Conectar con ${label}` });
    fireEvent.click(button);

    await waitFor(() => {
      expect(portfolioAccountsService.getOAuthAuthorizationUrl).toHaveBeenCalledWith(
        provider,
        provider === "github" ? undefined : provider,
        ...(provider === "github" ? ["test-challenge"] : []),
      );
      expect(assignWindowLocation).toHaveBeenCalledWith(mockAuthUrl.url);
    });
  });

  it("renders connected badge and username link when account is connected (CA-7)", async () => {
    const connectedAccounts: PortfolioAccountStatusResponse[] = [
      {
        provider: "github",
        connected: true,
        username: "valeriaquispe",
        profileUrl: "https://github.com/valeriaquispe",
      },
      {
        provider: "gitlab",
        connected: false,
        username: null,
        profileUrl: null,
      },
    ];
    vi.mocked(portfolioAccountsService.getSocialAccounts).mockResolvedValue(connectedAccounts);

    render(<SocialAccountConnectButtons />);

    expect(await screen.findByText("@valeriaquispe")).toBeInTheDocument();
    expect(screen.getByText("Conectado")).toBeInTheDocument();
    const profileLink = screen.getByRole("link", { name: /@valeriaquispe/i });
    expect(profileLink).toHaveAttribute("href", "https://github.com/valeriaquispe");
    expect(screen.getByRole("button", { name: "Reconectar cuenta de GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conectar con GitLab" })).toBeInTheDocument();
  });

  it("keeps both account links and disconnect actions available when both providers are connected", async () => {
    vi.mocked(portfolioAccountsService.getSocialAccounts).mockResolvedValue([
      { provider: "github", connected: true, username: "github-user", profileUrl: "https://github.com/github-user" },
      { provider: "gitlab", connected: true, username: "gitlab-user", profileUrl: "https://gitlab.com/gitlab-user" },
    ]);

    render(<SocialAccountConnectButtons />);

    expect(await screen.findByRole("link", { name: "@github-user" })).toHaveAttribute("href", "https://github.com/github-user");
    expect(screen.getByRole("link", { name: "@gitlab-user" })).toHaveAttribute("href", "https://gitlab.com/gitlab-user");
    expect(screen.getByRole("button", { name: "Desconectar cuenta de GitHub" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desconectar cuenta de GitLab" })).toBeInTheDocument();
    expect(screen.getAllByText("Conectado")).toHaveLength(2);
  });

  it("handles user cancellation (error=access_denied) with Spanish message without connecting (CA-2, CA-9)", async () => {
    currentSearchParams = new URLSearchParams("provider=github&error=access_denied");

    render(<SocialAccountConnectButtons />);

    expect(
      await screen.findByText(PORTFOLIO_ACCOUNT_MESSAGES.userCancelled),
    ).toBeInTheDocument();
    expect(portfolioAccountsService.completeOAuthCallback).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Conectar con GitHub" }),
    ).toBeInTheDocument();
  });

  it("processes returning oauth code, exchanges code, and shows success message (CA-2, CA-7)", async () => {
    currentSearchParams = new URLSearchParams("github_connection=success");
    render(<SocialAccountConnectButtons />);

    expect(portfolioAccountsService.completeOAuthCallback).not.toHaveBeenCalled();

    expect(
      await screen.findByText("Cuenta de GitHub vinculada exitosamente."),
    ).toBeInTheDocument();
  });

  it("handles 409 conflict error when account is already linked to another user", async () => {
    currentSearchParams = new URLSearchParams("provider=gitlab&code=oauth-conflict-code");
    const conflictError = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          statusCode: 409,
          detail: "Social account is already linked to another user",
          ok: false,
        },
      },
    };
    vi.mocked(portfolioAccountsService.completeOAuthCallback).mockRejectedValueOnce(conflictError);

    render(<SocialAccountConnectButtons />);

    await waitFor(() => {
      expect(portfolioAccountsService.completeOAuthCallback).toHaveBeenCalledWith("gitlab", {
        code: "oauth-conflict-code",
      });
    });

    expect(
      await screen.findByText(PORTFOLIO_ACCOUNT_MESSAGES.conflictError),
    ).toBeInTheDocument();
  });

  it("handles generic failure during oauth start", async () => {
    vi.mocked(portfolioAccountsService.getOAuthAuthorizationUrl).mockRejectedValueOnce(
      new Error("Network Error"),
    );

    render(<SocialAccountConnectButtons />);

    const gitlabButton = await screen.findByRole("button", { name: "Conectar con GitLab" });
    fireEvent.click(gitlabButton);

    expect(
      await screen.findByText(PORTFOLIO_ACCOUNT_MESSAGES.genericError),
    ).toBeInTheDocument();
  });

  it("allows retrying when the browser returns from an authorization page", async () => {
    vi.mocked(portfolioAccountsService.getOAuthAuthorizationUrl).mockResolvedValueOnce({
      url: "https://github.com/login/oauth/authorize?client_id=github-id&state=github-test-state",
    });
    render(<SocialAccountConnectButtons />);
    fireEvent.click(await screen.findByRole("button", { name: "Conectar con GitHub" }));
    await waitFor(() => expect(assignWindowLocation).toHaveBeenCalled());
    fireEvent(window, new PageTransitionEvent("pageshow", { persisted: true }));
    expect(await screen.findByRole("button", { name: "Conectar con GitHub" })).toBeEnabled();
  });

  it("opens confirmation dialog when clicking disconnect and cancels without calling service", async () => {
    vi.mocked(portfolioAccountsService.getSocialAccounts).mockResolvedValue([
      {
        provider: "github",
        connected: true,
        username: "valeriaquispe",
        profileUrl: "https://github.com/valeriaquispe",
      },
      {
        provider: "gitlab",
        connected: false,
        username: null,
        profileUrl: null,
      },
    ]);

    render(<SocialAccountConnectButtons />);

    const disconnectButton = await screen.findByRole("button", {
      name: "Desconectar cuenta de GitHub",
    });
    fireEvent.click(disconnectButton);

    expect(
      await screen.findByText("¿Desvincular cuenta de GitHub?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Al desvincular tu cuenta de GitHub, se eliminarán los proyectos asociados de tu portafolio.",
      ),
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("¿Desvincular cuenta de GitHub?")).not.toBeInTheDocument();
    });
    expect(portfolioAccountsService.disconnectSocialAccount).not.toHaveBeenCalled();
  });

  it("disconnects account on confirm and displays success message", async () => {
    vi.mocked(portfolioAccountsService.getSocialAccounts).mockResolvedValue([
      {
        provider: "github",
        connected: true,
        username: "valeriaquispe",
        profileUrl: "https://github.com/valeriaquispe",
      },
      {
        provider: "gitlab",
        connected: false,
        username: null,
        profileUrl: null,
      },
    ]);
    vi.mocked(portfolioAccountsService.disconnectSocialAccount).mockResolvedValueOnce({
      provider: "github",
      connected: false,
    });

    render(<SocialAccountConnectButtons />);

    const disconnectButton = await screen.findByRole("button", {
      name: "Desconectar cuenta de GitHub",
    });
    fireEvent.click(disconnectButton);

    const confirmButton = await screen.findByRole("button", { name: "Desvincular" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(portfolioAccountsService.disconnectSocialAccount).toHaveBeenCalledWith("github");
    });

    expect(
      await screen.findByText("Cuenta de GitHub desvinculada exitosamente."),
    ).toBeInTheDocument();
  });

  it("displays error feedback when disconnect fails", async () => {
    vi.mocked(portfolioAccountsService.getSocialAccounts).mockResolvedValue([
      {
        provider: "gitlab",
        connected: true,
        username: "valeriaquispe",
        profileUrl: "https://gitlab.com/valeriaquispe",
      },
      {
        provider: "github",
        connected: false,
        username: null,
        profileUrl: null,
      },
    ]);
    vi.mocked(portfolioAccountsService.disconnectSocialAccount).mockRejectedValueOnce(
      new Error("Server error"),
    );

    render(<SocialAccountConnectButtons />);

    const disconnectButton = await screen.findByRole("button", {
      name: "Desconectar cuenta de GitLab",
    });
    fireEvent.click(disconnectButton);

    const confirmButton = await screen.findByRole("button", { name: "Desvincular" });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText(PORTFOLIO_ACCOUNT_MESSAGES.disconnectError),
    ).toBeInTheDocument();
  });
});
