import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ApproximateMap, type MapListing } from "@/components/ApproximateMap";
import { trpc } from "@/lib/trpc";
import { daysUntilRefresh, relativeReconfirmed } from "@/lib/listingFreshness";
import { publicWalkthroughForDetail } from "@/lib/publicWalkthrough";
import { interpolate, marketplaceCopy, text, type PublicLanguage } from "@/lib/marketplaceLocale";
import { useMarketplaceLanguage } from "@/hooks/useMarketplaceLanguage";
import { AgentAccountPanel } from "@/pages/AgentAccountPanel";
import { PremiumWalkthroughRail } from "@/components/PremiumWalkthroughRail";
import { NonProductionWalkthroughDemo } from "@/components/NonProductionWalkthroughDemo";
import { SeekerMatchAlerts } from "@/components/SeekerMatchAlerts";
import { SeekerAppointmentHistory, ViewingAppointmentRequest } from "@/components/ViewingAppointmentConcierge";
import { BadgeCheck, Building2, CircleAlert, Clock3, MapPinned, Menu, MessageCircle, Share2, ShieldCheck, Sparkles, Video, X } from "lucide-react";
import { toast } from "sonner";
import "./launch-refinements.css";

const formatXaf = (value: number, language: PublicLanguage = "en") => `${new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(value)} XAF`;
type Language = PublicLanguage;

type Listing = MapListing & {
  landmark: string;
  propertyType: string;
  bedrooms: number;
  householdFit: string | null;
  availableFrom: Date | string;
  lastReconfirmed: Date | string;
  photosCount: number;
  agent: { name: string; whatsappPhone: string | null };
  walkthrough: { url: string; durationSeconds: number; verifiedAt: Date | string | null } | null;
  neighborhoodEssentials: { waterAccess: string; powerReliability: string; roadAccess: string; taxiWalkMinutes: number | null; junctionName: string | null; junctionMinutes: number | null; assessedAt: Date | string } | null;
  trust: { guaranteedTotalCash: boolean; guaranteeRule: string; badges: { code: string; label: string }[]; responseMetricAvailable: boolean };
  costs: MapListing["costs"] & {
    monthlyRent: number;
    advanceMonths: number;
    securityDeposit: number;
    agencyFee: number;
    serviceFee: number;
    firstMonthUtilities: number;
  };
};

function CostBreakdown({ listing, language }: { listing: Listing; language: Language }) {
  const rows = [
    [interpolate(text(language, "rentAdvance"), { months: listing.costs.advanceMonths }), listing.costs.monthlyRent * listing.costs.advanceMonths],
    [text(language, "securityDeposit"), listing.costs.securityDeposit],
    [text(language, "agencyFee"), listing.costs.agencyFee],
    [text(language, "serviceFee"), listing.costs.serviceFee],
    [text(language, "firstUtilities"), listing.costs.firstMonthUtilities],
  ];
  return <div className="cost-breakdown">{rows.map(([label, amount]) => <div key={String(label)}><span>{label}</span><b>{formatXaf(Number(amount))}</b></div>)}</div>;
}

