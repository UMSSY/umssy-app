import { renderWithQuery as render } from "@/shared/testing/render-with-query";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PORTFOLIO_ACCOUNT_MESSAGES } from "../constants/portfolio-accounts.constants";
import { portfolioAccountsService } from "../services/portfolio-accounts.service";
import { assignWindowLocation } from "../utils/assign-window-location";
import { SocialAccountConnectButtons } from "./social-account-connect-buttons";
import type {
  PortfolioAccountStatusResponse,
  PortfolioConnectedAccountResponse,
  PortfolioOAuthUrlResponse,
} from "../types/portfolio-account.types";

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
}));

vi.mock("../utils/assign-window-location", () => ({
  assignWindowLocation: vi.fn(),
}));

vi.mock("../services/portfolio-accounts.service", () => ({
  portfolioAccountsService: {
    getSocialAccounts: vi.fn(),
    getOAuthAuthorizationUrl: vi.fn(),
    completeOAuthCallback: vi.fn(),
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

    expect(screen.getByText("Cuentas de desarrollo")).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: "Conectar con GitHub" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Conectar con GitLab" }),
    ).toBeInTheDocument();
  });

  it("requests oauth url and redirects on same tab when clicking connect button (CA-2)", async () => {
    const mockAuthUrl: PortfolioOAuthUrlResponse = {
      url: "https://github.com/login/oauth/authorize?client_id=github-id",
    };
    vi.mocked(portfolioAccountsService.getOAuthAuthorizationUrl).mockResolvedValueOnce(mockAuthUrl);

    render(<SocialAccountConnectButtons />);

    const githubButton = await screen.findByRole("button", { name: "Conectar con GitHub" });
    fireEvent.click(githubButton);

    await waitFor(() => {
      expect(portfolioAccountsService.getOAuthAuthorizationUrl).toHaveBeenCalledWith(
        "github",
        "github",
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
    currentSearchParams = new URLSearchParams("provider=github&code=oauth-valid-code");
    const connectedResponse: PortfolioConnectedAccountResponse = {
      id: "acc-1",
      provider: "github",
      username: "valeriaquispe",
      profileUrl: "https://github.com/valeriaquispe",
      connected: true,
    };
    vi.mocked(portfolioAccountsService.completeOAuthCallback).mockResolvedValueOnce(
      connectedResponse,
    );

    render(<SocialAccountConnectButtons />);

    await waitFor(() => {
      expect(portfolioAccountsService.completeOAuthCallback).toHaveBeenCalledWith("github", {
        code: "oauth-valid-code",
      });
    });

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
});
