import { useAuth } from "@/_core/hooks/useAuth";
import { AgentAccountPanel } from "./AgentAccountPanel";
import "./launch-refinements.css";
import "./staff-access.css";

export default function AdminAccess() {
  const { isAuthenticated, user } = useAuth();
  const hasUnassignedAccount = isAuthenticated && user?.role !== "admin";

  return <main className="operations-page"><section className="agent-drawer operations-access-panel" aria-label="Admin access">
    <header className="staff-access-brand"><span className="staff-access-emblem" aria-hidden="true"><i /><i /><i /></span><span><small>Affordable Housing Cameroon</small><b>Secure staff route</b></span><em>Governance</em></header>
    <span className="section-overline">AHC / Admin</span>
    <h1>Sign in to platform administration.</h1>
    <p>The Admin workspace controls roles, platform settings, payment reconciliation, trust-risk review, safety holds, and held commission approval. It is reserved for accounts deliberately assigned the Admin role.</p>
    {hasUnassignedAccount ? <div className="admin-settings-callout"><b>This signed-in AHC account is not an Admin account.</b><span>Ask the AHC system owner or an existing authorised Admin to assign the appropriate role. Public registration never creates an Admin.</span></div> : <AgentAccountPanel audience="admin" />}
    <p className="form-note">Use an explicit AHC account sign-in. A Manus or preview session does not unlock this workspace.</p>
  </section></main>;
}
