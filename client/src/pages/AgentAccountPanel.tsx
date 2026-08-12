import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import "./AgentAccountPanel.css";

type Mode = "signIn" | "register";

export function AgentAccountPanel() {
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const onSuccess = async () => {
    await utils.auth.me.invalidate();
    toast.success("AHC account ready", { description: "You can now complete your agent profile." });
  };
  const register = trpc.auth.registerLocalAgent.useMutation({ onSuccess, onError: error => toast.error(error.message) });
  const login = trpc.auth.loginLocalAgent.useMutation({ onSuccess, onError: error => toast.error(error.message) });
  const pending = register.isPending || login.isPending;

  return <section className="agent-account-panel" aria-label="AHC agent account">
    <div className="agent-account-tabs" role="tablist" aria-label="Agent account options">
      <button type="button" className={mode === "signIn" ? "active" : ""} onClick={() => setMode("signIn")}>Sign in</button>
      <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button>
    </div>
    <form className="agent-form" onSubmit={event => {
      event.preventDefault();
      if (mode === "register") register.mutate({ name, email, password });
      else login.mutate({ email, password });
    }}>
      {mode === "register" && <label>Full name<input required value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder="Your professional name" /></label>}
      <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
      <label>Password<input required type="password" minLength={mode === "register" ? 10 : 1} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "At least 10 characters" : "Your AHC password"} /></label>
      <button className="button-primary full-width" disabled={pending}>{pending ? "Please wait…" : mode === "register" ? "Create AHC agent account" : "Sign in to AHC"}</button>
    </form>
    <p className="form-note">Agent accounts are created directly with AHC. A Manus account is not required. Repeated incorrect passwords are temporarily locked to protect accounts.</p>
  </section>;
}
