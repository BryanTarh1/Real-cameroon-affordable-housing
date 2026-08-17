import { ChartNoAxesCombined } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { PublicLanguage } from "@/lib/marketplaceLocale";

export function AgentQualityDashboard({ language }: { language: PublicLanguage }) {
  const quality = trpc.agent.qualityDashboard.useQuery();
  if (quality.isLoading) return <section className="agent-section"><span className="section-overline">QUALITY SIGNALS</span><p className="muted">{language === "fr" ? "Chargement des indicateurs vérifiables…" : "Loading verifiable indicators…"}</p></section>;
  if (!quality.data) return null;
  const metrics = [
    [language === "fr" ? "Annonces enregistrées" : "Listings recorded", quality.data.totalListings],
    [language === "fr" ? "Annonces fraîches publiées" : "Fresh published listings", quality.data.freshPublishedListings],
    [language === "fr" ? "Annonces vérifiées physiquement" : "Physically verified listings", quality.data.physicallyVerifiedListings],
    [language === "fr" ? "Pistes WhatsApp suivies" : "Tracked WhatsApp leads", quality.data.trackedWhatsAppLeads],
    [language === "fr" ? "Visites terminées" : "Completed viewings", quality.data.completedViewings],
    [language === "fr" ? "Disponibilités reconfirmées" : "Availability reconfirmations", quality.data.availabilityConfirmations],
    [language === "fr" ? "Signalements de prix différents" : "Price-difference signals", quality.data.priceDifferedOutcomes],
  ];
  return <section className="agent-section"><h3><ChartNoAxesCombined size={17} /> {language === "fr" ? "Tableau de qualité Agent" : "Agent quality dashboard"}</h3><p className="form-note">{language === "fr" ? "Ces indicateurs sont calculés uniquement à partir d’événements AHC vérifiables. Ils ne sont ni des avis publics ni des notes inventées." : "These indicators use only verifiable AHC events. They are not public reviews or fabricated ratings."}</p><div className="identity-status-list">{metrics.map(([label, value]) => <span key={String(label)}><b>{value}</b> {label}</span>)}</div></section>;
}
