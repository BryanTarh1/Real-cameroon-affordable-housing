import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { getPasswordInputType } from "@/lib/passwordVisibility";
import "./AgentAccountPanel.css";

type Mode = "signIn" | "register";
type Audience = "agent" | "seeker" | "moderator" | "admin";
type IdentityKind = "front" | "back" | "face";

const audienceCopy: Record<Audience, { registerLabel: string; accountLabel: string; note: string }> = {
  agent: { registerLabel: "Create AHC agent account", accountLabel: "AHC agent account", note: "Agent accounts are created directly with AHC. A Manus account is not required. Repeated incorrect passwords are temporarily locked to protect accounts." },
  seeker: { registerLabel: "Create AHC seeker account", accountLabel: "AHC seeker account", note: "Create a free AHC seeker account to open full property details, contact agents, and report changed terms. A Manus account is not required." },
  moderator: { registerLabel: "", accountLabel: "AHC Field Moderator account", note: "Field Moderator accounts are assigned by an AHC Admin. Public registration never grants staff authority." },
  admin: { registerLabel: "", accountLabel: "AHC Admin account", note: "Admin accounts are provisioned only by the AHC system owner or an authorised Admin. Public registration never grants platform authority." },
};

async function uploadIdentityDocument(kind: IdentityKind, file: File) {
  const body = await file.arrayBuffer();
  const response = await fetch(`/api/agent/identity-document?kind=${kind}`, { method: "POST", headers: { "Content-Type": file.type }, body });
  if (!response.ok) throw new Error(`Could not upload the government ID ${kind} image.`);
}

export function AgentAccountPanel({ audience = "agent", onAuthenticated }: { audience?: Audience; onAuthenticated?: () => void }) {
  const copy = audienceCopy[audience];
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [taxpayerNumber, setTaxpayerNumber] = useState("");
  const [workProofUrl, setWorkProofUrl] = useState("");
  const [identityFiles, setIdentityFiles] = useState<Record<IdentityKind, File | null>>({ front: null, back: null, face: null });
  const utils = trpc.useUtils();
  const onSuccess = async () => {
    await Promise.all([utils.auth.me.invalidate(), utils.agent.profile.invalidate(), utils.agent.paidStatus.invalidate(), utils.agent.paymentOrders.invalidate(), utils.agent.listings.invalidate()]);
    if (audience === "agent" && mode === "register") {
      try {
        for (const kind of ["front", "back", "face"] as IdentityKind[]) {
          const file = identityFiles[kind];
          if (file) await uploadIdentityDocument(kind, file);
        }
        toast.success("AHC agent account ready", { description: "Taxpayer evidence and government-ID images were submitted privately." });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The account was created, but an identity image could not be uploaded.");
      }
    } else {
      toast.success("AHC account ready", { description: audience === "seeker" ? "You can now open the property details." : audience === "admin" ? "Your Admin role will be checked before the Admin workspace opens." : "Your staff role will be checked before Operations opens." });
    }
    onAuthenticated?.();
  };
  const register = trpc.auth.registerLocalAgent.useMutation({ onSuccess, onError: error => toast.error(error.message) });
  const login = trpc.auth.loginLocalAgent.useMutation({ onSuccess, onError: error => toast.error(error.message) });
  const pending = register.isPending || login.isPending;
  const chooseIdentityFile = (kind: IdentityKind, file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg)$/.test(file.type)) {
      toast.error("Government ID images must be JPG files.");
      return;
    }
    setIdentityFiles(current => ({ ...current, [kind]: file }));
  };

  return <section className="agent-account-panel" aria-label={copy.accountLabel}>
    {audience !== "moderator" && audience !== "admin" && <div className="agent-account-tabs" role="tablist" aria-label={`${audience} account options`}><button type="button" className={mode === "signIn" ? "active" : ""} onClick={() => setMode("signIn")}>Sign in</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Create account</button></div>}
    <form className="agent-form" onSubmit={event => { event.preventDefault(); if (mode === "register") register.mutate({ name, email, password, onboarding: audience === "agent" ? { applicantType: "agent", taxpayerNumber, workProofUrl } : undefined }); else login.mutate({ email, password }); }}>
      {mode === "register" && <label>Full name<input required value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder={audience === "agent" ? "Your professional name" : "Your full name"} /></label>}
      {mode === "register" && audience === "agent" && <><label>Taxpayer number<input required value={taxpayerNumber} onChange={event => setTaxpayerNumber(event.target.value)} placeholder="Taxpayer identification number" /></label><label>Proof of work reference URL<input required type="url" value={workProofUrl} onChange={event => setWorkProofUrl(event.target.value)} placeholder="Brokerage, employer, or work proof URL" /></label><fieldset className="identity-upload-fieldset"><legend>Government ID — JPG images only</legend><p className="form-note">Upload the front, back, and a face-view image. These files are private and are not shown on public listings.</p>{(["front", "back", "face"] as IdentityKind[]).map(kind => <label key={kind}>{kind === "front" ? "ID front" : kind === "back" ? "ID back" : "Face view"}<input required type="file" accept="image/jpeg,.jpg,.jpeg" onChange={event => chooseIdentityFile(kind, event.target.files?.[0])} /></label>)}</fieldset></>}
      <label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
      <label>Password<div className="password-field"><input required type={getPasswordInputType(passwordVisible)} minLength={mode === "register" ? 10 : 1} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "At least 10 characters" : "Your AHC password"} /><button type="button" className="password-visibility-toggle" onClick={() => setPasswordVisible(current => !current)} aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible}>{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}<span>{passwordVisible ? "Hide" : "Show"}</span></button></div></label>
      <button className="button-primary full-width" disabled={pending}>{pending ? "Please wait…" : mode === "register" ? copy.registerLabel : audience === "moderator" ? "Sign in to Field Operations" : audience === "admin" ? "Sign in to Admin" : "Sign in to AHC"}</button>
    </form>
    <p className="form-note">{copy.note}</p>
  </section>;
}
