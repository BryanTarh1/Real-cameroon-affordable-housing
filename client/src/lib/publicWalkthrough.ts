export type PublicWalkthrough = {
  url: string;
  durationSeconds: number;
  verifiedAt: Date | string | null;
};

/**
 * The API returns this summary only for a video already approved for public
 * discovery. This guard protects the detail UI from attempting to render an
 * absent or malformed media reference; raw moderator proof remains separate.
 */
export function publicWalkthroughForDetail(walkthrough: PublicWalkthrough | null | undefined) {
  if (!walkthrough?.url.trim() || !Number.isFinite(walkthrough.durationSeconds) || walkthrough.durationSeconds <= 0) {
    return null;
  }
  return walkthrough;
}
