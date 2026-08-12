import { useAuth } from "@/_core/hooks/useAuth";
import { AgentAccountPanel } from "./AgentAccountPanel";
import "./launch-refinements.css";

export default function ModeratorAccess() {
  const { isAuthenticated, user } = useAuth();
  const hasUnassignedAccount = isAuthenticated && user?.role === "user";

  return <main className="operations-page"><section className="agent-drawer operations-access-panel" aria-label="Field Moderator access">
    <span className="section-overline">AHC / Field Moderator</span>
    <h1>Sign in to field operations.</h1>
    <p>Field Moderators review submitted listings, reconcile payment references, record on-site inspection outcomes, and earn the recorded share after a passed verification. This work area is for staff intentionally assigned by an AHC Admin.</p>
    {hasUnassignedAccount ? <div className="admin-settings-callout"><b>This account is not assigned to Field Operations.</b><span>Ask the AHC owner or an authorised Admin to assign your existing account the Field Moderator role. Creating a public account never grants staff access.</span></div> : <AgentAccountPanel audience="moderator" />}
    <p className="form-note">Your sign-in uses an AHC account. A Manus account is not required. The Admin route is intentionally not linked from public pages.</p>
  </section></main>;
}
