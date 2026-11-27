export { LoginView } from "./views/login-view";
export { ForgotPasswordView } from "./views/forgot-password-view";
export { SessionClosedView } from "./views/session-closed-view";
export { useLogin } from "./hooks/use-login";
export { useLogout } from "./hooks/use-logout";
export { authService } from "./services/auth.service";
export { SessionGate } from "./components/session-gate";
export { startSession, endSession } from "./utils/session";
export { SESSION_DRAFT_STORAGE_PREFIX, SESSION_MARKER_COOKIE_NAME, SESSION_MARKER_COOKIE_VALUE } from "./constants/session.constants";
export { buildLoginUrl } from "./utils/safe-next-path";
export { SessionUserCard } from "./components/session-user-card";
export { getSessionRoles } from "./utils/get-session-roles";
export type { SessionResponse } from "./types/session-response.types";
export type { RoleTag, LoginResponse } from "./types/auth-types";
export { getRolesLabel } from "./utils/get-session-role-label";
export {
  broadcastAuthEvent,
  useAuthBroadcastSync,
  AUTH_BROADCAST_CHANNEL,
} from "./utils/auth-broadcast";

export { SessionLogoutMenuItem } from "./components/session-logout-menu-item";
export { LogoutConfirmDialog } from "./components/logout-confirm-dialog";
export { SessionTimeoutModal } from "./components/session-timeout-modal";
export { SessionInactivityGuard } from "./components/session-inactivity-guard";
export { useSessionInactivity } from "./hooks/use-session-inactivity";
export { formatCountdown } from "./utils/format-countdown";
export {
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_WARNING_SECONDS,
  DEFAULT_ABSOLUTE_TIMEOUT_HOURS,
  DEFAULT_AUTO_REFRESH_INTERVAL_SECONDS,
} from "./constants/session-timing.constants";
export { executeSharedRefresh } from "./utils/session-refresh-lock";
export { resolvePostLoginPath } from "./utils/resolve-post-login-path";

export { getSafeNextPath } from "./utils/safe-next-path";
