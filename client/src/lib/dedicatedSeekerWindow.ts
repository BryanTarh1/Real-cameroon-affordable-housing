const DEDICATED_SEEKER_WINDOW_MARKER = "ahc-window";
const DEDICATED_SEEKER_WINDOW_VALUE = "seeker";
const DEDICATED_SEEKER_WINDOW_STORAGE_KEY = "ahc-dedicated-seeker-window";
const DEDICATED_SEEKER_HISTORY_KEY = "ahcDedicatedSeekerWindow";

type BrowserLocation = Pick<Location, "pathname" | "search">;

export function isDedicatedSeekerPropertyWindow(location: BrowserLocation) {
  return location.pathname.startsWith("/property/")
    && new URLSearchParams(location.search).get(DEDICATED_SEEKER_WINDOW_MARKER) === DEDICATED_SEEKER_WINDOW_VALUE;
}

/**
 * Marks a property tab opened by AHC and adds one local history entry. The entry lets the
 * browser Back action close this standalone tab rather than exposing duplicate catalogue content.
 */
export function armDedicatedSeekerWindow() {
  if (typeof window === "undefined" || !isDedicatedSeekerPropertyWindow(window.location)) return false;

  try {
    window.sessionStorage.setItem(DEDICATED_SEEKER_WINDOW_STORAGE_KEY, "1");
  } catch {}

  const state = window.history.state as Record<string, unknown> | null;
  if (!state?.[DEDICATED_SEEKER_HISTORY_KEY]) {
    window.history.pushState({ ...(state ?? {}), [DEDICATED_SEEKER_HISTORY_KEY]: true }, "", window.location.href);
  }
  return true;
}

export function isArmedDedicatedSeekerWindow() {
  if (typeof window === "undefined") return false;
  if (isDedicatedSeekerPropertyWindow(window.location)) return true;
  try {
    return window.sessionStorage.getItem(DEDICATED_SEEKER_WINDOW_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * AHC-created tabs are script-opened and normally close immediately. If an embedder or browser
 * rejects that request, replace the page with a blank document rather than navigating it to the
 * catalogue and showing a duplicate homepage in the second tab.
 */
export function closeDedicatedSeekerWindow() {
  if (typeof window === "undefined" || !isArmedDedicatedSeekerWindow()) return false;

  window.close();
  window.setTimeout(() => {
    if (!window.closed) {
      window.location.replace("about:blank");
    }
  }, 0);
  return true;
}
