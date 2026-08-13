import { BellRing, CheckCircle2, LockKeyhole, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import "./seeker-match-alerts.css";

export function SeekerMatchAlerts({ isAuthenticated }: { isAuthenticated: boolean }) {
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
    onSuccess: () => { utils.marketplace.matchAlerts.list.invalidate(); utils.marketplace.matchAlerts.deliveries.invalidate(); setOpen(false); toast.success("Match alert saved", { description: "AHC will queue matching approved homes. WhatsApp delivery activates only after a verified Business provider is configured." }); },
    onError: error => toast.error(error.message),
  });
  const revoke = trpc.marketplace.matchAlerts.revoke.useMutation({ onSuccess: () => { utils.marketplace.matchAlerts.list.invalidate(); toast.success("Match alert stopped"); } });
  if (!isAuthenticated) return <div className="alert-signin-note"><LockKeyhole size={15} /><span>Open any listing and sign in to save a private WhatsApp match alert.</span></div>;
  const activeCount = preferences.data?.filter(item => item.active).length ?? 0;
  return <section className="match-alert-shell" aria-label="WhatsApp match alerts">
    <div className="match-alert-top"><div><span className="match-alert-kicker"><BellRing size={14} /> QUIET MATCH ALERTS</span><h2>Good homes should find you.</h2><p>Set your limits once. AHC evaluates newly moderator-approved homes against your opt-in criteria. Your number is never shown to agents or landlords.</p></div><button className="alert-launch" onClick={() => setOpen(true)}><MessageCircle size={16} /> Set a WhatsApp alert</button></div>
    <div className="alert-status-row"><span><CheckCircle2 size={14} /> {activeCount} active private alert{activeCount === 1 ? "" : "s"}</span><span>{deliveries.data?.length ?? 0} matching home{(deliveries.data?.length ?? 0) === 1 ? "" : "s"} queued in your history</span><b>Provider activation pending</b></div>
    {!!preferences.data?.length && <div className="alert-chips">{preferences.data.map(item => <span key={item.id} className={item.active ? "active" : "inactive"}>{item.city}{item.neighborhood ? ` · ${item.neighborhood}` : ""}{item.maxMonthlyRent ? ` · ≤ ${new Intl.NumberFormat("en-US").format(item.maxMonthlyRent)} XAF/mo` : ""}<button disabled={!item.active || revoke.isPending} onClick={() => revoke.mutate({ preferenceId: item.id })} aria-label="Stop this alert"><X size={13} /></button></span>)}</div>}
    {open && <div className="alert-dialog-backdrop" onMouseDown={() => setOpen(false)}><form className="alert-dialog" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); create.mutate({ whatsappPhone: phone, city, neighborhood: neighborhood.trim() || undefined, minBedrooms: 0, maxMonthlyRent: maxRent ? Number(maxRent) : undefined, maxMoveInCash: maxCash ? Number(maxCash) : undefined }); }}><button className="alert-dialog-close" type="button" onClick={() => setOpen(false)} aria-label="Close alert form"><X size={18} /></button><span className="match-alert-kicker"><BellRing size={14} /> OPT-IN ONLY</span><h3>Set a silent match alert</h3><p>AHC will match only newly moderator-approved listings. We will not sell or reveal this number to an Agent or Owner. Delivery will remain queued until an approved WhatsApp Business provider is live.</p><label>WhatsApp number<input required value={phone} onChange={event => setPhone(event.target.value)} placeholder="e.g. 6XX XXX XXX" /></label><div className="alert-two"><label>City<select value={city} onChange={event => setCity(event.target.value as "Yaoundé" | "Douala")}><option>Yaoundé</option><option>Douala</option></select></label><label>Neighbourhood (optional)<input value={neighborhood} onChange={event => setNeighborhood(event.target.value)} placeholder="e.g. Jouvence" /></label></div><div className="alert-two"><label>Max monthly rent (XAF)<input type="number" min="1" value={maxRent} onChange={event => setMaxRent(event.target.value)} /></label><label>Max move-in cash (XAF)<input type="number" min="1" value={maxCash} onChange={event => setMaxCash(event.target.value)} /></label></div><button className="alert-submit" disabled={create.isPending}>{create.isPending ? "Saving consent…" : "Save private alert"}</button></form></div>}
  </section>;
}
