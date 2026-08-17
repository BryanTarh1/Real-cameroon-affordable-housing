import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ApproximateMap, type MapListing } from "@/components/ApproximateMap";
import { trpc } from "@/lib/trpc";
import { daysUntilRefresh, relativeReconfirmed } from "@/lib/listingFreshness";
import { resolveListingDetailAccess } from "@/lib/roleAccess";
import { publicWalkthroughForDetail } from "@/lib/publicWalkthrough";
import { AgentAccountPanel } from "@/pages/AgentAccountPanel";
import { PaidAgentPortal } from "@/pages/PaidAgentPortal";
import { PremiumWalkthroughRail } from "@/components/PremiumWalkthroughRail";
import { NonProductionWalkthroughDemo } from "@/components/NonProductionWalkthroughDemo";
import { SeekerMatchAlerts } from "@/components/SeekerMatchAlerts";
import { SeekerAppointmentHistory, ViewingAppointmentRequest } from "@/components/ViewingAppointmentConcierge";
import { BadgeCheck, Building2, CircleAlert, Clock3, MapPinned, Menu, MessageCircle, Share2, ShieldCheck, Sparkles, Video, X } from "lucide-react";
import { toast } from "sonner";
import "./launch-refinements.css";

const formatXaf = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} XAF`;
type Language = "en" | "fr";
const copy = {
  en: { homes: "Find homes", alerts: "Match alerts", safer: "Why it’s safer", agents: "For agents", moderators: "For moderators", list: "List a home", fullCost: "Know the full cost", beforeMove: "before you move.", freshIntro: "Fresh rental listings for Yaoundé and Douala. Every live home shows the cash needed to move in — not just rent.", searchKicker: "Start with the money you have", where: "Where do you want to live?", city: "City", maxCash: "Maximum move-in cash", seeHomes: "See fresh homes", anonymous: "You can search without an account. Sign in only when you open a property.", totalCash: "Total Move-In Cash Required", viewCosts: "View photos, video and every cost", signIn: "Sign in to open this home.", breakdown: "Cost breakdown", mapPrivate: "The approximate map is available after sign-in.", french: "Français" },
  fr: { homes: "Trouver un logement", alerts: "Alertes de recherche", safer: "Pourquoi c’est plus sûr", agents: "Pour les agents", moderators: "Pour les modérateurs", list: "Publier un logement", fullCost: "Connaissez le coût total", beforeMove: "avant de déménager.", freshIntro: "Des logements disponibles à Yaoundé et Douala. Chaque annonce indique l’argent nécessaire pour emménager — pas seulement le loyer.", searchKicker: "Commencez avec votre budget", where: "Où voulez-vous habiter ?", city: "Ville", maxCash: "Budget maximum à l’entrée", seeHomes: "Voir les logements récents", anonymous: "Vous pouvez chercher sans compte. Connectez-vous seulement quand vous ouvrez une annonce.", totalCash: "Montant total à prévoir", viewCosts: "Voir les photos, la vidéo et tous les coûts", signIn: "Connectez-vous pour ouvrir ce logement.", breakdown: "Détail des coûts", mapPrivate: "La carte approximative est disponible après connexion.", french: "English" },
} as const;

function t(language: Language, key: keyof typeof copy.en) { return copy[language][key]; }

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

function CostBreakdown({ listing }: { listing: Listing }) {
  const rows = [
    [`Rent × ${listing.costs.advanceMonths} month${listing.costs.advanceMonths === 1 ? "" : "s"}`, listing.costs.monthlyRent * listing.costs.advanceMonths],
    ["Security deposit", listing.costs.securityDeposit],
    ["Agency fee", listing.costs.agencyFee],
    ["Service fee", listing.costs.serviceFee],
    ["First-month utilities", listing.costs.firstMonthUtilities],
  ];
  return <div className="cost-breakdown">{rows.map(([label, amount]) => <div key={String(label)}><span>{label}</span><b>{formatXaf(Number(amount))}</b></div>)}</div>;
}

function ListingCard({ listing, onOpen, language }: { listing: Listing; onOpen: () => void; language: Language }) {
  const days = daysUntilRefresh(listing.lastReconfirmed);
  return <article className={`listing-card ${listing.featured ? "is-featured" : ""}`}>
    <div className="listing-media-preview">{publicWalkthroughForDetail(listing.walkthrough) ? <video src={listing.walkthrough!.url} muted playsInline preload="metadata" aria-label={`${listing.title} Walk-Thru preview`} /> : <div className="photo-preview-placeholder"><Building2 size={24} /><span>{listing.photosCount} {language === "fr" ? "photos disponibles" : "photos available"}</span></div>}<span className="media-preview-label">{publicWalkthroughForDetail(listing.walkthrough) ? (language === "fr" ? "Vidéo de visite" : "Walk-Thru video") : (language === "fr" ? "Aperçu photo" : "Photo preview")}</span></div>
    <div className="listing-card-top"><div><span className="listing-city">{listing.city} / {listing.neighborhood}</span><h3>{listing.title}</h3><p>{listing.propertyType}{listing.householdFit ? ` · ${listing.householdFit}` : ""}</p></div>{listing.featured && <span className="featured-tag"><Sparkles size={13} /> Featured pin</span>}</div>
    <div className="listing-source"><Building2 size={15} /><span><small>Listed by</small><b>Managing Agent · {listing.agent.name}</b></span></div>
    <div className="listing-total"><span>{t(language, "totalCash")}</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired)}</strong><small>{language === "fr" ? "Pas seulement le loyer mensuel." : "Not only the monthly rent."}</small></div>
    {listing.trust.guaranteedTotalCash && <div className="guarantee-seal"><ShieldCheck size={15} /><span><b>Guaranteed Total Cash</b><small>No upheld price or unofficial-fee dispute on record.</small></span></div>}
    {listing.neighborhoodEssentials && <div className="listing-essentials"><span>{listing.neighborhoodEssentials.roadAccess === "tarred_to_gate" ? "Tarred to gate" : listing.neighborhoodEssentials.roadAccess === "dirt_track_to_gate" ? "Dirt-track approach" : "Road assessed"}</span>{listing.neighborhoodEssentials.junctionName && <span>{listing.neighborhoodEssentials.junctionMinutes ?? "?"} min to {listing.neighborhoodEssentials.junctionName}</span>}</div>}
    {listing.trust.badges.length > 0 && <div className="listing-badges">{listing.trust.badges.map(badge => <span key={badge.code}><BadgeCheck size={12} /> {badge.label}</span>)}</div>}
    {publicWalkthroughForDetail(listing.walkthrough) && <div className="listing-walkthrough-available"><Video size={14} /><span>{listing.title.startsWith("TEST DATA") ? "Test Walk-Thru available" : "Approved Walk-Thru available"}</span></div>}
    <div className="listing-split"><span>Monthly rent <b>{formatXaf(listing.costs.monthlyRent)}</b></span><span><MapPinned size={14} /> {listing.map.radiusM}m landmark area</span></div>
    <div className="listing-trust-row"><span className={listing.verificationStatus === "physical_verified" ? "trust-positive" : "trust-neutral"}>{listing.verificationStatus === "physical_verified" ? <BadgeCheck size={15} /> : <Clock3 size={15} />}{listing.verificationStatus === "physical_verified" ? "Physically verified by AHC" : "Not yet physically verified"}<small>{listing.verificationStatus === "physical_verified" ? " · Field Moderator visit passed" : " · Published after review; no on-site Field Moderator visit yet"}</small></span><span className="freshness-relative"><Clock3 size={14} /> Reconfirmed {relativeReconfirmed(listing.lastReconfirmed)} <small>· {days} day{days === 1 ? "" : "s"} left</small></span></div>
    <button className="card-action" onClick={onOpen}>{t(language, "viewCosts")} <span>→</span></button>
  </article>;
}

function ListingDetail({ listing, onClose, language }: { listing: Listing; onClose: () => void; language: Language }) {
  const utils = trpc.useUtils();
  const walkthrough = publicWalkthroughForDetail(listing.walkthrough);
  const isNonProductionFixture = listing.title.startsWith("TEST DATA");
  const reportMutation = trpc.marketplace.report.useMutation({ onSuccess: result => toast.success("Report received", { description: result.automaticSafetyAction ? "This listing has been placed on a safety hold for Admin review." : "AHC operations will review the reported terms." }) });
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const [reportReason, setReportReason] = useState<"inaccurate_cost" | "unavailable" | "misleading_details" | "unofficial_fee" | "other">("inaccurate_cost");
  const contact = async () => {
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
    <button className="modal-close" onClick={onClose} aria-label="Close listing details"><X size={19} /></button>
    <div className="modal-eyebrow">{listing.id} · {listing.city} / {listing.neighborhood}</div><h2>{listing.title}</h2>
    <p className="modal-landmark"><MapPinned size={16} /> Near {listing.landmark} · the public pin shows an approximate {listing.map.radiusM}m landmark area, never the compound door.</p>
    {walkthrough && <div className="detail-media-first"><video src={walkthrough.url} controls playsInline preload="metadata" aria-label={`${listing.title} Walk-Thru`} /><span>{language === "fr" ? "La vidéo et les images sont présentées avant le détail des coûts." : "Media is shown before the protected cost detail."}</span></div>}<div className="total-panel"><span>{t(language, "totalCash")}</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired)}</strong><p>{language === "fr" ? "C’est le montant déclaré avant l’emménagement. Demandez des reçus et visitez le logement avant de payer." : "This is the cash the agent declared you need before moving in. Ask for written receipts and inspect the home before paying."}</p></div>
    <div className="detail-breakdown-heading"><h3>{t(language, "breakdown")}</h3><span>{language === "fr" ? "Le détail apparaît après le montant total." : "The itemised view follows the headline total."}</span></div><CostBreakdown listing={listing} />
    {walkthrough && <section className="listing-walkthrough" aria-labelledby={`walkthrough-${listing.id}`}>
      <div className="listing-walkthrough-copy"><span><Video size={15} /> AHC / {isNonProductionFixture ? "non-production Walk-Thru test" : "approved Walk-Thru"}</span><h3 id={`walkthrough-${listing.id}`}>{isNonProductionFixture ? "Test the full-detail video experience." : "See the verified home flow before arranging a visit."}</h3><p>{isNonProductionFixture ? `This ${walkthrough.durationSeconds}-second generated test clip is attached only to demonstrate the non-production Seeker video flow. It is not evidence of a real home, field visit, or availability.` : `This ${walkthrough.durationSeconds}-second vertical clip was recorded during a passed Field Moderator visit. It is a public viewing aid, not the private proof package or an exact-address disclosure.`}</p></div>
      <div className="premium-video-frame listing-modal-walkthrough"><video src={walkthrough.url} controls playsInline preload="metadata" aria-label={`${isNonProductionFixture ? "Non-production test" : "Approved"} Walk-Thru video for ${listing.title}`} /><span className="video-proof">{isNonProductionFixture ? <CircleAlert size={14} /> : <BadgeCheck size={14} />}{isNonProductionFixture ? ` Test Walk-Thru · non-production · ${walkthrough.durationSeconds}s` : ` Moderator Walk-Thru · ${walkthrough.durationSeconds}s`}</span></div>
    </section>}
    <div className="listing-disclosures"><div><b>What “paid listing” means</b><span>The agent paid for Agent Access and a Listing Pass before the listing entered moderator review. It is not a guarantee that the home, price, or agent is risk-free.</span></div><div><b>AHC does not hold your rent or deposit</b><span>AHC is not an escrow, rent-collection, or deposit-holding service. Do not send tenancy money to AHC or to anyone claiming to collect it for AHC.</span></div><div><b>Protect your visit</b><span>Do not send a deposit before you inspect the home, agree terms in writing, and receive a receipt. AHC never asks seekers to pay an Agent or Owner a platform fee; report any unofficial AHC-fee demand here.</span></div></div>
    <div className="freshness-callout"><ShieldCheck size={18} /><div><b>{listing.verificationStatus === "physical_verified" ? "Physical verification badge" : "Freshness check"}</b><span>Last reconfirmed {new Date(listing.lastReconfirmed).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. This listing leaves public search after 14 days without agent reconfirmation.</span></div></div>
    <ViewingAppointmentRequest listing={listing} />
    {!reporting ? <><p className="form-note">AHC records only this authenticated contact intent before opening WhatsApp. It does not read your messages or claim a booking or payment outcome.</p><div className="modal-actions"><button className="button-secondary share-property-button" onClick={shareProperty}><Share2 size={16} /> Share preview</button><button className="button-secondary" onClick={() => setReporting(true)}>Report an issue</button><button className="button-primary" onClick={contact}><MessageCircle size={17} /> Chat on WhatsApp</button></div></> : <form className="report-form" onSubmit={event => { event.preventDefault(); reportMutation.mutate({ listingId: listing.id, reason: reportReason, note }, { onSuccess: () => { setReporting(false); setNote(""); } }); }}><label>What needs review?<select value={reportReason} onChange={event => setReportReason(event.target.value as typeof reportReason)}><option value="inaccurate_cost">Inaccurate Total Move-In Cash</option><option value="unavailable">Home is no longer available</option><option value="misleading_details">Listing details do not match</option><option value="unofficial_fee">Someone requested an unofficial AHC fee</option><option value="other">Another issue</option></select></label><label>What happened?<textarea required minLength={10} value={note} onChange={event => setNote(event.target.value)} placeholder="For example: the agent requested 12 months’ advance instead of the listed amount..." /></label><p className="report-safety-note">Three distinct inaccurate-cost or unavailable-listing reports automatically remove this listing from public search pending Admin review. Unofficial-fee reports are separately queued for payment-fraud review.</p><div><button type="button" className="text-button" onClick={() => setReporting(false)}>Cancel</button><button className="button-primary" disabled={reportMutation.isPending}>{reportMutation.isPending ? "Sending report…" : "Send report"}</button></div></form>}
  </section></div>;
}

function AgentPortal({ onClose }: { onClose: () => void }) {
  return <PaidAgentPortal onClose={onClose} />;
}

export default function Home({ startAgentOpen = false, directListingId }: { startAgentOpen?: boolean; directListingId?: string }) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => (window.localStorage.getItem("ahc-language") as Language) || "en");
  const labels = copy[language];
  useEffect(() => { window.localStorage.setItem("ahc-language", language); }, [language]);
  const [agentOpen, setAgentOpen] = useState(() => startAgentOpen || new URLSearchParams(window.location.search).get("agent") === "1");
  const [city, setCity] = useState("All cities");
  const [search, setSearch] = useState("");
  const [maxMoveInCash, setMaxMoveInCash] = useState(300_000);
  const [verification, setVerification] = useState<"any" | "physical_verified">("any");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [listingAwaitingSignIn, setListingAwaitingSignIn] = useState<Listing | null>(null);
  const filters = useMemo(() => ({ city, search: search || undefined, maxMoveInCash, verification }), [city, search, maxMoveInCash, verification]);
  const results = trpc.marketplace.search.useQuery(filters);
  const directResult = trpc.marketplace.search.useQuery(
    { maxMoveInCash: 1_000_000 },
    { enabled: Boolean(directListingId) },
  );
  const listings = (results.data ?? []) as Listing[];
  const directListings = (directResult.data ?? []) as Listing[];
  const openListing = (listing: Listing) => {
    if (resolveListingDetailAccess(isAuthenticated) === "detail") setSelected(listing);
    else setListingAwaitingSignIn(listing);
  };
  const openFromMap = (id: string) => {
    const listing = listings.find(item => item.id === id);
    if (listing) openListing(listing);
  };
  useEffect(() => {
    if (isAuthenticated && listingAwaitingSignIn) {
      setSelected(listingAwaitingSignIn);
      setListingAwaitingSignIn(null);
    }
  }, [isAuthenticated, listingAwaitingSignIn]);
  useEffect(() => {
    if (!directListingId || !directListings.length) return;
    const sharedListing = directListings.find(item => item.id === directListingId);
    if (sharedListing) openListing(sharedListing);
  }, [directListingId, directListings, isAuthenticated]);

  return <div className="ahc-app"><header className="topbar"><a className="brand" href="#top"><span className="brand-emblem"><span /><span /><span /></span><span>Affordable Housing<br /><b>Cameroon</b></span></a><nav className={menuOpen ? "nav-links is-open" : "nav-links"}><a href="#homes" onClick={() => setMenuOpen(false)}>{labels.homes}</a><a href="#alerts" onClick={() => setMenuOpen(false)}>{labels.alerts}</a><a href="#trust" onClick={() => setMenuOpen(false)}>{labels.safer}</a><button onClick={() => { setAgentOpen(true); setMenuOpen(false); }}>{labels.agents}</button><a href="#moderators" onClick={() => setMenuOpen(false)}>{labels.moderators}</a></nav><button className="language-toggle" onClick={() => setLanguage(language === "en" ? "fr" : "en")} aria-label="Switch language">{labels.french}</button><button className="agent-top-cta" onClick={() => setAgentOpen(true)}>{labels.list} <span>↗</span></button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button></header>
    <main id="top"><aside className="atlas-index" aria-label="On this page"><span>AHC / ROUTE</span><a href="#homes"><b>01</b> Fresh homes</a><a href="#alerts"><b>02</b> Match alerts</a><a href="#trust"><b>03</b> Trust design</a><a href="#agents"><b>04</b> Agent tools</a><a href="#moderators"><b>05</b> Field work</a></aside><section className="hero"><div className="hero-grid"><div className="hero-copy"><span className="section-overline light">{language === "fr" ? "CAMEROUN URBAIN / DISPONIBILITÉ VÉRIFIÉE" : "Urban Cameroon / verified availability"}</span><h1>{labels.fullCost} <em>{labels.beforeMove}</em></h1><p>{labels.freshIntro}</p><div className="hero-proof"><span><ShieldCheck size={16} /> 14-day freshness rule</span><span><MapPinned size={16} /> Landmark-only maps</span></div></div><div className="search-panel"><span className="search-kicker">{labels.searchKicker}</span><label>{labels.where}<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Neighborhood or landmark" /></label><div className="two-fields"><label>{labels.city}<select value={city} onChange={e => setCity(e.target.value)}><option>All cities</option><option>Yaoundé</option><option>Douala</option></select></label><label>{labels.maxCash}<select value={maxMoveInCash} onChange={e => setMaxMoveInCash(Number(e.target.value))}><option value={100000}>100,000 XAF</option><option value={200000}>200,000 XAF</option><option value={300000}>300,000 XAF</option><option value={500000}>500,000 XAF</option><option value={1000000}>Any amount</option></select></label></div><button className="button-primary full-width" onClick={() => document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" })}>{labels.seeHomes} <span>↓</span></button><p className="search-foot"><CircleAlert size={14} /> {labels.anonymous}</p></div></div></section>
      <section className="route-strip"><span>01 / Search by total cash</span><span>02 / View landmark area</span><span>03 / Ask agent on WhatsApp</span><span>04 / Pay only after a visit</span></section>
      <PremiumWalkthroughRail listings={listings} onOpen={listing => openListing(listing as Listing)} />
      <NonProductionWalkthroughDemo />
      <SeekerAppointmentHistory isAuthenticated={isAuthenticated} />
      <div id="alerts"><SeekerMatchAlerts isAuthenticated={isAuthenticated} /></div>
      <section id="homes" className="market-section"><div className="section-heading"><div><span className="section-overline">01 / Fresh inventory</span><h2>Only homes that are still being watched.</h2></div><p>Agents must reconfirm every 14 days. If they do not, the listing is automatically archived from public search.</p></div><div className="filter-row"><div className="filter-label"><span>Show</span><button className={verification === "any" ? "choice active" : "choice"} onClick={() => setVerification("any")}>All fresh listings</button><button className={verification === "physical_verified" ? "choice active" : "choice"} onClick={() => setVerification("physical_verified")}>Physical badges only</button></div><span className="result-count">{results.isLoading ? "Checking freshness…" : `${listings.length} fresh home${listings.length === 1 ? "" : "s"}`}</span></div><div className="market-layout"><div className="listing-area">{results.isError ? <div className="empty-list"><CircleAlert /><h3>We could not load the catalogue.</h3><p>Please refresh. No inactive inventory is shown as a fallback.</p></div> : results.isLoading ? <div className="loading-list"><i /><i /><i /></div> : listings.length ? <div className="listing-grid">{listings.map(listing => <ListingCard key={listing.id} listing={listing} language={language} onOpen={() => openListing(listing)} />)}</div> : <div className="empty-list"><Building2 /><h3>No fresh homes match this route yet.</h3><p>Try another city or a larger total move-in budget. Agents use paid access before a transparent listing can enter review.</p><button className="button-secondary" onClick={() => setAgentOpen(true)}>I’m an agent — list a home</button></div>}</div><aside className="map-area"><ApproximateMap listings={listings} city={city} onSelect={openFromMap} /></aside></div></section>
      <section id="trust" className="trust-section"><div className="trust-intro"><span className="section-overline light">02 / The trust design</span><h2>Fewer promises.<br /><em>More visible rules.</em></h2><p>AHC does not hold rent, create an in-app chat wall, or pretend to know the exact compound door. It makes the first decision clearer and safer.</p></div><div className="trust-rules"><div><b>01</b><h3>Every cost is declared</h3><p>Rent, advance months, security, agency fee, service fee and first utilities create one Total Move-In Cash Required number.</p></div><div><b>02</b><h3>Paid is not guaranteed</h3><p>Paid listing access shows the agent committed to a reviewed submission. It does not guarantee the property, price, ownership, or your safety.</p></div><div><b>03</b><h3>Maps protect the door</h3><p>Public pins mark a 200–500m landmark radius. They are not directions to a compound and exact access stays with the agent after a visit is arranged.</p></div><div><b>04</b><h3>Freshness is enforced</h3><p>Unreconfirmed listings are archived after 14 days. The catalogue prioritises availability, not volume.</p></div><div><b>05</b><h3>Connection stays direct</h3><p>The listing button opens a prefilled WhatsApp message to the responsible agent. Inspect before paying, agree in writing, keep receipts, and report changed terms.</p></div></div></section>
      <section id="agents" className="agent-cta"><div><span className="section-overline">03 / Agent subscription and trust tools</span><h2>Earn attention by being clear, not by hiding the costs.</h2></div><div><p>Agent Access and a Listing Pass are paid before commercial inventory enters moderator review. Featured map pins improve discovery; a physical-verification badge appears only after a moderator records a passed field outcome. None of these replaces a renter’s own visit and checks.</p><button className="button-primary" onClick={() => setAgentOpen(true)}>Open agent workspace <span>↗</span></button></div></section>
      <section id="moderators" className="agent-cta moderator-cta"><div><span className="section-overline">04 / Field Moderator work</span><h2>Inspect homes on the ground and record the evidence.</h2></div><div><p>Field Moderators review listings, verify compound visits, and receive the recorded 80% share after a paid physical verification passes and an Admin approves the evidence. Platform service-order reconciliation remains an Admin-only finance control. An Admin must assign the Field Moderator role before Operations opens.</p><a className="button-primary" href="#/operations">Field Moderator sign in <span>↗</span></a></div></section>
    </main><footer><span>Affordable Housing Cameroon</span><span>Yaoundé + Douala pilot</span><span>Never pay before a visit, written agreement and receipt.</span></footer>{selected && <ListingDetail listing={selected} language={language} onClose={() => setSelected(null)} />}{listingAwaitingSignIn && <div className="drawer-backdrop" onMouseDown={() => setListingAwaitingSignIn(null)}><aside onMouseDown={e => e.stopPropagation()}><section className="agent-drawer seeker-access-panel"><button className="drawer-close" onClick={() => setListingAwaitingSignIn(null)}><X size={19} /></button><span className="section-overline">AHC / Seeker access</span><h2>{labels.signIn}</h2><p>Create a free AHC seeker account to see the complete cost breakdown, freshness details, and agent contact option for <b>{listingAwaitingSignIn.title}</b>.</p><AgentAccountPanel audience="seeker" /></section></aside></div>}{agentOpen && <div className="drawer-backdrop" onMouseDown={() => setAgentOpen(false)}><aside onMouseDown={e => e.stopPropagation()}><AgentPortal onClose={() => setAgentOpen(false)} /></aside></div>}</div>;
}
