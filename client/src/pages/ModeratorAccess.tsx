import { useAuth } from "@/_core/hooks/useAuth";
import { useMarketplaceLanguage } from "@/hooks/useMarketplaceLanguage";
import { AgentAccountPanel } from "./AgentAccountPanel";
import "./launch-refinements.css";
import "./staff-access.css";

export default function ModeratorAccess() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useMarketplaceLanguage();
  const hasUnassignedAccount = isAuthenticated && user?.role === "user";
  const copy = language === "fr" ? {
    ariaLabel: "Accès Modérateur terrain",
    route: "Accès sécurisé du personnel",
    area: "Travail de terrain",
    overline: "AHC / Modérateur terrain",
    title: "Connectez-vous aux opérations terrain.",
    description: "Les Modérateurs terrain examinent les annonces soumises, consignent les résultats d’inspection sur place et les preuves privées, et ne reçoivent la part enregistrée qu’après l’approbation Admin des preuves de vérification et de tout audit requis. Le rapprochement des commandes de services de plateforme est un contrôle financier réservé à l’Admin. Cet espace est réservé au personnel désigné par un Admin AHC.",
    unassignedTitle: "Ce compte n’est pas attribué aux opérations terrain.",
    unassignedBody: "Demandez au propriétaire AHC ou à un Admin autorisé d’attribuer le rôle Modérateur terrain à votre compte existant. La création d’un compte public ne donne jamais accès au personnel.",
    note: "Votre connexion utilise un compte AHC. Un compte Manus n’est pas requis. La route Admin n’est volontairement pas liée depuis les pages publiques.",
  } : {
    ariaLabel: "Field Moderator access",
    route: "Secure staff route",
    area: "Field work",
    overline: "AHC / Field Moderator",
    title: "Sign in to field operations.",
    description: "Field Moderators review submitted listings, record on-site inspection outcomes and private evidence, and earn the recorded share only after verification evidence and any required audit receive Admin approval. Platform service-order reconciliation is an Admin-only finance control. This work area is for staff intentionally assigned by an AHC Admin.",
    unassignedTitle: "This account is not assigned to Field Operations.",
    unassignedBody: "Ask the AHC owner or an authorised Admin to assign your existing account the Field Moderator role. Creating a public account never grants staff access.",
    note: "Your sign-in uses an AHC account. A Manus account is not required. The Admin route is intentionally not linked from public pages.",
  };

  return <main className="operations-page"><section className="agent-drawer operations-access-panel" aria-label={copy.ariaLabel}>
    <header className="staff-access-brand"><span className="staff-access-emblem" aria-hidden="true"><i /><i /><i /></span><span><small>Affordable Housing Cameroon</small><b>{copy.route}</b></span><em>{copy.area}</em></header>
    <span className="section-overline">{copy.overline}</span>
    <h1>{copy.title}</h1>
    <p>{copy.description}</p>
    {hasUnassignedAccount ? <div className="admin-settings-callout"><b>{copy.unassignedTitle}</b><span>{copy.unassignedBody}</span></div> : <AgentAccountPanel audience="moderator" language={language} />}
    <p className="form-note">{copy.note}</p>
  </section></main>;
}
