import { BellRing, CheckCircle2, LockKeyhole, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { marketplaceCopy, type PublicLanguage } from "@/lib/marketplaceLocale";
import "./seeker-match-alerts.css";

export function SeekerMatchAlerts({ isAuthenticated, language = "en" }: { isAuthenticated: boolean; language?: PublicLanguage }) {
  const labels = marketplaceCopy[language];
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<"Yaoundé" | "Douala">("Yaoundé");
  const [neighborhood, setNeighborhood] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [maxCash, setMaxCash] = useState("");
  const preferences = trpc.marketplace.matchAlerts.list.useQuery(undefined, { enabled: isAuthenticated });
  const deliveries = trpc.marketplace.matchAlerts.deliveries.useQuery(undefined, { enabled: isAuthenticated });
  const create = trpc.marketplace.matchAlerts.create.useMutation({
    onSuccess: () => { utils.marketplace.matchAlerts.list.invalidate(); utils.marketplace.matchAlerts.deliveries.invalidate(); setOpen(false); toast.success(labels.saveAlert, { description: labels.alertDialogBody }); },
    onError: error => toast.error(error.message),
  });
  const revoke = trpc.marketplace.matchAlerts.revoke.useMutation({ onSuccess: () => { utils.marketplace.matchAlerts.list.invalidate(); toast.success(`${labels.cancel} · ${labels.setAlert}`); } });
  if (!isAuthenticated) return <div className="alert-signin-note"><LockKeyhole size={15} /><span>{labels.alertSignin}</span></div>;
  const activeCount = preferences.data?.filter(item => item.active).length ?? 0;
  return <section className="match-alert-shell" aria-label={labels.setAlert}>
    <div className="match-alert-top"><div><span className="match-alert-kicker"><BellRing size={14} /> {labels.quietAlerts}</span><h2>{labels.alertHeading}</h2><p>{labels.alertBody}</p></div><button className="alert-launch" onClick={() => setOpen(true)}><MessageCircle size={16} /> {labels.setAlert}</button></div>
    <div className="alert-status-row"><span><CheckCircle2 size={14} /> {activeCount} {labels.activeAlerts}</span><span>{deliveries.data?.length ?? 0} {labels.matchingHomes}</span><b>{labels.providerPending}</b></div>
    {!!preferences.data?.length && <div className="alert-chips">{preferences.data.map(item => <span key={item.id} className={item.active ? "active" : "inactive"}>{item.city}{item.neighborhood ? ` · ${item.neighborhood}` : ""}{item.maxMonthlyRent ? ` · ≤ ${new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(item.maxMonthlyRent)} XAF/${labels.monthly}` : ""}<button disabled={!item.active || revoke.isPending} onClick={() => revoke.mutate({ preferenceId: item.id })} aria-label={`${labels.cancel} ${labels.setAlert}`}><X size={13} /></button></span>)}</div>}
    {open && <div className="alert-dialog-backdrop" onMouseDown={() => setOpen(false)}><form className="alert-dialog" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); create.mutate({ whatsappPhone: phone, city, neighborhood: neighborhood.trim() || undefined, minBedrooms: 0, maxMonthlyRent: maxRent ? Number(maxRent) : undefined, maxMoveInCash: maxCash ? Number(maxCash) : undefined }); }}><button className="alert-dialog-close" type="button" onClick={() => setOpen(false)} aria-label={labels.cancel}><X size={18} /></button><span className="match-alert-kicker"><BellRing size={14} /> {labels.optInOnly}</span><h3>{labels.silentAlert}</h3><p>{labels.alertDialogBody}</p><label>{labels.whatsappNumber}<input required value={phone} onChange={event => setPhone(event.target.value)} placeholder="6XX XXX XXX" /></label><div className="alert-two"><label>{labels.city}<select value={city} onChange={event => setCity(event.target.value as "Yaoundé" | "Douala")}><option>Yaoundé</option><option>Douala</option></select></label><label>{labels.neighborhoodOptional}<input value={neighborhood} onChange={event => setNeighborhood(event.target.value)} placeholder="Jouvence" /></label></div><div className="alert-two"><label>{labels.maxMonthly}<input type="number" min="1" value={maxRent} onChange={event => setMaxRent(event.target.value)} /></label><label>{labels.totalCash}<input type="number" min="1" value={maxCash} onChange={event => setMaxCash(event.target.value)} /></label></div><button className="alert-submit" disabled={create.isPending}>{create.isPending ? labels.savingConsent : labels.saveAlert}</button></form></div>}
  </section>;
}
