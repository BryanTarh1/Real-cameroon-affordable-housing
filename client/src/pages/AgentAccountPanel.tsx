import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import "./AgentAccountPanel.css";

type Mode = "signIn" | "register";
type Audience = "agent" | "seeker" | "moderator" | "admin";

const audienceCopy: Record<Audience, { registerLabel: string; accountLabel: string; note: string }> = {
  agent: { registerLabel: "Create AHC agent account", accountLabel: "AHC agent account", note: "Agent accounts are created directly with AHC. A Manus account is not required. Repeated incorrect passwords are temporarily locked to protect accounts." },
  seeker: { registerLabel: "Create AHC seeker account", accountLabel: "AHC seeker account", note: "Create a free AHC seeker account to open full property details, contact agents, and report changed terms. A Manus account is not required." },
  moderator: { registerLabel: "", accountLabel: "AHC Field Moderator account", note: "Field Moderator accounts are assigned by an AHC Admin. Public registration never grants staff authority." },
  admin: { registerLabel: "", accountLabel: "AHC Admin account", note: "Admin accounts are provisioned only by the AHC system owner or an authorised Admin. Public registration never grants platform authority." },
};

export function AgentAccountPanel({ audience = "agent", onAuthenticated }: { audience?: Audience; onAuthenticated?: () => void }) {
  const copy = audienceCopy[audience];
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [governmentIdUrl, setGovernmentIdUrl] = useState("");
  const [workProofUrl, setWorkProofUrl] = useState("");
  const utils = trpc.useUtils();
  const onSuccess = async () => {
    // These endpoint keys do not include a user id. Clear them on every local
    // session transition so an Agent who signs out and signs back in never sees
    // a previous account's listing-credit balance, orders, or inventory.
    await Promise.all([
      utils.auth.me.invalidate(),
      utils.agent.profile.invalidate(),
      utils.agent.paidStatus.invalidate(),
      utils.agent.paymentOrders.invalidate(),
      utils.agent.listings.invalidate(),
    ]);
    toast.success("AHC account ready", { description: audience === "agent" ? "You can now complete your agent profile." : audience === "seeker" ? "You can now open the property details." : audience === "admin" ? "Your Admin role will be checked before the Admin workspace opens." : "Your staff role will be checked before Operations opens." });
    onAuthenticated?.();
  };
  const register = trpc.auth.registerLocalAgent.useMutation({ onSuccess, onError: error => toast.error(error.message) });
  const login = trpc.auth.loginLocalAgent.useMutation({ onSuccess, onError: error => toast.error(error.message) });
  const pending = register.isPending || login.isPending;

  return <section className="agent-account-panel" aria-label={copy.accountLabel}>
    {audience !== "moderator" && audience !== "admin" && <div className="agent-account-tabs" role="tablist" aria-label={`${audience} account options`}>
      <button type="button" className={mode === "signIn" ? "active" : ""} onClick={() => setMode("signIn")}>Sign in</button>
      <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button>
    </div>}
    <form className="agent-form" onSubmit={event => {
      event.preventDefault();
      if (mode === "register") register.mutate({ name, email, password, onboarding: audience === "agent" ? { applicantType: "agent", governmentIdUrl, workProofUrl } : undefined });
      else login.mutate({ email, password });
    }}>
      {mode === "register" && <label>Full name<input required value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder={audience === "agent" ? "Your professional name" : "Your full name"} /></label>}
      {mode === "register" && audience === "agent" && <><label>Government ID reference URL<input required type="url" value={governmentIdUrl} onChange={event => setGovernmentIdUrl(event.target.value)} placeholder="Private secure-document URL" /></label><label>Proof of work reference URL<input required type="url" value={workProofUrl} onChange={event => setWorkProofUrl(event.target.value)} placeholder="Brokerage, employer, or work proof URL" /></label></>}
      <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
      <label>Password<input required type="password" minLength={mode === "register" ? 10 : 1} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "At least 10 characters" : "Your AHC password"} /></label>
      <button className="button-primary full-width" disabled={pending}>{pending ? "Please wait…" : mode === "register" ? copy.registerLabel : audience === "moderator" ? "Sign in to Field Operations" : audience === "admin" ? "Sign in to Admin" : "Sign in to AHC"}</button>
    </form>
    <p className="form-note">{copy.note}</p>
  </section>;
}