function ListingCard({ listing, onOpen, language }: { listing: Listing; onOpen: () => void; language: Language }) {
  const days = daysUntilRefresh(listing.lastReconfirmed);
  return <article className={`listing-card ${listing.featured ? "is-featured" : ""}`}>
    <div className="listing-media-preview">{publicWalkthroughForDetail(listing.walkthrough) ? <video src={listing.walkthrough!.url} muted playsInline preload="metadata" aria-label={`${listing.title} ${text(language, "videoTour")}`} /> : <div className="photo-preview-placeholder"><Building2 size={24} /><span>{listing.photosCount} {text(language, "photosAvailable")}</span></div>}<span className="media-preview-label">{publicWalkthroughForDetail(listing.walkthrough) ? text(language, "videoTour") : text(language, "photoPreview")}</span></div>
    <div className="listing-card-top"><div><span className="listing-city">{listing.city} / {listing.neighborhood}</span><h3>{listing.title}</h3><p>{listing.propertyType}{listing.householdFit ? ` · ${listing.householdFit}` : ""}</p></div>{listing.featured && <span className="featured-tag"><Sparkles size={13} /> {text(language, "featured")}</span>}</div>
    <div className="listing-source"><Building2 size={15} /><span><small>{text(language, "listedBy")}</small><b>{text(language, "managingAgent")} · {listing.agent.name}</b></span></div>
    <div className="listing-total"><span>{text(language, "totalCash")}</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</strong><small>{text(language, "notOnlyRent")}</small></div>
    {listing.trust.guaranteedTotalCash && <div className="guarantee-seal"><ShieldCheck size={15} /><span><b>{text(language, "guaranteedCash")}</b><small>{text(language, "guaranteeNoDispute")}</small></span></div>}
    {listing.neighborhoodEssentials && <div className="listing-essentials"><span>{listing.neighborhoodEssentials.roadAccess === "tarred_to_gate" ? text(language, "tarredGate") : listing.neighborhoodEssentials.roadAccess === "dirt_track_to_gate" ? text(language, "dirtTrack") : text(language, "roadAssessed")}</span>{listing.neighborhoodEssentials.junctionName && <span>{listing.neighborhoodEssentials.junctionMinutes ?? "?"} {text(language, "minTo")} {listing.neighborhoodEssentials.junctionName}</span>}</div>}
    {listing.trust.badges.length > 0 && <div className="listing-badges">{listing.trust.badges.map(badge => <span key={badge.code}><BadgeCheck size={12} /> {badge.label}</span>)}</div>}
    {publicWalkthroughForDetail(listing.walkthrough) && <div className="listing-walkthrough-available"><Video size={14} /><span>{listing.title.startsWith("TEST DATA") ? text(language, "testTour") : text(language, "approvedTour")}</span></div>}
    <div className="listing-split"><span>{text(language, "monthlyRent")} <b>{formatXaf(listing.costs.monthlyRent, language)}</b></span><span><MapPinned size={14} /> {listing.map.radiusM}m {text(language, "landmarkArea")}</span></div>
    <div className="listing-trust-row"><span className={listing.verificationStatus === "physical_verified" ? "trust-positive" : "trust-neutral"}>{listing.verificationStatus === "physical_verified" ? <BadgeCheck size={15} /> : <Clock3 size={15} />}{listing.verificationStatus === "physical_verified" ? text(language, "physicallyVerified") : text(language, "notPhysicallyVerified")}<small>{listing.verificationStatus === "physical_verified" ? ` · ${text(language, "moderatorVisitPassed")}` : ` · ${text(language, "noModeratorVisit")}`}</small></span><span className="freshness-relative"><Clock3 size={14} /> {text(language, "reconfirmed")} {relativeReconfirmed(listing.lastReconfirmed, language)} <small>· {days} {days === 1 ? text(language, "dayLeft") : text(language, "daysLeft")}</small></span></div>
    <button className="card-action" onClick={onOpen}>{text(language, "viewCosts")} <span>→</span></button>
  </article>;
}

