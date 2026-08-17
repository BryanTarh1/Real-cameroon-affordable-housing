import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { daysUntilRefresh, formatReconfirmedDate } from "@/lib/listingFreshness";
import { AHC_PAID_OFFERS, calculateTotalMoveInCash, type PaidOfferType } from "@shared/ahc";
import { Banknote, Check, CircleAlert, Clock3, FilePlus2, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";
import { getAgentAccessUiState } from "./agent-access-ui";
import { AgentAccountPanel } from "./AgentAccountPanel";
import { AgentViewingConcierge } from "@/components/AgentViewingConcierge";
import { OfficialServiceReceipt } from "./OfficialServiceReceipt";

const formatXaf = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} XAF`;
const today = new Date().toISOString().slice(0, 10);
type OfferType = Extract<PaidOfferType, "welcome_bundle" | "starter_access" | "pro_access" | "featured_pin" | "physical_verification_route_batch" | "physical_verification_individual">;

const offerKeyByType = {
  welcome_bundle: "welcomeBundle",
  starter_access: "starterAccess",
  pro_access: "proAccess",
  featured_pin: "featuredPin",
  physical_verification_route_batch: "physicalVerificationRouteBatch",
  physical_verification_individual: "physicalVerificationIndividual",
} as const;

function Offer({ type, title, copy, onCreate, loading, disabled = false, detail }: { type: OfferType; title: string; copy: string; onCreate: (type: OfferType) => void; loading: boolean; disabled?: boolean; detail?: string }) {
  const key = offerKeyByType[type];
  const offer = AHC_PAID_OFFERS[key];
  return <article className="paid-offer"><span>{title}</span><b>{formatXaf(offer.amountXaf)}</b><small>{detail ?? `${offer.validityDays} days`}</small><p>{copy}</p><button className="button-secondary" disabled={loading || disabled} onClick={() => onCreate(type)}>{disabled ? "Available next month" : "Create order"}</button></article>;
}

export function PaidAgentPortal({ onClose }: { onClose: () => void }) {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.agent.profile.useQuery(undefined, { enabled: isAuthenticated });
  const paid = trpc.agent.paidStatus.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const identity = trpc.agent.identityStatus.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const orders = trpc.agent.paymentOrders.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const receipt = trpc.agent.officialServiceReceipt.useQuery({ orderId: receiptOrderId ?? "" }, { enabled: isAuthenticated && Boolean(profile.data) && Boolean(receiptOrderId) });
  const listings = trpc.agent.listings.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const setup = trpc.agent.setupProfile.useMutation({ onSuccess: () => { utils.agent.profile.invalidate(); toast.success("Agent profile saved", { description: "Purchase Agent Access to submit commercial inventory." }); } });
  const createOrder = trpc.agent.createPaymentOrder.useMutation({ onSuccess: order => { setPendingOrder(order); utils.agent.paymentOrders.invalidate(); toast.success("Payment order created", { description: `${order.id}: payment must be reconciled by operations.` }); } });
  const submitReference = trpc.agent.submitPaymentReference.useMutation({ onSuccess: () => { setPendingOrder(null); utils.agent.paymentOrders.invalidate(); toast.success("Payment reference submitted", { description: "Access stays inactive until AHC operations confirms it." }); } });
  const submitListing = trpc.agent.submitListing.useMutation({ onSuccess: listing => { utils.agent.listings.invalidate(); utils.agent.paidStatus.invalidate(); toast.success("Listing sent to review", { description: `${listing.id} will not be public until a moderator approves it.` }); } });
  const reconfirm = trpc.agent.reconfirm.useMutation({ onSuccess: () => { utils.agent.listings.invalidate(); utils.marketplace.search.invalidate(); toast.success("Availability reconfirmed for 14 days"); } });
  const [profileForm, setProfileForm] = useState({ publicName: "", agencyName: "", whatsappPhone: "" });
  const [pendingOrder, setPendingOrder] = useState<{ id: string; amountXaf: number; type: PaidOfferType } | null>(null);
  const [provider, setProvider] = useState<"mtn_momo" | "orange_money" | "other">("mtn_momo");
  const [reference, setReference] = useState("");
  const [uploadingIdentity, setUploadingIdentity] = useState<"front" | "back" | "face" | null>(null);
  const [form, setForm] = useState({ title: "", city: "Yaoundé" as "Yaoundé" | "Douala", neighborhood: "", landmark: "", propertyType: "Studio", availableFrom: today, landmarkLatitude: 3.848, landmarkLongitude: 11.502, mapRadiusM: 300, monthlyRent: 0, advanceMonths: 1, securityDeposit: 0, agencyFee: 0, serviceFee: 0, firstMonthUtilities: 0 });
  const total = calculateTotalMoveInCash(form); const active = paid.data?.access?.active ?? false; const credits = paid.data?.availableCredits ?? 0;
  const isPro = profile.data?.subscriptionTier === "agency";
  const activeListingCount = paid.data?.activeListingCount ?? 0;
  const activeListingLimit = paid.data?.activeListingLimit ?? null;
  const canSubmitListing = active && (isPro ? activeListingCount < (activeListingLimit ?? 20) : credits > 0);
  const hasPriorPaidAccess = orders.data?.some(order => order.status === "confirmed" && ["agent_access", "welcome_bundle", "starter_access", "pro_access"].includes(order.type)) ?? false;
  const welcomeMonthStillActive = active && profile.data?.subscriptionTier === "access" && Boolean(profile.data?.welcomeBundleUsedAt);
  const renewalOrderType: OfferType = isPro ? "pro_access" : hasPriorPaidAccess ? "starter_access" : "welcome_bundle";
  const daysRemaining = paid.data?.access?.daysRemaining ?? 0;
  const accessUi = getAgentAccessUiState({
    active,
    daysRemaining,
    renewalRecommended: paid.data?.access?.renewalRecommended ?? false,
    suspensionReason: paid.data?.access?.suspensionReason ?? null,
  });
  const updateCity = (city: "Yaoundé" | "Douala") => setForm(value => ({ ...value, city, landmarkLatitude: city === "Yaoundé" ? 3.848 : 4.0511, landmarkLongitude: city === "Yaoundé" ? 11.502 : 9.7679 }));
  const newOrder = (type: OfferType, listingId?: string) => createOrder.mutate({ type, listingId });
  const uploadIdentity = async (kind: "front" | "back" | "face", file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg)$/i.test(file.type) || !file.name.toLowerCase().endsWith(".jpg")) {
      toast.error("JPG files only", { description: "Choose a normal .jpg government ID image." });
      return;
    }
    setUploadingIdentity(kind);
    try {
      const response = await fetch(`/api/agent/identity-document?kind=${kind}`, { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: file });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "Upload failed");
      await identity.refetch();
      toast.success(`${kind === "face" ? "Face view" : `ID ${kind}`} uploaded`);
    } catch (error) {
      toast.error("Identity upload failed", { description: error instanceof Error ? error.message : "Try again with a JPG image." });
    } finally {
      setUploadingIdentity(null);
    }
  };

  if (loading) return <div className="agent-drawer"><span>Loading secure agent workspace…</span></div>;
  if (!isAuthenticated) return <div className="agent-drawer scroll"><button className="drawer-close" onClick={onClose}><X size={19} /></button><span className="section-overline">Paid agent workspace</span><h2>Professional supply begins with a clear plan.</h2><p>Renters search and make first contact free of charge. New Agents start with five listing credits for 3,000 XAF; after the first month, choose Starter or Pro before commercial inventory enters review.</p><AgentAccountPanel /><div className="agent-benefits"><span><Check size={16} /> 3,000 XAF Welcome Bundle · five listing credits</span><span><Check size={16} /> 10,000 XAF Starter or 25,000 XAF Pro from month two</span><span><Check size={16} /> Field Moderator approval before publication</span></div></div>;
  if (profile.isLoading) return <div className="agent-drawer"><span>Preparing workspace…</span></div>;
  if (!profile.data) return <div className="agent-drawer scroll"><button className="drawer-close" onClick={onClose}><X size={19} /></button><span className="section-overline">Step 1 / Agent identity</span><h2>Set the WhatsApp route prospects will use.</h2><p>A profile is required before paid access. No property appears publicly until payment, review, and approval are complete.</p><form className="agent-form" onSubmit={event => { event.preventDefault(); setup.mutate(profileForm); }}><label>Public agent name<input required value={profileForm.publicName} onChange={e => setProfileForm({ ...profileForm, publicName: e.target.value })} /></label><label>Agency name <small>(optional)</small><input value={profileForm.agencyName} onChange={e => setProfileForm({ ...profileForm, agencyName: e.target.value })} /></label><label>WhatsApp mobile number<input required value={profileForm.whatsappPhone} onChange={e => setProfileForm({ ...profileForm, whatsappPhone: e.target.value })} placeholder="+237 6XX XXX XXX" /></label><button className="button-primary full-width" disabled={setup.isPending}>{setup.isPending ? "Saving…" : "Save agent profile"}</button></form></div>;
	  return <div className="agent-drawer scroll"><button className="drawer-close" onClick={onClose}><X size={19} /></button><span className="section-overline">Paid agent workspace</span><h2>Hello, {profile.data.publicName}.</h2><section className="agent-section identity-section"><h3>Profile & identity status</h3><p className="form-note">Your taxpayer number is stored as private onboarding data. Upload clear JPG photos of the same government ID: front, back, and a face view holding the document. These files are for AHC review only and are never shown on public listing cards.</p><div className="identity-grid"><label>Taxpayer number<input value={identity.data?.taxpayerNumberPresent ? "Saved privately" : "Not submitted yet"} readOnly /></label><div className="identity-status-list"><span className={identity.data?.idFrontUploaded ? "is-complete" : ""}>ID front {identity.data?.idFrontUploaded ? "uploaded" : "pending"}</span><span className={identity.data?.idBackUploaded ? "is-complete" : ""}>ID back {identity.data?.idBackUploaded ? "uploaded" : "pending"}</span><span className={identity.data?.idFaceUploaded ? "is-complete" : ""}>Face view {identity.data?.idFaceUploaded ? "uploaded" : "pending"}</span></div></div><div className="identity-upload-grid">{(["front", "back", "face"] as const).map(kind => <label key={kind} className="identity-upload">{kind === "face" ? "Face view JPG" : `Government ID ${kind} JPG`}<input type="file" accept=".jpg,image/jpeg" disabled={Boolean(uploadingIdentity)} onChange={event => { void uploadIdentity(kind, event.target.files?.[0]); event.currentTarget.value = ""; }} /><small>{uploadingIdentity === kind ? "Uploading securely…" : "Choose JPG"}</small></label>)}</div></section><div className="tier-bar"><span><b>{isPro ? "Pro Access" : profile.data.welcomeBundleUsedAt ? "Starter / Welcome Access" : accessUi.label}</b></span><span>{isPro ? `${activeListingCount} / ${activeListingLimit ?? 20} active listings` : `${credits} listing credit${credits === 1 ? "" : "s"}`}</span></div>
	    {accessUi.notice && <div className="gated-note"><CircleAlert size={16} /> {accessUi.notice} {accessUi.renewalCta && <button onClick={() => newOrder(renewalOrderType)}>{accessUi.renewalCta}</button>}</div>}
	    {pendingOrder && <section className="payment-reference"><span className="section-overline">Payment / {pendingOrder.id}</span><h3>Pay {formatXaf(pendingOrder.amountXaf)}, then submit the reference.</h3><p>Use only AHC’s official merchant instructions. This order is only for AHC Agent plans, featured placement, or field verification. AHC never accepts or holds rent, deposits, viewing money, or owner/tenant settlement funds.</p><form className="agent-form" onSubmit={event => { event.preventDefault(); submitReference.mutate({ orderId: pendingOrder.id, provider, reference }); }}><label>Payment rail<select value={provider} onChange={event => setProvider(event.target.value as typeof provider)}><option value="mtn_momo">MTN MoMo</option><option value="orange_money">Orange Money</option><option value="other">Other approved rail</option></select></label><label>Provider transaction reference<input required minLength={4} value={reference} onChange={event => setReference(event.target.value)} placeholder="Paste the payment confirmation reference" /></label><button className="button-primary full-width" disabled={submitReference.isPending}>{submitReference.isPending ? "Sending…" : "Send for Admin reconciliation"}</button></form></section>}
	    <section className="agent-section paid-entry"><h3><Banknote size={17} /> Paid access, before review</h3><p>Every commercial listing begins with a paid plan. An AHC Admin must confirm the payment reference before any access, listing credit, badge, or visibility benefit changes.</p><div className="paid-offer-grid">{!hasPriorPaidAccess && <Offer type="welcome_bundle" title="New-Agent Welcome Bundle" detail="First paid month · five listing credits · no priority" copy="Start with standard Agent access and five moderated property submissions." onCreate={newOrder} loading={createOrder.isPending} />}{hasPriorPaidAccess && <Offer type="starter_access" title="Starter" detail="30 days · five listing credits · standard ranking" copy="Continue after your first month with five fresh listing credits." onCreate={newOrder} loading={createOrder.isPending} disabled={welcomeMonthStillActive} />}<Offer type="pro_access" title="Pro" detail="30 days · priority ranking · up to 20 active listings" copy="Use priority marketplace ranking with fair-use inventory capacity instead of individual credits." onCreate={newOrder} loading={createOrder.isPending} disabled={welcomeMonthStillActive} /></div></section>
	    <AgentViewingConcierge />
	    <section className="agent-section"><h3><FilePlus2 size={17} /> Add a transparent listing</h3><p className="form-note">Active Welcome or Starter access needs one of its five listing credits. Active Pro Access permits up to 20 active listings. AHC uses your landmark only and shifts its public map point by 200–500m.</p>{!canSubmitListing && <div className="gated-note"><CircleAlert size={16} /> {!active ? "Reconciled Welcome, Starter, or Pro Access is required." : isPro ? "Your Pro active-listing limit has been reached." : "Use an available Welcome or Starter listing credit."}</div>}<form className="agent-form listing-form" onSubmit={event => { event.preventDefault(); submitListing.mutate({ title: form.title, city: form.city, neighborhood: form.neighborhood, landmark: form.landmark, propertyType: form.propertyType, availableFrom: form.availableFrom, landmarkLatitude: form.landmarkLatitude, landmarkLongitude: form.landmarkLongitude, mapRadiusM: form.mapRadiusM, costs: { monthlyRent: form.monthlyRent, advanceMonths: form.advanceMonths, securityDeposit: form.securityDeposit, agencyFee: form.agencyFee, serviceFee: form.serviceFee, firstMonthUtilities: form.firstMonthUtilities } }); }}><label>Listing title<input required minLength={8} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. One-bedroom near Bonamoussadi" /></label><div className="two-fields"><label>City<select value={form.city} onChange={e => updateCity(e.target.value as "Yaoundé" | "Douala")}><option>Yaoundé</option><option>Douala</option></select></label><label>Home type<select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })}><option>Studio</option><option>Room</option><option>One-bedroom</option><option>Two-bedroom</option><option>Family home</option></select></label></div><label>Neighborhood<input required value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></label><label>Public landmark<input required minLength={5} value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder="e.g. near Carrefour Mvog-Mbi" /></label><div className="two-fields"><label>Available from<input type="date" min={today} value={form.availableFrom} onChange={e => setForm({ ...form, availableFrom: e.target.value })} /></label><label>Privacy radius<select value={form.mapRadiusM} onChange={e => setForm({ ...form, mapRadiusM: Number(e.target.value) })}><option value={200}>200m</option><option value={300}>300m</option><option value={500}>500m</option></select></label></div><div className="cost-editor"><div><span>Cost declaration</span><b>{formatXaf(total)} total move-in</b></div><label>Monthly rent<input type="number" min="1" required value={form.monthlyRent || ""} onChange={e => setForm({ ...form, monthlyRent: Number(e.target.value) })} /></label><label>Advance months<input type="number" min="1" max="12" required value={form.advanceMonths} onChange={e => setForm({ ...form, advanceMonths: Number(e.target.value) })} /></label><label>Security deposit<input type="number" min="0" required value={form.securityDeposit || ""} onChange={e => setForm({ ...form, securityDeposit: Number(e.target.value) })} /></label><label>Agency fee<input type="number" min="0" required value={form.agencyFee || ""} onChange={e => setForm({ ...form, agencyFee: Number(e.target.value) })} /></label><label>Service fee<input type="number" min="0" required value={form.serviceFee || ""} onChange={e => setForm({ ...form, serviceFee: Number(e.target.value) })} /></label><label>First-month utilities<input type="number" min="0" required value={form.firstMonthUtilities || ""} onChange={e => setForm({ ...form, firstMonthUtilities: Number(e.target.value) })} /></label></div><button className="button-primary full-width" disabled={!canSubmitListing || submitListing.isPending}>{submitListing.isPending ? "Submitting…" : isPro ? "Submit under Pro Access" : "Use listing credit and send to review"}</button></form></section>
    <section className="agent-section"><h3><ReceiptText size={17} /> Orders and your inventory</h3><p className="form-note">Only a receipt issued after AHC Admin confirmation proves an AHC platform fee. Do not send platform fees to an Agent, Owner, or unofficial number.</p>{orders.data?.length ? <div className="order-list">{orders.data.slice(0, 5).map(order => <div key={order.id}><span><b>{order.type.replaceAll("_", " ")}</b><small>{order.id}{order.officialReceiptCode ? ` · Official receipt: ${order.officialReceiptCode}` : ""}</small></span><div className="agent-order-actions"><span className={`order-status ${order.status}`}>{order.status.replaceAll("_", " ")}</span>{order.officialReceiptCode && <button className="text-button" type="button" onClick={() => setReceiptOrderId(order.id)}>Print receipt</button>}</div></div>)}</div> : <p className="muted">No paid orders yet.</p>}{listings.data?.length ? <div className="agent-list">{listings.data.map(listing => {
	      const freshnessDays = daysUntilRefresh(listing.lastReconfirmed);
	      const freshnessLabel = freshnessDays === 0 ? "Refresh now" : `${freshnessDays} day${freshnessDays === 1 ? "" : "s"} remaining`;
		      return <div key={listing.id}><div className="agent-list-copy"><b>{listing.title}</b><span>{listing.status.replaceAll("_", " ")} · {formatXaf(listing.costs.totalMoveInCashRequired)}</span><p className="agent-list-freshness"><Clock3 size={13} aria-hidden="true" /><span>Reconfirmed {formatReconfirmedDate(listing.lastReconfirmed)} · {freshnessLabel}</span></p></div><div className="agent-list-actions">{["published", "needs_reconfirmation"].includes(listing.status) && <button disabled={!active || reconfirm.isPending} onClick={() => reconfirm.mutate({ listingId: listing.id })}>{active ? "Reconfirm" : "Renew to reconfirm"}</button>}{listing.status === "published" && <><button onClick={() => newOrder("featured_pin", listing.id)}>Feature 7 days · 2,500 XAF</button><button onClick={() => newOrder("physical_verification_route_batch", listing.id)}>Route-batch verify · 5,000 XAF</button><button onClick={() => newOrder("physical_verification_individual", listing.id)}>Individual verify · 7,500 XAF</button></>}</div></div>;
	    })}</div> : <p className="muted">No listings yet.</p>}</section>
    {receipt.data && <OfficialServiceReceipt receipt={receipt.data} onClose={() => setReceiptOrderId(null)} />}
  </div>;
}
