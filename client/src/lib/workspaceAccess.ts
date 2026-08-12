export function canAccessWorkspace(
  userRole: string | null | undefined,
  allowedRoles: readonly string[],
): boolean {
  return Boolean(userRole && allowedRoles.includes(userRole));
}
