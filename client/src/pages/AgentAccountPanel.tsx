import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { getPasswordInputType } from "@/lib/passwordVisibility";
import { marketplaceCopy, type PublicLanguage } from "@/lib/marketplaceLocale";
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import "./AgentAccountPanel.css";

type Mode = "signIn" | "register";
type Audience = "agent" | "seeker" | "moderator" | "admin";
type IdentityKind = "front" | "back" | "face";

const audienceCopy = (language: PublicLanguage): Record<Audience, { registerLabel: string; accountLabel: string; note: string; signInLabel: string }> => language === "fr" ? {
  agent: { registerLabel: "Créer un compte agent AHC", accountLabel: "Compte agent AHC", note: "Les comptes agents sont créés directement avec AHC. Un compte Manus n’est pas nécessaire. Les mots de passe incorrects répétés sont temporairement bloqués pour protéger les comptes.", signInLabel: "Se connecter à AHC" },
  seeker: { registerLabel: "Créer un compte chercheur AHC", accountLabel: "Compte chercheur AHC", note: "Créez gratuitement un compte chercheur AHC pour ouvrir les détails d’un logement, contacter les agents et signaler les changements de conditions. Un compte Manus n’est pas nécessaire.", signInLabel: "Se connecter à AHC" },
  moderator: { registerLabel: "", accountLabel: "Compte Modérateur terrain AHC", note: "Les comptes de Modérateur terrain sont attribués par un administrateur AHC. Une inscription publique n’accorde jamais l’autorité du personnel.", signInLabel: "Se connecter aux opérations terrain" },
  admin: { registerLabel: "", accountLabel: "Compte administrateur AHC", note: "Les comptes administrateur sont créés uniquement par le propriétaire du système AHC ou un administrateur autorisé. Une inscription publique n’accorde jamais l’autorité de la plateforme.", signInLabel: "Se connecter à l’administration" },
} : {
  agent: { registerLabel: "Create AHC agent account", accountLabel: "AHC agent account", note: "Agent accounts are created directly with AHC. A Manus account is not required. Repeated incorrect passwords are temporarily locked to protect accounts.", signInLabel: "Sign in to AHC" },
  seeker: { registerLabel: "Create AHC seeker account", accountLabel: "AHC seeker account", note: "Create a free AHC seeker account to open full property details, contact agents, and report changed terms. A Manus account is not required.", signInLabel: "Sign in to AHC" },
  moderator: { registerLabel: "", accountLabel: "AHC Field Moderator account", note: "Field Moderator accounts are assigned by an AHC Admin. Public registration never grants staff authority.", signInLabel: "Sign in to Field Operations" },
  admin: { registerLabel: "", accountLabel: "AHC Admin account", note: "Admin accounts are provisioned only by the AHC system owner or an authorised Admin. Public registration never grants platform authority.", signInLabel: "Sign in to Admin" },
};

async function uploadIdentityDocument(kind: IdentityKind, file: File) {
  const body = await file.arrayBuffer();
  const response = await fetch(`/api/agent/identity-document?kind=${kind}`, { method: "POST", headers: { "Content-Type": file.type }, body });
  if (!response.ok) throw new Error(`Could not upload the government ID ${kind} image.`);
}

