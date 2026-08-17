import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { PublicLanguage } from "@/lib/marketplaceLocale";

type Costs = { monthlyRent: number; advanceMonths: number; securityDeposit: number; agencyFee: number; serviceFee: number; firstMonthUtilities: number };

export function CostDisclosureForm({ listing, language, onSaved }: { listing: { id: string; title: string; costs: Costs }; language: PublicLanguage; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [costs, setCosts] = useState(listing.costs);
  const updateCosts = trpc.agent.updateCosts.useMutation({ onSuccess: () => { setOpen(false); setChangeReason(""); onSaved(); toast.success(language === "fr" ? "Changement de coût divulgué" : "Cost change disclosed"); }, onError: error => toast.error(language === "fr" ? "Impossible de mettre à jour les coûts" : "Unable to update costs", { description: error.message }) });
  if (!open) return <button className="text-button" type="button" onClick={() => setOpen(true)}>{language === "fr" ? "Modifier avec divulgation" : "Change with disclosure"}</button>;
  const fields: Array<[keyof Costs, string]> = [["monthlyRent", language === "fr" ? "Loyer mensuel" : "Monthly rent"], ["advanceMonths", language === "fr" ? "Mois d’avance" : "Advance months"], ["securityDeposit", language === "fr" ? "Caution" : "Security deposit"], ["agencyFee", language === "fr" ? "Frais d’agence" : "Agency fee"], ["serviceFee", language === "fr" ? "Frais de service" : "Service fee"], ["firstMonthUtilities", language === "fr" ? "Services du premier mois" : "First-month utilities"]];
  return <form className="agent-form" onSubmit={event => { event.preventDefault(); updateCosts.mutate({ listingId: listing.id, costs, changeReason }); }}><p className="form-note">{language === "fr" ? `Toute modification de « ${listing.title} » sera datée et visible aux chercheurs connectés avec votre raison.` : `Every change to “${listing.title}” is dated and shown to signed-in seekers with your reason.`}</p><div className="cost-editor">{fields.map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={costs[key]} onChange={event => setCosts(current => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}</div><label>{language === "fr" ? "Pourquoi le coût a-t-il changé ?" : "Why did the cost change?"}<textarea required minLength={6} maxLength={500} value={changeReason} onChange={event => setChangeReason(event.target.value)} /></label><div className="agent-list-actions"><button className="button-secondary" disabled={updateCosts.isPending}>{language === "fr" ? "Enregistrer la divulgation" : "Save disclosure"}</button><button className="text-button" type="button" onClick={() => setOpen(false)}>{language === "fr" ? "Annuler" : "Cancel"}</button></div></form>;
}
