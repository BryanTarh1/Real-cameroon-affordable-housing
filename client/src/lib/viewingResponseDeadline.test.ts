import { describe, expect, it } from "vitest";
import { classifyViewingResponseDeadline } from "./viewingResponseDeadline";

describe("classifyViewingResponseDeadline", () => {
  const now = "2026-08-20T12:00:00.000Z";

  it("marks passed confirmation deadlines as overdue", () => {
    expect(classifyViewingResponseDeadline("2026-08-20T11:59:59.000Z", now)).toBe("overdue");
  });

  it("marks the next 24 hours as due soon", () => {
    expect(classifyViewingResponseDeadline("2026-08-21T11:59:59.000Z", now)).toBe("due_soon");
  });

  it("keeps later response deadlines scheduled", () => {
    expect(classifyViewingResponseDeadline("2026-08-21T12:00:01.000Z", now)).toBe("scheduled");
  });
});
