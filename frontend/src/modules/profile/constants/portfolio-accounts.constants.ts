import type { PortfolioProviderName } from "../types/portfolio-account.types";

export const PORTFOLIO_ACCOUNTS_QUERY_KEY = ["profile", "portfolio", "accounts"] as const;

export const PORTFOLIO_PROVIDERS: readonly PortfolioProviderName[] = ["github", "gitlab"] as const;

export const PORTFOLIO_PROVIDER_LABELS: Record<PortfolioProviderName, string> = {
  github: "GitHub",
  gitlab: "GitLab",
};

export const PORTFOLIO_ACCOUNT_MESSAGES = {
  connected: "Conectado",
  connecting: "Conectando...",
  redirecting: "Redirigiendo...",
  connectWith: (providerLabel: string) => `Conectar con ${providerLabel}`,
  reconnect: "Cambiar",
  connectSuccess: (providerLabel: string) => `Cuenta de ${providerLabel} vinculada exitosamente.`,
  userCancelled: "Conexión cancelada por el usuario.",
  conflictError: "Esta cuenta ya está vinculada a otro usuario.",
  genericError: "No se pudo conectar la cuenta. Inténtalo de nuevo.",
  sectionTitle: "Cuentas de desarrollo",
  sectionDescription: "Conecta tu cuenta para importar repositorios a tu portafolio.",
};

