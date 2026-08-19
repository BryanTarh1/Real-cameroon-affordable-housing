export type StorageAccessUser = {
  id: number;
  role: "seeker" | "agent" | "moderator" | "admin";
  isBanned: boolean;
};

export type WalkthroughStorageAccess = {
  capturedByUserId: number;
  videoStatus: "captured" | "published" | "withheld";
  listingStatus: string;
};

/**
 * Returns null for non-private keys so intentionally public listing images keep
 * their existing delivery path. Private objects are never dereferenced without
 * a current, non-suspended local session.
 */
export function canReadPrivateStorageKey(key: string, user: StorageAccessUser | null) {
  if (!key.startsWith("private/")) return null;
  if (!user || user.isBanned) return false;

  const customerAvatar = /^private\/customer-avatar\/(\d+)\//.exec(key);
  if (customerAvatar) return user.id === Number(customerAvatar[1]);

  const agentIdentity = /^private\/agent-identity\/(\d+)\//.exec(key);
  if (agentIdentity) {
    return user.id === Number(agentIdentity[1]) || user.role === "admin";
  }

  // Unknown private prefixes fail closed rather than being signed by the proxy.
  return false;
}

/** Walkthrough clips become public only once their linked listing is published. */
export function canReadWalkthroughStorageKey(
  walkthrough: WalkthroughStorageAccess,
  user: StorageAccessUser | null,
) {
  if (walkthrough.videoStatus === "published" && walkthrough.listingStatus === "published") return true;
  if (!user || user.isBanned) return false;
  return user.role === "admin" || (user.role === "moderator" && user.id === walkthrough.capturedByUserId);
}
