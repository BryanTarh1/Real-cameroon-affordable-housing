import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { daysUntilRefresh, formatReconfirmedDate } from "@/lib/listingFreshness";
import { AHC_PAID_OFFERS, calculateTotalMoveInCash, type PaidOfferType } from "@shared/ahc";
import { Banknote, ChartNoAxesCombined, Check, CircleAlert, Clock3, FilePlus2, LoaderCircle, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";
import { getAgentAccessUiState } from "./agent-access-ui";
import { AgentAccountPanel } from "./AgentAccountPanel";
import { AgentViewingConcierge } from "@/components/AgentViewingConcierge";
import { AgentQualityDashboard } from "@/components/AgentQualityDashboard";
import { CostDisclosureForm } from "@/components/CostDisclosureForm";
import { OfficialServiceReceipt } from "./OfficialServiceReceipt";
import { agentText, interpolateAgent } from "@/lib/agentWorkspaceLocale";
import { useMarketplaceLanguage } from "@/hooks/useMarketplaceLanguage";
import "./payment-workflow.css";

const formatXaf = (value: number, language: "en" | "fr" = "en") => `${new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(value)} XAF`;
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

function Offer({ type, title, copy, onCreate, loading, disabled = false, detail, createLabel, unavailableLabel }: { type: OfferType; title: string; copy: string; onCreate: (type: OfferType) => void; loading: boolean; disabled?: boolean; detail?: string; createLabel: string; unavailableLabel: string }) {
  const key = offerKeyByType[type];
  const offer = AHC_PAID_OFFERS[key];
  return <article className="paid-offer"><span>{title}</span><b>{formatXaf(offer.amountXaf)}</b><small>{detail ?? `${offer.validityDays} days`}</small><p>{copy}</p><button className="button-secondary" disabled={loading || disabled} aria-busy={loading} onClick={() => onCreate(type)}>{loading ? <><LoaderCircle className="inline animate-spin" size={15} /> Preparing order…</> : disabled ? unavailableLabel : createLabel}</button></article>;
}

export function PaidAgentPortal({ onClose }: { onClose: () => void }) {
  const { language, setLanguage, isLanguageTransitioning } = useMarketplaceLanguage();
  const copy = (key: Parameters<typeof agentText>[1]) => agentText(language, key);
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const profile = trpc.agent.profile.useQuery(undefined, { enabled: isAuthenticated });
  const paid = trpc.agent.paidStatus.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const identity = trpc.agent.identityStatus.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const orders = trpc.agent.paymentOrders.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const receipt = trpc.agent.officialServiceReceipt.useQuery({ orderId: receiptOrderId ?? "" }, { enabled: isAuthenticated && Boolean(profile.data) && Boolean(receiptOrderId) });
  const listings = trpc.agent.listings.useQuery(undefined, { enabled: isAuthenticated && Boolean(profile.data) });
  const setup = trpc.agent.setupProfile.useMutation({ onSuccess: () => { utils.agent.profile.invalidate(); toast.success("Agent profile saved", { description: "Purchase Agent Access to submit commercial inventory." }); }, onError: error => toast.error("We could not save your Agent profile", { description: error.message || "Please review the details and try again." }) });
  const createOrder = trpc.agent.createPaymentOrder.useMutation({ onSuccess: order => { setPendingOrder(order); utils.agent.paymentOrders.invalidate(); toast.success("Payment order created", { description: `${order.id}: payment must be reconciled by operations.` }); }, onError: error => toast.error("We could not create your payment order", { description: error.message || "Please refresh and try again. No payment was taken." }) });
  const submitReference = trpc.agent.submitPaymentReference.useMutation({ onSuccess: () => { setPendingOrder(null); utils.agent.paymentOrders.invalidate(); toast.success("Payment reference submitted", { description: "Access stays inactive until AHC operations confirms it." }); }, onError: error => toast.error("We could not submit that payment reference", { description: error.message || "Check the provider and reference, then try again. No access has been changed." }) });
  const submitListing = trpc.agent.submitListing.useMutation({ onSuccess: listing => { utils.agent.listings.invalidate(); utils.agent.paidStatus.invalidate(); toast.success("Listing sent to review", { description: `${listing.id} will not be public until a moderator approves it.` }); } });
  const reconfirm = trpc.agent.reconfirm.useMutation({ onSuccess: () => { utils.agent.listings.invalidate(); utils.marketplace.search.invalidate(); toast.success("Availability reconfirmed for 14 days"); } });
  const [profileForm, setProfileForm] = useState({ publicName: "", agencyName: "", whatsappPhone: "" });
  const [pendingOrder, setPendingOrder] = useState<{ id: string; amountXaf: number; type: PaidOfferType } | null>(null);
  const [provider, setProvider] = useState<"mtn_momo" | "orange_money">("mtn_momo");
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
  }, language);
  const updateCity = (city: "Yaoundé" | "Douala") => setForm(value => ({ ...value, city, landmarkLatitude: city === "Yaoundé" ? 3.848 : 4.0511, landmarkLongitude: city === "Yaoundé" ? 11.502 : 9.7679 }));
  const formatLocalizedXaf = (amount: number) => new Intl.NumberFormat(language === "fr" ? "fr-CM" : "en-CM", { maximumFractionDigits: 0 }).format(amount) + " XAF";
  const formatLocalizedDate = (value: Date | string) => new Intl.DateTimeFormat(language === "fr" ? "fr-CM" : "en-CM", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  const localizedStatus = (status: string) => {
    const labels: Record<string, string> = language === "fr"
      ? { published: "publiée", needs_reconfirmation: "à reconfirmer", under_review: "en contrôle", pending_payment: "paiement en attente", submitted: "soumise", confirmed: "confirmée", rejected: "refusée", cancelled: "annulée", expired: "expirée" }
      : { published: "published", needs_reconfirmation: "needs reconfirmation", under_review: "under review", pending_payment: "pending payment", submitted: "submitted", confirmed: "confirmed", rejected: "rejected", cancelled: "cancelled", expired: "expired" };
    return labels[status] ?? status.replaceAll("_", " ");
  };
  const localizedProvider = (value: string | null | undefined) => value === "mtn_momo" ? copy("mtnMomo") : value === "orange_money" ? copy("orangeMoney") : "";
  const newOrder = (type: OfferType, listingId?: string) => createOrder.mutate({ type, listingId });
  const uploadIdentity = async (kind: "front" | "back" | "face", file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(jpeg|jpg)$/i.test(file.type) || !file.name.toLowerCase().endsWith(".jpg")) {
      toast.error(copy("jpgOnly"), { description: copy("jpgOnlyNote") });
      return;
    }
    setUploadingIdentity(kind);
    try {
      const response = await fetch(`/api/agent/identity-document?kind=${kind}`, { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: file });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "Upload failed");
      await identity.refetch();
      toast.success(interpolateAgent(copy("uploadedTitle"), { item: kind === "face" ? copy("faceView") : `${copy("idFront").replace(" front", "")} ${kind}` }));
    } catch (error) {
      toast.error(copy("identityUploadFailed"), { description: error instanceof Error ? error.message : copy("tryJpg") });
    } finally {
      setUploadingIdentity(null);
    }
  };

  const languageControl = <select className="language-select agent-language-select" value={language} onChange={event => setLanguage(event.target.value as typeof language)} aria-label={language === "fr" ? "Choisir la langue" : "Select language"}><option value="en">English</option><option value="fr">Français</option></select>;
  if (loading) return <div className="agent-drawer"><span>{copy("loading")}</span></div>;
  if (!isAuthenticated) return <div className={`agent-drawer scroll language-transition ${isLanguageTransitioning ? "is-switching-language" : ""}`}><button className="drawer-close" onClick={onClose}><X size={19} /></button>{languageControl}<span className="section-overline">{copy("workspace")}</span><h2>{copy("signInTitle")}</h2><p>{copy("signInBody")}</p><AgentAccountPanel /><div className="agent-benefits"><span><Check size={16} /> {copy("welcomeCredits")}</span><span><Check size={16} /> {copy("monthTwo")}</span><span><Check size={16} /> {copy("moderatorApproval")}</span></div></div>;
  if (profile.isLoading) return <div className="agent-drawer"><span>{copy("preparing")}</span></div>;
  if (!profile.data) return <div className={`agent-drawer scroll language-transition ${isLanguageTransitioning ? "is-switching-language" : ""}`}><button className="drawer-close" onClick={onClose}><X size={19} /></button>{languageControl}<span className="section-overline">{copy("identityStep")}</span><h2>{copy("identityTitle")}</h2><p>{copy("identityBody")}</p><form className="agent-form" onSubmit={event => { event.preventDefault(); setup.mutate(profileForm); }}><label>{copy("publicName")}<input required value={profileForm.publicName} onChange={e => setProfileForm({ ...profileForm, publicName: e.target.value })} /></label><label>{copy("agencyName")} <small>({copy("optional")})</small><input value={profileForm.agencyName} onChange={e => setProfileForm({ ...profileForm, agencyName: e.target.value })} /></label><label>{copy("whatsapp")}<input required value={profileForm.whatsappPhone} onChange={e => setProfileForm({ ...profileForm, whatsappPhone: e.target.value })} placeholder="+237 6XX XXX XXX" /></label><button className="button-primary full-width" disabled={setup.isPending}>{setup.isPending ? copy("saving") : copy("saveProfile")}</button></form></div>;
	  return <div className={`agent-drawer scroll agent-language-content language-transition ${isLanguageTransitioning ? "is-switching-language" : ""}`}><button className="drawer-close" onClick={onClose}><X size={19} /></button>{languageControl}<span className="section-overline">{copy("workspace")}</span><h2>{interpolateAgent(copy("hello"), { name: profile.data.publicName })}</h2><section className="agent-section identity-section"><h3>{copy("profileIdentity")}</h3><p className="form-note">{copy("identityNote")}</p><div className="identity-grid"><label>{copy("taxpayer")}<input value={identity.data?.taxpayerNumberPresent ? copy("storedPrivate") : copy("notSubmitted")} readOnly /></label><div className="identity-status-list"><span className={identity.data?.idFrontUploaded ? "is-complete" : ""}>{copy("idFront")} {identity.data?.idFrontUploaded ? copy("uploaded") : copy("pending")}</span><span className={identity.data?.idBackUploaded ? "is-complete" : ""}>{copy("idBack")} {identity.data?.idBackUploaded ? copy("uploaded") : copy("pending")}</span><span className={identity.data?.idFaceUploaded ? "is-complete" : ""}>{copy("faceView")} {identity.data?.idFaceUploaded ? copy("uploaded") : copy("pending")}</span></div></div><div className="identity-upload-grid">{(["front", "back", "face"] as const).map(kind => <label key={kind} className="identity-upload">{kind === "face" ? copy("faceJpg") : kind === "front" ? copy("idFrontJpg") : copy("idBackJpg")}<input type="file" accept=".jpg,image/jpeg" disabled={Boolean(uploadingIdentity)} onChange={event => { void uploadIdentity(kind, event.target.files?.[0]); event.currentTarget.value = ""; }} /><small>{uploadingIdentity === kind ? copy("uploading") : copy("chooseJpg")}</small></label>)}</div></section><div className="tier-bar"><span><b>{isPro ? copy("proAccess") : profile.data.welcomeBundleUsedAt ? copy("starterWelcome") : accessUi.label}</b></span><span>{isPro ? interpolateAgent(copy("activeListings"), { count: activeListingCount, limit: activeListingLimit ?? 20 }) : interpolateAgent(copy("listingCredits"), { count: credits, plural: credits === 1 ? "" : "s" })}</span></div>
		    {accessUi.notice && <div className="gated-note"><CircleAlert size={16} /> {accessUi.notice} {accessUi.renewalCta && <button onClick={() => newOrder(renewalOrderType)}>{accessUi.renewalCta}</button>}</div>}
	    {pendingOrder && <section className="payment-reference"><span className="section-overline">{interpolateAgent(copy("payment"), { id: pendingOrder.id })}</span><h3>{interpolateAgent(copy("payThenReference"), { amount: formatLocalizedXaf(pendingOrder.amountXaf) })}</h3><p>{copy("paymentBody")}</p><form className="agent-form" onSubmit={event => { event.preventDefault(); submitReference.mutate({ orderId: pendingOrder.id, provider, reference }); }}><label>{copy("paymentRail")}<select value={provider} onChange={event => setProvider(event.target.value as typeof provider)}><option value="mtn_momo">{copy("mtnMomo")}</option><option value="orange_money">{copy("orangeMoney")}</option></select></label><div className="payment-provider-guidance" role="status"><b>{localizedProvider(provider)}</b><p>{provider === "mtn_momo" ? copy("mtnPaymentGuide") : copy("orangePaymentGuide")}</p><ol><li>{copy("paymentStepPay")}</li><li>{copy("paymentStepReference")}</li><li>{copy("paymentStepReview")}</li></ol><small>{copy("paymentGuard")}</small></div><label>{copy("transactionReference")}<input required minLength={6} value={reference} onChange={event => setReference(event.target.value)} placeholder={copy("referencePlaceholder")} /></label><button className="button-primary full-width" disabled={submitReference.isPending}>{submitReference.isPending ? copy("sending") : copy("sendReconciliation")}</button></form></section>}
	    <section className="agent-section paid-entry"><h3><Banknote size={17} /> {copy("paidAccess")}</h3><p>{copy("paidAccessBody")}</p><div className="paid-offer-grid">{!hasPriorPaidAccess && <Offer type="welcome_bundle" title={copy("welcomeBundle")} detail={copy("welcomeDetail")} copy={copy("welcomeCopy")} onCreate={newOrder} loading={createOrder.isPending} createLabel={copy("createOrder")} unavailableLabel={copy("availableNextMonth")} />}{hasPriorPaidAccess && <Offer type="starter_access" title={copy("starter")} detail={copy("starterDetail")} copy={copy("starterCopy")} onCreate={newOrder} loading={createOrder.isPending} disabled={welcomeMonthStillActive} createLabel={copy("createOrder")} unavailableLabel={copy("availableNextMonth")} />}<Offer type="pro_access" title={copy("pro")} detail={copy("proDetail")} copy={copy("proCopy")} onCreate={newOrder} loading={createOrder.isPending} disabled={welcomeMonthStillActive} createLabel={copy("createOrder")} unavailableLabel={copy("availableNextMonth")} /></div></section>
	    <AgentViewingConcierge language={language} />
	    <AgentQualityDashboard language={language} />
	    <section className="agent-section"><h3><FilePlus2 size={17} /> {copy("addListing")}</h3><p className="form-note">{copy("listingBody")}</p>{!canSubmitListing && <div className="gated-note"><CircleAlert size={16} /> {!active ? copy("accessRequired") : isPro ? copy("proLimit") : copy("creditRequired")}</div>}<form className="agent-form listing-form" onSubmit={event => { event.preventDefault(); submitListing.mutate({ title: form.title, city: form.city, neighborhood: form.neighborhood, landmark: form.landmark, propertyType: form.propertyType, availableFrom: form.availableFrom, landmarkLatitude: form.landmarkLatitude, landmarkLongitude: form.landmarkLongitude, mapRadiusM: form.mapRadiusM, costs: { monthlyRent: form.monthlyRent, advanceMonths: form.advanceMonths, securityDeposit: form.securityDeposit, agencyFee: form.agencyFee, serviceFee: form.serviceFee, firstMonthUtilities: form.firstMonthUtilities } }); }}><label>{copy("listingTitle")}<input required minLength={8} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={copy("listingPlaceholder")} /></label><div className="two-fields"><label>{copy("city")}<select value={form.city} onChange={e => updateCity(e.target.value as "Yaoundé" | "Douala")}><option>Yaoundé</option><option>Douala</option></select></label><label>{copy("homeType")}<select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })}><option>Studio</option><option>{language === "fr" ? "Chambre" : "Room"}</option><option>{language === "fr" ? "Une chambre" : "One-bedroom"}</option><option>{language === "fr" ? "Deux chambres" : "Two-bedroom"}</option><option>{language === "fr" ? "Maison familiale" : "Family home"}</option></select></label></div><label>{copy("neighborhood")}<input required value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} /></label><label>{copy("publicLandmark")}<input required minLength={5} value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })} placeholder={copy("landmarkPlaceholder")} /></label><div className="two-fields"><label>{copy("availableFrom")}<input type="date" min={today} value={form.availableFrom} onChange={e => setForm({ ...form, availableFrom: e.target.value })} /></label><label>{copy("privacyRadius")}<select value={form.mapRadiusM} onChange={e => setForm({ ...form, mapRadiusM: Number(e.target.value) })}><option value={200}>200m</option><option value={300}>300m</option><option value={500}>500m</option></select></label></div><div className="cost-editor"><div><span>{copy("costDeclaration")}</span><b>{interpolateAgent(copy("totalMoveIn"), { amount: formatLocalizedXaf(total) })}</b></div><label>{copy("monthlyRent")}<input type="number" min="1" required value={form.monthlyRent || ""} onChange={e => setForm({ ...form, monthlyRent: Number(e.target.value) })} /></label><label>{copy("advanceMonths")}<input type="number" min="1" max="12" required value={form.advanceMonths} onChange={e => setForm({ ...form, advanceMonths: Number(e.target.value) })} /></label><label>{copy("securityDeposit")}<input type="number" min="0" required value={form.securityDeposit || ""} onChange={e => setForm({ ...form, securityDeposit: Number(e.target.value) })} /></label><label>{copy("agencyFee")}<input type="number" min="0" required value={form.agencyFee || ""} onChange={e => setForm({ ...form, agencyFee: Number(e.target.value) })} /></label><label>{copy("serviceFee")}<input type="number" min="0" required value={form.serviceFee || ""} onChange={e => setForm({ ...form, serviceFee: Number(e.target.value) })} /></label><label>{copy("utilities")}<input type="number" min="0" required value={form.firstMonthUtilities || ""} onChange={e => setForm({ ...form, firstMonthUtilities: Number(e.target.value) })} /></label></div><button className="button-primary full-width" disabled={!canSubmitListing || submitListing.isPending}>{submitListing.isPending ? copy("submitting") : isPro ? copy("submitPro") : copy("submitWithCredit")}</button></form></section>
	    <section className="agent-section"><h3><ReceiptText size={17} /> {copy("orderInventory")}</h3><p className="form-note">{copy("receiptSafety")}</p>{orders.data?.length ? <div className="order-list">{orders.data.slice(0, 5).map(order => <div key={order.id}><span><b>{localizedStatus(order.type)}</b><small>{order.id}{localizedProvider(order.provider) ? ` · ${localizedProvider(order.provider)}` : ""}{order.officialReceiptCode ? ` · ${interpolateAgent(copy("officialReceipt"), { code: order.officialReceiptCode })}` : ""}</small></span><div className="agent-order-actions"><span className={`order-status ${order.status}`}>{localizedStatus(order.status)}</span>{order.officialReceiptCode && <button className="text-button" type="button" onClick={() => setReceiptOrderId(order.id)}>{copy("printReceipt")}</button>}</div></div>)}</div> : <p className="muted">{copy("noOrders")}</p>}{listings.data?.length ? <div className="agent-list">{listings.data.map(listing => {
	      const freshnessDays = daysUntilRefresh(listing.lastReconfirmed);
	      const freshnessLabel = freshnessDays === 0 ? copy("refreshNow") : interpolateAgent(copy("daysRemaining"), { days: freshnessDays, plural: freshnessDays === 1 ? "" : "s" });
		      return <div key={listing.id}><div className="agent-list-copy"><b>{listing.title}</b><span>{localizedStatus(listing.status)} · {formatLocalizedXaf(listing.costs.totalMoveInCashRequired)}</span><p className="agent-list-freshness"><Clock3 size={13} aria-hidden="true" /><span>{interpolateAgent(copy("reconfirmed"), { date: formatLocalizedDate(listing.lastReconfirmed) })} · {freshnessLabel}</span></p></div><div className="agent-list-actions">{["published", "needs_reconfirmation"].includes(listing.status) && <button disabled={!active || reconfirm.isPending} onClick={() => reconfirm.mutate({ listingId: listing.id })}>{active ? copy("reconfirm") : copy("renewToReconfirm")}</button>}{listing.status === "published" && <><CostDisclosureForm listing={listing} language={language} onSaved={() => { utils.agent.listings.invalidate(); utils.marketplace.search.invalidate(); }} /><button onClick={() => newOrder("featured_pin", listing.id)}>{copy("featured")}</button><button onClick={() => newOrder("physical_verification_route_batch", listing.id)}>{copy("routeVerify")}</button><button onClick={() => newOrder("physical_verification_individual", listing.id)}>{copy("individualVerify")}</button></>}</div></div>;
	    })}</div> : <p className="muted">{copy("noListings")}</p>}</section>
    {receipt.data && <OfficialServiceReceipt receipt={receipt.data} onClose={() => setReceiptOrderId(null)} />}
  </div>;
}
