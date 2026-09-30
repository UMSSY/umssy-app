// Temporary logged user until Epic 1 provides authentication (JWT).
// Remove this folder once the real session is available (see README.md).
const USER_ID_HEADER = "x-user-id";

export function buildDevUserHeaders(): Record<string, string> {
  const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;
  return devUserId ? { [USER_ID_HEADER]: devUserId } : {};
}
