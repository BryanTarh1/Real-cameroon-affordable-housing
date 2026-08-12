import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ApproximateMap, type MapListing } from "@/components/ApproximateMap";
import { trpc } from "@/lib/trpc";
import { resolveListingDetailAccess } from "@/lib/roleAccess";
import { AgentAccountPanel } from "@/pages/AgentAccountPanel";
import { PaidAgentPortal } from "@/pages/PaidAgentPortal";
import { BadgeCheck, Building2, CircleAlert, Clock3, MapPinned, Menu, MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import "./launch-refinements.css";

const formatXaf = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} XAF`;

type Listing = MapListing & {
  landmark: string;
  propertyType: string;
  householdFit: string | null;
  availableFrom: Date | string;
  lastReconfirmed: Date | string;
  photosCount: number;
  agent: { name: string; whatsappPhone: string | null };
  costs: MapListing["costs"] & {
    monthlyRent: number;
    advanceMonths: number;
    securityDeposit: number;
    agencyFee: number;
    serviceFee: number;
    firstMonthUtilities: number;
  };
};

function daysUntilRefresh(value: Date | string) {
  const expiry = new Date(value).getTime() + 14 * 86_400_000;
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86_400_000));
}

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

function ListingCard({ listing, onOpen }: { listing: Listing; onOpen: () => void }) {
  const days = daysUntilRefresh(listing.lastReconfirmed);
  return <article className={`listing-card ${listing.featured ? "is-featured" : ""}`}>
    <div className="listing-card-top"><div><span className="listing-city">{listing.city} / {listing.neighborhood}</span><h3>{listing.title}</h3><p>{listing.propertyType}{listing.householdFit ? ` · ${listing.householdFit}` : ""}</p></div>{listing.featured && <span className="featured-tag"><Sparkles size={13} /> Featured pin</span>}</div>
    <div className="listing-total"><span>Total Move-In Cash Required</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired)}</strong><small>Not only the monthly rent.</small></div>
    <div className="listing-split"><span>Monthly rent <b>{formatXaf(listing.costs.monthlyRent)}</b></span><span><MapPinned size={14} /> {listing.map.radiusM}m landmark area</span></div>
    <div className="listing-trust-row"><span className={listing.verificationStatus === "physical_verified" ? "trust-positive" : "trust-neutral"}>{listing.verificationStatus === "physical_verified" ? <BadgeCheck size={15} /> : <Clock3 size={15} />}{listing.verificationStatus === "physical_verified" ? "Physical verification" : "Availability reconfirmed"}</span><span>Refreshes in {days} day{days === 1 ? "" : "s"}</span></div>
    <button className="card-action" onClick={onOpen}>View every cost <span>→</span></button>
  </article>;
}

function ListingDetail({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const utils = trpc.useUtils();
  const reportMutation = trpc.marketplace.report.useMutation({ onSuccess: () => toast.success("Report received", { description: "AHC operations will review the availability concern." }) });
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const contact = async () => {
    try {
      const result = await utils.marketplace.getContact.fetch({ listingId: listing.id });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("This listing cannot be contacted right now.");
    }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="listing-modal" role="dialog" aria-modal="true" aria-label={`Details for ${listing.title}`} onMouseDown={event => event.stopPropagation()}>
    <button className="modal-close" onClick={onClose} aria-label="Close listing details"><X size={19} /></button>
    <div className="modal-eyebrow">{listing.id} · {listing.city} / {listing.neighborhood}</div><h2>{listing.title}</h2>
    <p className="modal-landmark"><MapPinned size={16} /> Near {listing.landmark} · the public pin shows an approximate {listing.map.radiusM}m landmark area, never the compound door.</p>
    <div className="total-panel"><span>Total Move-In Cash Required</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired)}</strong><p>This is the cash the agent declared you need before moving in. Ask for written receipts and inspect the home before paying.</p></div>
    <CostBreakdown listing={listing} />
    <div className="listing-disclosures"><div><b>What “paid listing” means</b><span>The agent paid for Agent Access and a Listing Pass before the listing entered moderator review. It is not a guarantee that the home, price, or agent is risk-free.</span></div><div><b>Protect your visit</b><span>Do not send a deposit before you inspect the home, agree terms in writing, and receive a receipt. Report a changed cost or unavailable home here.</span></div></div>
    <div className="freshness-callout"><ShieldCheck size={18} /><div><b>{listing.verificationStatus === "physical_verified" ? "Physical verification badge" : "Freshness check"}</b><span>Last reconfirmed {new Date(listing.lastReconfirmed).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. This listing leaves public search after 14 days without agent reconfirmation.</span></div></div>
    {!reporting ? <div className="modal-actions"><button className="button-secondary" onClick={() => setReporting(true)}>Report an issue</button><button className="button-primary" onClick={contact}><MessageCircle size={17} /> Ask agent on WhatsApp</button></div> : <form className="report-form" onSubmit={event => { event.preventDefault(); reportMutation.mutate({ listingId: listing.id, note }); setReporting(false); setNote(""); }}><label>What needs review?<textarea required minLength={10} value={note} onChange={event => setNote(event.target.value)} placeholder="For example: price or availability changed..." /></label><div><button type="button" className="text-button" onClick={() => setReporting(false)}>Cancel</button><button className="button-primary" disabled={reportMutation.isPending}>{reportMutation.isPending ? "Sending…" : "Send report"}</button></div></form>}
  </section></div>;
}

function AgentPortal({ onClose }: { onClose: () => void }) {
  return <PaidAgentPortal onClose={onClose} />;
}

export default function Home({ startAgentOpen = false }: { startAgentOpen?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(() => startAgentOpen || new URLSearchParams(window.location.search).get("agent") === "1");
  const [city, setCity] = useState("All cities");
  const [search, setSearch] = useState("");
  const [maxMoveInCash, setMaxMoveInCash] = useState(300_000);
  const [verification, setVerification] = useState<"any" | "physical_verified">("any");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [listingAwaitingSignIn, setListingAwaitingSignIn] = useState<Listing | null>(null);
  const filters = useMemo(() => ({ city, search: search || undefined, maxMoveInCash, verification }), [city, search, maxMoveInCash, verification]);
  const results = trpc.marketplace.search.useQuery(filters);
  const listings = (results.data ?? []) as Listing[];
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

  return <div className="ahc-app"><header className="topbar"><a className="brand" href="#top"><span className="brand-emblem"><span /><span /><span /></span><span>Affordable Housing<br /><b>Cameroon</b></span></a><nav className={menuOpen ? "nav-links is-open" : "nav-links"}><a href="#homes" onClick={() => setMenuOpen(false)}>Find homes</a><a href="#trust" onClick={() => setMenuOpen(false)}>Why it’s safer</a><button onClick={() => { setAgentOpen(true); setMenuOpen(false); }}>For agents</button><a href="#moderators" onClick={() => setMenuOpen(false)}>For moderators</a></nav><button className="agent-top-cta" onClick={() => setAgentOpen(true)}>List a home <span>↗</span></button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button></header>
    <main id="top"><aside className="atlas-index" aria-label="On this page"><span>AHC / ROUTE</span><a href="#homes"><b>01</b> Fresh homes</a><a href="#trust"><b>02</b> Trust design</a><a href="#agents"><b>03</b> Agent tools</a><a href="#moderators"><b>04</b> Field work</a></aside><section className="hero"><div className="hero-grid"><div className="hero-copy"><span className="section-overline light">Urban Cameroon / verified availability</span><h1>Know the <em>full cost</em><br />before you move.</h1><p>Fresh rental listings for Yaoundé and Douala. Every live home shows the cash needed to move in — not just rent.</p><div className="hero-proof"><span><ShieldCheck size={16} /> 14-day freshness rule</span><span><MapPinned size={16} /> Landmark-only maps</span></div></div><div className="search-panel"><span className="search-kicker">Start with the money you have</span><label>Where do you want to live?<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Neighborhood or landmark" /></label><div className="two-fields"><label>City<select value={city} onChange={e => setCity(e.target.value)}><option>All cities</option><option>Yaoundé</option><option>Douala</option></select></label><label>Maximum move-in cash<select value={maxMoveInCash} onChange={e => setMaxMoveInCash(Number(e.target.value))}><option value={100000}>100,000 XAF</option><option value={200000}>200,000 XAF</option><option value={300000}>300,000 XAF</option><option value={500000}>500,000 XAF</option><option value={1000000}>Any amount</option></select></label></div><button className="button-primary full-width" onClick={() => document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" })}>See fresh homes <span>↓</span></button><p className="search-foot"><CircleAlert size={14} /> You can search without an account. Sign in only when you open a property.</p></div></div></section>
      <section className="route-strip"><span>01 / Search by total cash</span><span>02 / View landmark area</span><span>03 / Ask agent on WhatsApp</span><span>04 / Pay only after a visit</span></section>
      <section id="homes" className="market-section"><div className="section-heading"><div><span className="section-overline">01 / Fresh inventory</span><h2>Only homes that are still being watched.</h2></div><p>Agents must reconfirm every 14 days. If they do not, the listing is automatically archived from public search.</p></div><div className="filter-row"><div className="filter-label"><span>Show</span><button className={verification === "any" ? "choice active" : "choice"} onClick={() => setVerification("any")}>All fresh listings</button><button className={verification === "physical_verified" ? "choice active" : "choice"} onClick={() => setVerification("physical_verified")}>Physical badges only</button></div><span className="result-count">{results.isLoading ? "Checking freshness…" : `${listings.length} fresh home${listings.length === 1 ? "" : "s"}`}</span></div><div className="market-layout"><div className="listing-area">{results.isError ? <div className="empty-list"><CircleAlert /><h3>We could not load the catalogue.</h3><p>Please refresh. No inactive inventory is shown as a fallback.</p></div> : results.isLoading ? <div className="loading-list"><i /><i /><i /></div> : listings.length ? <div className="listing-grid">{listings.map(listing => <ListingCard key={listing.id} listing={listing} onOpen={() => openListing(listing)} />)}</div> : <div className="empty-list"><Building2 /><h3>No fresh homes match this route yet.</h3><p>Try another city or a larger total move-in budget. Agents use paid access before a transparent listing can enter review.</p><button className="button-secondary" onClick={() => setAgentOpen(true)}>I’m an agent — list a home</button></div>}</div><aside className="map-area"><ApproximateMap listings={listings} city={city} onSelect={openFromMap} /></aside></div></section>
      <section id="trust" className="trust-section"><div className="trust-intro"><span className="section-overline light">02 / The trust design</span><h2>Fewer promises.<br /><em>More visible rules.</em></h2><p>AHC does not hold rent, create an in-app chat wall, or pretend to know the exact compound door. It makes the first decision clearer and safer.</p></div><div className="trust-rules"><div><b>01</b><h3>Every cost is declared</h3><p>Rent, advance months, security, agency fee, service fee and first utilities create one Total Move-In Cash Required number.</p></div><div><b>02</b><h3>Paid is not guaranteed</h3><p>Paid listing access shows the agent committed to a reviewed submission. It does not guarantee the property, price, ownership, or your safety.</p></div><div><b>03</b><h3>Maps protect the door</h3><p>Public pins mark a 200–500m landmark radius. They are not directions to a compound and exact access stays with the agent after a visit is arranged.</p></div><div><b>04</b><h3>Freshness is enforced</h3><p>Unreconfirmed listings are archived after 14 days. The catalogue prioritises availability, not volume.</p></div><div><b>05</b><h3>Connection stays direct</h3><p>The listing button opens a prefilled WhatsApp message to the responsible agent. Inspect before paying, agree in writing, keep receipts, and report changed terms.</p></div></div></section>
      <section id="agents" className="agent-cta"><div><span className="section-overline">03 / Agent subscription and trust tools</span><h2>Earn attention by being clear, not by hiding the costs.</h2></div><div><p>Agent Access and a Listing Pass are paid before commercial inventory enters moderator review. Featured map pins improve discovery; a physical-verification badge appears only after a moderator records a passed field outcome. None of these replaces a renter’s own visit and checks.</p><button className="button-primary" onClick={() => setAgentOpen(true)}>Open agent workspace <span>↗</span></button></div></section>
      <section id="moderators" className="agent-cta moderator-cta"><div><span className="section-overline">04 / Field Moderator work</span><h2>Inspect homes on the ground and record the evidence.</h2></div><div><p>Field Moderators verify compound visits, reconcile submitted payment references, review listings, and receive the recorded 80% share after a paid physical verification passes. An Admin must assign the Field Moderator role before Operations opens.</p><a className="button-primary" href="/operations">Field Moderator sign in <span>↗</span></a></div></section>
    </main><footer><span>Affordable Housing Cameroon</span><span>Yaoundé + Douala pilot</span><span>Never pay before a visit, written agreement and receipt.</span></footer>{selected && <ListingDetail listing={selected} onClose={() => setSelected(null)} />}{listingAwaitingSignIn && <div className="drawer-backdrop" onMouseDown={() => setListingAwaitingSignIn(null)}><aside onMouseDown={e => e.stopPropagation()}><section className="agent-drawer seeker-access-panel"><button className="drawer-close" onClick={() => setListingAwaitingSignIn(null)}><X size={19} /></button><span className="section-overline">AHC / Seeker access</span><h2>Sign in to open this home.</h2><p>Create a free AHC seeker account to see the complete cost breakdown, freshness details, and agent contact option for <b>{listingAwaitingSignIn.title}</b>.</p><AgentAccountPanel audience="seeker" /></section></aside></div>}{agentOpen && <div className="drawer-backdrop" onMouseDown={() => setAgentOpen(false)}><aside onMouseDown={e => e.stopPropagation()}><AgentPortal onClose={() => setAgentOpen(false)} /></aside></div>}</div>;
}