export function AgentAccountPanel({ audience = "agent", language = "en", onAuthenticated }: { audience?: Audience; language?: PublicLanguage; onAuthenticated?: () => void }) {
  const accountCopy = audienceCopy(language);
  const copy = audience === "seeker" ? { registerLabel: marketplaceCopy[language].seekerRegister, accountLabel: marketplaceCopy[language].seekerAccount, note: marketplaceCopy[language].seekerNote, signInLabel: accountCopy.seeker.signInLabel } : accountCopy[audience];
  const labels = marketplaceCopy[language];
  const feedback = language === "fr" ? {
    agentReady: "Le compte agent AHC est prêt", privateEvidence: "Le justificatif fiscal et les images de la pièce d’identité ont été envoyés de manière privée.", accountReady: "Le compte AHC est prêt", detailsReady: "Vous pouvez maintenant ouvrir les détails du logement.", adminCheck: "Votre rôle administrateur sera vérifié avant l’ouverture de l’espace d’administration.", staffCheck: "Votre rôle du personnel sera vérifié avant l’ouverture des opérations.", uploadFailed: "Le compte a été créé, mais une image d’identité n’a pas pu être envoyée.", jpgOnly: "Les images de pièce d’identité doivent être au format JPG.", uploadError: "Impossible d’envoyer l’image de la pièce d’identité.", accountOptions: "options de compte",
  } : {
    agentReady: "AHC agent account ready", privateEvidence: "Taxpayer evidence and government-ID images were submitted privately.", accountReady: "AHC account ready", detailsReady: "You can now open the property details.", adminCheck: "Your Admin role will be checked before the Admin workspace opens.", staffCheck: "Your staff role will be checked before Operations opens.", uploadFailed: "The account was created, but an identity image could not be uploaded.", jpgOnly: "Government ID images must be JPG files.", uploadError: "Could not upload the government ID image.", accountOptions: "account options",
  };
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [taxpayerNumber, setTaxpayerNumber] = useState("");
  const [workProofUrl, setWorkProofUrl] = useState("");
  const [identityFiles, setIdentityFiles] = useState<Record<IdentityKind, File | null>>({ front: null, back: null, face: null });
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const utils = trpc.useUtils();
  const resetCaptcha = () => {
    setCaptchaToken("");
    setCaptchaResetKey(value => value + 1);
  };
  const onSuccess = async () => {
    resetCaptcha();
    await Promise.all([utils.auth.me.invalidate(), utils.agent.profile.invalidate(), utils.agent.paidStatus.invalidate(), utils.agent.paymentOrders.invalidate(), utils.agent.listings.invalidate()]);
    if (audience === "agent" && mode === "register") {
      try {
        for (const kind of ["front", "back", "face"] as IdentityKind[]) {
          const file = identityFiles[kind];
          if (file) await uploadIdentityDocument(kind, file);
        }
        toast.success(feedback.agentReady, { description: feedback.privateEvidence });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : feedback.uploadFailed);
      }
    } else {
      toast.success(feedback.accountReady, { description: audience === "seeker" ? feedback.detailsReady : audience === "admin" ? feedback.adminCheck : feedback.staffCheck });
    }
    onAuthenticated?.();
  };
  const register = trpc.auth.registerLocalAgent.useMutation({ onSuccess, onError: error => { resetCaptcha(); toast.error(error.message); } });
  const login = trpc.auth.loginLocalAgent.useMutation({ onSuccess, onError: error => { resetCaptcha(); toast.error(error.message); } });
  const pending = register.isPending || login.isPending;
  const chooseIdentityFile = (kind: IdentityKind, file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg)$/.test(file.type)) {
      toast.error(feedback.jpgOnly);
      return;
    }
    setIdentityFiles(current => ({ ...current, [kind]: file }));
  };

  return <section className="agent-account-panel" aria-label={copy.accountLabel}>
    {audience !== "moderator" && audience !== "admin" && <div className="agent-account-tabs" role="tablist" aria-label={`${audience} ${feedback.accountOptions}`}><button type="button" className={mode === "signIn" ? "active" : ""} onClick={() => setMode("signIn")}>{labels.signIn}</button><button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>{labels.createAccount}</button></div>}
    <form className="agent-form" onSubmit={event => { event.preventDefault(); if (!captchaToken) return; if (mode === "register") register.mutate({ name, email, password, captchaToken, role: audience === "agent" ? "agent" : "seeker", onboarding: audience === "agent" ? { applicantType: "agent", taxpayerNumber, workProofUrl } : undefined }); else login.mutate({ email, password, captchaToken }); }}>
      {mode === "register" && <label>{labels.fullName}<input required value={name} onChange={event => setName(event.target.value)} autoComplete="name" placeholder={audience === "agent" ? labels.professionalName : labels.fullName} /></label>}
      {mode === "register" && audience === "agent" && <><label>{labels.taxpayerNumber}<input required value={taxpayerNumber} onChange={event => setTaxpayerNumber(event.target.value)} placeholder={labels.taxpayerPlaceholder} /></label><label>{labels.workProof}<input required type="url" value={workProofUrl} onChange={event => setWorkProofUrl(event.target.value)} placeholder={labels.workProofPlaceholder} /></label><fieldset className="identity-upload-fieldset"><legend>{labels.governmentId}</legend><p className="form-note">{labels.idUploadNote}</p>{(["front", "back", "face"] as IdentityKind[]).map(kind => <label key={kind}>{kind === "front" ? labels.idFront : kind === "back" ? labels.idBack : labels.faceView}<input required type="file" accept="image/jpeg,.jpg,.jpeg" onChange={event => chooseIdentityFile(kind, event.target.files?.[0])} /></label>)}</fieldset></>}
      <label>{labels.email}<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="vous@exemple.com" /></label>
      <label>{labels.password}<div className="password-field"><input required type={getPasswordInputType(passwordVisible)} minLength={mode === "register" ? 10 : 1} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? labels.passwordNew : labels.passwordExisting} /><button type="button" className="password-visibility-toggle" onClick={() => setPasswordVisible(current => !current)} aria-label={passwordVisible ? `${labels.hide} ${labels.password.toLowerCase()}` : `${labels.passwordShow} ${labels.password.toLowerCase()}`} aria-pressed={passwordVisible}>{passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}<span>{passwordVisible ? labels.hide : labels.passwordShow}</span></button></div></label>
      <TurnstileChallenge language={language} onToken={setCaptchaToken} resetKey={captchaResetKey} />
      <button className="button-primary full-width" disabled={pending || !captchaToken}>{pending ? labels.wait : mode === "register" ? copy.registerLabel : copy.signInLabel}</button>
    </form>
    <p className="form-note">{copy.note}</p>
  </section>;
}
