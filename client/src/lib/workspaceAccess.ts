export function canAccessWorkspace(
  userRole: string | null | undefined,
  allowedRoles: readonly string[],
): boolean {
  return Boolean(userRole && allowedRoles.includes(userRole));
}

/** Safe landing route for each signed-in AHC role; unknown or signed-out visitors return to the public marketplace. */
export function workspaceHomeForRole(userRole: string | null | undefined): string {
  if (userRole === "admin") return "/admin";
  if (userRole === "moderator") return "/operations";
  if (userRole === "user") return "/agent";
  return "/";
}
