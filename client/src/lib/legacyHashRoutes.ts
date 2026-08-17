/** Converts AHC’s former `#/path` links into safe same-origin browser paths. */
export function legacyHashPathToBrowserPath(hash: string): string | null {
  if (!hash.startsWith("#/")) return null;
  const destination = hash.slice(1);
  if (!destination.startsWith("/") || destination.startsWith("//")) return null;
  return destination;
}
