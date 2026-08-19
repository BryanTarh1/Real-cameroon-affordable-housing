export type AhcRole = "seeker" | "agent" | "moderator" | "admin" | null | undefined;

export function canUseOperations(role: AhcRole) {
  return role === "moderator" || role === "admin";
}

export function resolveListingDetailAccess(isAuthenticated: boolean) {
  return isAuthenticated ? "detail" : "sign_in";
}

export function resolveModeratorEntry(role: AhcRole) {
  return canUseOperations(role) ? "workspace" : "sign_in";
}
