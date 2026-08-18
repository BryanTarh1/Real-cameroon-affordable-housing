import { useAuth } from "@/_core/hooks/useAuth";
import { useMarketplaceLanguage } from "@/hooks/useMarketplaceLanguage";
import { AgentAccountPanel } from "./AgentAccountPanel";
import "./launch-refinements.css";
import "./staff-access.css";

export default function AdminAccess() {
  const { isAuthenticated, user } = useAuth();
  const { language } = useMarketplaceLanguage();
  const hasUnassignedAccount = isAuthenticated && user?.role !== "admin";
  const copy = language === "fr" ? {
    ariaLabel: "Accès Admin",
    route: "Accès sécurisé du personnel",
    area: "Gouvernance",
    overline: "AHC / Admin",
    title: "Connectez-vous à l’administration de la plateforme.",
    description: "L’espace Admin gère les rôles, les paramètres de la plateforme, le rapprochement des paiements, l’examen des risques de confiance, les retenues de sécurité et l’approbation des commissions retenues. Il est réservé aux comptes auxquels le rôle Admin a été attribué délibérément.",
    unassignedTitle: "Ce compte AHC connecté n’est pas un compte Admin.",
    unassignedBody: "Demandez au propriétaire du système AHC ou à un Admin autorisé d’attribuer le rôle approprié. Une inscription publique ne crée jamais un compte Admin.",
    note: "Utilisez une connexion explicite à un compte AHC. Une session Manus ou d’aperçu ne déverrouille pas cet espace.",
  } : {
    ariaLabel: "Admin access",
    route: "Secure staff route",
    area: "Governance",
    overline: "AHC / Admin",
    title: "Sign in to platform administration.",
    description: "The Admin workspace controls roles, platform settings, payment reconciliation, trust-risk review, safety holds, and held commission approval. It is reserved for accounts deliberately assigned the Admin role.",
    unassignedTitle: "This signed-in AHC account is not an Admin account.",
    unassignedBody: "Ask the AHC system owner or an existing authorised Admin to assign the appropriate role. Public registration never creates an Admin.",
    note: "Use an explicit AHC account sign-in. A Manus or preview session does not unlock this workspace.",
  };

  return <main className="operations-page"><section className="agent-drawer operations-access-panel" aria-label={copy.ariaLabel}>
    <header className="staff-access-brand"><span className="staff-access-emblem" aria-hidden="true"><i /><i /><i /></span><span><small>Affordable Housing Cameroon</small><b>{copy.route}</b></span><em>{copy.area}</em></header>
    <span className="section-overline">{copy.overline}</span>
    <h1>{copy.title}</h1>
    <p>{copy.description}</p>
    {hasUnassignedAccount ? <div className="admin-settings-callout"><b>{copy.unassignedTitle}</b><span>{copy.unassignedBody}</span></div> : <AgentAccountPanel audience="admin" language={language} />}
    <p className="form-note">{copy.note}</p>
  </section></main>;
}
