import { useCallback } from "react";
import { useLocation } from "wouter";
import { PaidAgentPortal } from "./PaidAgentPortal";

/** Full-page Agent workspace; public marketplace navigation is intentionally not rendered here. */
export default function AgentWorkspacePage() {
  const [, navigate] = useLocation();
  const close = useCallback(() => navigate("/"), [navigate]);
  return <main className="agent-workspace-page"><div className="agent-workspace-frame"><PaidAgentPortal onClose={close} /></div></main>;
}