function ListingDetail({ listing, onClose, language, isAuthenticated }: { listing: Listing; onClose: () => void; language: Language; isAuthenticated: boolean }) {
  const utils = trpc.useUtils();
  const walkthrough = publicWalkthroughForDetail(listing.walkthrough);
  const isNonProductionFixture = listing.title.startsWith("TEST DATA");
  const reportMutation = trpc.marketplace.report.useMutation({ onSuccess: result => toast.success("Report received", { description: result.automaticSafetyAction ? "This listing has been placed on a safety hold for Admin review." : "AHC operations will review the reported terms." }) });
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const [reportReason, setReportReason] = useState<"inaccurate_cost" | "unavailable" | "misleading_details" | "unofficial_fee" | "other">("inaccurate_cost");
  const contact = async () => {
    if (!isAuthenticated) {
      toast.info("Sign in to contact this Agent.", { description: "The cost breakdown and landmark map are also available after sign-in." });
      return;
    }
    try {
      const result = await utils.marketplace.getContact.fetch({ listingId: listing.id });
      window.open(result.redirectUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("This listing cannot be contacted right now.");
    }
  };

  const shareProperty = async () => {
    const url = `${window.location.origin}/property/${encodeURIComponent(listing.id)}`;
    const shareData = { title: `${listing.title} · Affordable Housing Cameroon`, text: `Total Move-In Cash Required: ${formatXaf(listing.costs.totalMoveInCashRequired)}.`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Share link copied", { description: "This link shows a public preview in WhatsApp before opening AHC." });
        return;
      }
      window.prompt("Copy this AHC property link", url);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("We could not prepare the share link.");
    }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="listing-modal" role="dialog" aria-modal="true" aria-label={`Details for ${listing.title}`} onMouseDown={event => event.stopPropagation()}>
    <button className="modal-close" onClick={onClose} aria-label={text(language, "closeDetails")}><X size={19} /></button>
    <div className="modal-eyebrow">{listing.id} · {listing.city} / {listing.neighborhood}</div><h2>{listing.title}</h2>
    <p className="modal-landmark"><MapPinned size={16} /> {interpolate(text(language, "nearLandmark"), { landmark: listing.landmark, radius: listing.map.radiusM })}</p>
    {walkthrough && <div className="detail-media-first"><video src={walkthrough.url} controls playsInline preload="metadata" aria-label={`${listing.title} ${text(language, "videoTour")}`} /><span>{text(language, "mediaBeforeCosts")}</span></div>}<div className="total-panel"><span>{text(language, "totalCash")}</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</strong><p>{text(language, "totalAdvice")}</p></div>
    {isAuthenticated ? <><div className="detail-breakdown-heading"><h3>{text(language, "breakdown")}</h3><span>{text(language, "itemisedAfterTotal")}</span></div><CostBreakdown listing={listing} language={language} /><section className="detail-map-section" aria-labelledby={`map-${listing.id}`}><div><span className="section-overline">{text(language, "landmarkView")}</span><h3 id={`map-${listing.id}`}>{text(language, "approximateMap")}</h3><p>{text(language, "mapProtection")}</p></div><ApproximateMap listings={[listing]} city={listing.city} onSelect={() => undefined} /></section></> : <section className="protected-detail-gate"><MapPinned size={21} /><div><span>{text(language, "viewMore")}</span><h3>{text(language, "signInMap")}</h3><p>{text(language, "gateBody")}</p></div><AgentAccountPanel audience="seeker" language={language} /></section>}
    {walkthrough && <section className="listing-walkthrough" aria-labelledby={`walkthrough-${listing.id}`}>
      <div className="listing-walkthrough-copy"><span><Video size={15} /> AHC / {isNonProductionFixture ? text(language, "tourTest") : text(language, "tourApproved")}</span><h3 id={`walkthrough-${listing.id}`}>{isNonProductionFixture ? text(language, "testVideoHeading") : text(language, "approvedVideoHeading")}</h3><p>{isNonProductionFixture ? text(language, "testVideoBody") : text(language, "approvedVideoBody")}</p></div>
      <div className="premium-video-frame listing-modal-walkthrough"><video src={walkthrough.url} controls playsInline preload="metadata" aria-label={`${text(language, "videoTour")} ${listing.title}`} /><span className="video-proof">{isNonProductionFixture ? <CircleAlert size={14} /> : <BadgeCheck size={14} />}{isNonProductionFixture ? ` ${text(language, "tourTest")} · ${walkthrough.durationSeconds}s` : ` ${text(language, "moderatorTour")} · ${walkthrough.durationSeconds}s`}</span></div>
    </section>}
    <div className="listing-disclosures"><div><b>{text(language, "paidListingTitle")}</b><span>{text(language, "paidListingBody")}</span></div><div><b>{text(language, "noRentTitle")}</b><span>{text(language, "noRentBody")}</span></div><div><b>{text(language, "protectVisit")}</b><span>{text(language, "protectVisitBody")}</span></div></div>
    <div className="freshness-callout"><ShieldCheck size={18} /><div><b>{listing.verificationStatus === "physical_verified" ? text(language, "physicalBadge") : text(language, "freshnessCheck")}</b><span>{text(language, "freshnessBody")}</span></div></div>
    {isAuthenticated && <><ViewingAppointmentRequest listing={listing} language={language} />
    {!reporting ? <><p className="form-note">{text(language, "intentNote")}</p><div className="modal-actions"><button className="button-secondary share-property-button" onClick={shareProperty}><Share2 size={16} /> {text(language, "sharePreview")}</button><button className="button-secondary" onClick={() => setReporting(true)}>{text(language, "reportIssue")}</button><button className="button-primary" onClick={contact}><MessageCircle size={17} /> {text(language, "chatWhatsApp")}</button></div></> : <form className="report-form" onSubmit={event => { event.preventDefault(); reportMutation.mutate({ listingId: listing.id, reason: reportReason, note }, { onSuccess: () => { setReporting(false); setNote(""); } }); }}><label>{text(language, "reviewQuestion")}<select value={reportReason} onChange={event => setReportReason(event.target.value as typeof reportReason)}><option value="inaccurate_cost">{text(language, "inaccurateCost")}</option><option value="unavailable">{text(language, "unavailable")}</option><option value="misleading_details">{text(language, "misleading")}</option><option value="unofficial_fee">{text(language, "unofficialFee")}</option><option value="other">{text(language, "otherIssue")}</option></select></label><label>{text(language, "whatHappened")}<textarea required minLength={10} value={note} onChange={event => setNote(event.target.value)} placeholder={text(language, "reportPlaceholder")} /></label><p className="report-safety-note">{text(language, "reportSafety")}</p><div><button type="button" className="text-button" onClick={() => setReporting(false)}>{text(language, "cancel")}</button><button className="button-primary" disabled={reportMutation.isPending}>{reportMutation.isPending ? text(language, "sendingReport") : text(language, "sendReport")}</button></div></form>}</>}
  </section></div>;
}

export default function Home({ directListingId }: { directListingId?: string }) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, toggleLanguage, isLanguageTransitioning } = useMarketplaceLanguage();
  const labels = marketplaceCopy[language];
  const [city, setCity] = useState("All cities");
  const [search, setSearch] = useState("");
  const [maxMoveInCash, setMaxMoveInCash] = useState(300_000);
  const [verification, setVerification] = useState<"any" | "physical_verified">("any");
  const [selected, setSelected] = useState<Listing | null>(null);
  const filters = useMemo(() => ({ city, search: search || undefined, maxMoveInCash, verification }), [city, search, maxMoveInCash, verification]);
  const results = trpc.marketplace.search.useQuery(filters);
  const directResult = trpc.marketplace.search.useQuery(
    { maxMoveInCash: 1_000_000 },
    { enabled: Boolean(directListingId) },
  );
  const listings = (results.data ?? []) as Listing[];
  const directListings = (directResult.data ?? []) as Listing[];
  const openListing = (listing: Listing) => setSelected(listing);
  const openFromMap = (id: string) => {
    const listing = listings.find(item => item.id === id);
    if (listing) openListing(listing);
  };
  useEffect(() => {
    if (!directListingId || !directListings.length) return;
    const sharedListing = directListings.find(item => item.id === directListingId);
    if (sharedListing) openListing(sharedListing);
  }, [directListingId, directListings, isAuthenticated]);

  return <div className={`ahc-app language-transition ${isLanguageTransitioning ? "is-switching-language" : ""}`} lang={language}><header className="topbar"><a className="brand" href="#top"><span className="brand-emblem"><span /><span /><span /></span><span>Affordable Housing<br /><b>Cameroon</b></span></a><nav className={menuOpen ? "nav-links is-open" : "nav-links"}><a href="#homes" onClick={() => setMenuOpen(false)}>{labels.homes}</a><a href="#alerts" onClick={() => setMenuOpen(false)}>{labels.alerts}</a><a href="#trust" onClick={() => setMenuOpen(false)}>{labels.safer}</a><a href="#/agent" onClick={() => setMenuOpen(false)}>{labels.agents}</a><a href="#moderators" onClick={() => setMenuOpen(false)}>{labels.moderators}</a></nav><button className="language-toggle" onClick={toggleLanguage} aria-label={labels.french}>{labels.french}</button><a className="agent-top-cta" href="#/agent">{labels.list} <span>↗</span></a><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={labels.homes}>{menuOpen ? <X /> : <Menu />}</button></header>
    <main id="top"><aside className="atlas-index" aria-label="AHC"><span>AHC / ROUTE</span><a href="#homes"><b>01</b> {labels.routeFresh}</a><a href="#alerts"><b>02</b> {labels.routeAlerts}</a><a href="#trust"><b>03</b> {labels.routeTrust}</a><a href="#agents"><b>04</b> {labels.routeAgents}</a><a href="#moderators"><b>05</b> {labels.routeModerators}</a></aside><section className="hero"><div className="hero-grid"><div className="hero-copy"><span className="section-overline light">{labels.heroOverline}</span><h1>{labels.fullCost} <em>{labels.beforeMove}</em></h1><p>{labels.freshIntro}</p><div className="hero-proof"><span><ShieldCheck size={16} /> {labels.freshnessRule}</span><span><MapPinned size={16} /> {labels.landmarkMaps}</span></div></div><div className="search-panel"><span className="search-kicker">{labels.searchKicker}</span><label>{labels.where}<input value={search} onChange={e => setSearch(e.target.value)} placeholder={labels.searchPlaceholder} /></label><div className="two-fields"><label>{labels.city}<select value={city} onChange={e => setCity(e.target.value)}><option>{labels.allCities}</option><option>Yaoundé</option><option>Douala</option></select></label><label>{labels.maxCash}<select value={maxMoveInCash} onChange={e => setMaxMoveInCash(Number(e.target.value))}><option value={100000}>100,000 XAF</option><option value={200000}>200,000 XAF</option><option value={300000}>300,000 XAF</option><option value={500000}>500,000 XAF</option><option value={1000000}>{labels.anyAmount}</option></select></label></div><button className="button-primary full-width" onClick={() => document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" })}>{labels.seeHomes} <span>↓</span></button><p className="search-foot"><CircleAlert size={14} /> {labels.anonymous}</p></div></div></section>
      <section className="route-strip"><span>01 / {labels.routeOne}</span><span>02 / {labels.routeTwo}</span><span>03 / {labels.routeThree}</span><span>04 / {labels.routeFour}</span></section>
      <PremiumWalkthroughRail listings={listings} language={language} onOpen={listing => openListing(listing as Listing)} />
      <NonProductionWalkthroughDemo language={language} />
      <SeekerAppointmentHistory isAuthenticated={isAuthenticated} language={language} />
      <div id="alerts"><SeekerMatchAlerts isAuthenticated={isAuthenticated} language={language} /></div>
      <section id="homes" className="market-section"><div className="section-heading"><div><span className="section-overline">01 / {labels.freshInventory}</span><h2>{labels.freshHeading}</h2></div><p>{labels.freshBody}</p></div><div className="filter-row"><div className="filter-label"><span>{labels.show}</span><button className={verification === "any" ? "choice active" : "choice"} onClick={() => setVerification("any")}>{labels.allFresh}</button><button className={verification === "physical_verified" ? "choice active" : "choice"} onClick={() => setVerification("physical_verified")}>{labels.physicalOnly}</button></div><span className="result-count">{results.isLoading ? labels.checkingFreshness : `${listings.length} ${listings.length === 1 ? labels.freshHome : labels.freshHomes}`}</span></div><div className="market-layout media-led-market"><div className="listing-area">{results.isError ? <div className="empty-list"><CircleAlert /><h3>{labels.catalogueErrorTitle}</h3><p>{labels.catalogueErrorBody}</p></div> : results.isLoading ? <div className="loading-list"><i /><i /><i /></div> : listings.length ? <div className="listing-grid">{listings.map(listing => <ListingCard key={listing.id} listing={listing} language={language} onOpen={() => openListing(listing)} />)}</div> : <div className="empty-list"><Building2 /><h3>{labels.emptyHomeTitle}</h3><p>{labels.emptyHomeBody}</p><a className="button-secondary" href="#/agent">{labels.agentListHome}</a></div>}</div><aside className="map-gate-panel"><MapPinned size={25} /><span className="section-overline">{labels.protectedMap}</span><h3>{labels.protectedMapHeading}</h3><p>{labels.protectedMapBody}</p></aside></div></section>
      <section id="trust" className="trust-section"><div className="trust-intro"><span className="section-overline light">02 / {labels.trustOverline}</span><h2>{labels.trustHeadingOne}<br /><em>{labels.trustHeadingTwo}</em></h2><p>{labels.trustIntro}</p></div><div className="trust-rules"><div><b>01</b><h3>{labels.trustCostTitle}</h3><p>{labels.trustCostBody}</p></div><div><b>02</b><h3>{labels.trustPaidTitle}</h3><p>{labels.trustPaidBody}</p></div><div><b>03</b><h3>{labels.trustMapsTitle}</h3><p>{labels.trustMapsBody}</p></div><div><b>04</b><h3>{labels.trustFreshTitle}</h3><p>{labels.trustFreshBody}</p></div><div><b>05</b><h3>{labels.trustDirectTitle}</h3><p>{labels.trustDirectBody}</p></div></div></section>
      <section id="agents" className="agent-cta"><div><span className="section-overline">03 / {labels.agentOverline}</span><h2>{labels.agentHeading}</h2></div><div><p>{labels.agentBody}</p><a className="button-primary" href="#/agent">{labels.openAgent} <span>↗</span></a></div></section>
      <section id="moderators" className="agent-cta moderator-cta"><div><span className="section-overline">04 / {labels.moderatorOverline}</span><h2>{labels.moderatorHeading}</h2></div><div><p>{labels.moderatorBody}</p><a className="button-primary" href="#/operations">{labels.moderatorSignIn} <span>↗</span></a></div></section>
    </main><footer><span>Affordable Housing Cameroon</span><span>{labels.footerPilot}</span><span>{labels.footerWarning}</span></footer>{selected && <ListingDetail listing={selected} language={language} isAuthenticated={isAuthenticated} onClose={() => setSelected(null)} />}</div>;
}
