import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const app = fs.readFileSync(path.resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("safe staff and Agent sign-in boundaries", () => {
  it("shows the existing local sign-in surface to signed-out visitors before enforcing workspace data guards", () => {
    expect(app).toContain('if (!loading && !user) return <AgentWorkspacePage />;');
    expect(app).toContain('if (!loading && !user) return <ModeratorAccess />;');
    expect(app).toContain('if (!loading && !user) return <AdminAccess />;');
  });

  it("keeps the actual role-scoped workspaces behind ProtectedWorkspace after sign-in", () => {
    expect(app).toContain('<ProtectedWorkspace allowedRoles={["agent"]}><AgentWorkspacePage /></ProtectedWorkspace>');
    expect(app).toContain('<ProtectedWorkspace allowedRoles={["admin", "moderator"]}><Operations /></ProtectedWorkspace>');
    expect(app).toContain('<ProtectedWorkspace allowedRoles={["admin"]}><Admin /></ProtectedWorkspace>');
  });
});
