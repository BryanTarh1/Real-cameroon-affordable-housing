import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const loaderSource = readFileSync(new URL("../components/AhcLoadingState.tsx", import.meta.url), "utf8");
const loaderStyles = readFileSync(new URL("../components/AhcLoadingState.css", import.meta.url), "utf8");

describe("branded AHC loading state", () => {
  it("uses the branded loader while marketplace and property data are pending", () => {
    expect(homeSource).toContain("<AhcLoadingState message=");
    expect(homeSource).toContain("<AhcLoadingState compact message=");
    expect(homeSource).not.toContain('className="loading-list"');
  });

  it("includes the AHC mark, wordmark, and accessible live status", () => {
    expect(loaderSource).toContain("ahc-loading-emblem");
    expect(loaderSource).toContain("Affordable Housing");
    expect(loaderSource).toContain("Cameroon");
    expect(loaderSource).toContain('role="status"');
    expect(loaderSource).toContain('aria-live="polite"');
  });

  it("covers dark mode, responsive layout, progress motion, and reduced motion", () => {
    expect(loaderStyles).toContain(".dark .ahc-loading-state");
    expect(loaderStyles).toContain("@media (max-width: 520px)");
    expect(loaderStyles).toContain("ahc-loading-progress");
    expect(loaderStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("uses the same branded loader while protected routes verify access", () => {
    expect(appSource).toContain("<AhcLoadingState message=\"Checking secure access\"");
  });
});
