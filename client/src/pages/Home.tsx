/**
 * Courtyard Atlas design reminder: editorial African modernism, warm paper surfaces,
 * mango ochre wayfinding, ink navy trust signals, asymmetric atlas-like layouts.
 * This first product version is a frontend prototype: interactions are real locally,
 * persistence, authentication, messaging, payments, and moderation APIs are future work.
 */
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Flag,
  Heart,
  Home as HomeIcon,
  Info,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

const heroImage = "/manus-storage/courtyard-atlas-hero_c3fa4043.png";
const neighborhoodImage = "/manus-storage/courtyard-atlas-neighborhood_2dffa5fa.png";
const markImage = "/manus-storage/courtyard-atlas-mark_2026d7e9.png";

const listings = [
  { id: 1, title: "Bright studio near Mvog-Mbi", city: "Yaoundé", area: "Mvog-Mbi", type: "Studio", rent: 45000, entry: 95000, utilities: 7000, distance: "12 min to central market", verified: true, freshness: "Verified 2 days ago", moderator: "Aline", image: heroImage, owner: "M. Nguema", note: "Quiet courtyard, independent meter, water available." },
  { id: 2, title: "One-bedroom by Bonamoussadi", city: "Douala", area: "Bonamoussadi", type: "1 bedroom", rent: 85000, entry: 175000, utilities: 12000, distance: "18 min to Akwa", verified: true, freshness: "Verified 4 days ago", moderator: "Boris", image: neighborhoodImage, owner: "Mme. Ekambi", note: "Gated compound with shared parking and daylight." },
  { id: 3, title: "Simple room near Ngoa-Ekellé", city: "Yaoundé", area: "Ngoa-Ekellé", type: "Room", rent: 30000, entry: 65000, utilities: 5000, distance: "9 min to university", verified: true, freshness: "Verified yesterday", moderator: "Mireille", image: heroImage, owner: "M. Talla", note: "Good for a student or young worker; landmark-based address." },
  { id: 4, title: "Compact flat in Makepe", city: "Douala", area: "Makepe", type: "1 bedroom", rent: 70000, entry: 145000, utilities: 9000, distance: "15 min to Deido", verified: false, freshness: "Owner-confirmed 8 days ago", moderator: "Pending", image: neighborhoodImage, owner: "Mme. Fofana", note: "Freshness check due soon. Do not send money before a visit." },
  { id: 5, title: "Two-room courtyard home", city: "Yaoundé", area: "Odza", type: "2 bedrooms", rent: 120000, entry: 245000, utilities: 15000, distance: "22 min to Mvan", verified: true, freshness: "Verified 6 days ago", moderator: "Serge", image: routeImageFallback(), owner: "M. Abanda", note: "Family-friendly compound with a shaded outdoor space." },
  { id: 6, title: "Room with shared kitchen", city: "Douala", area: "Deido", type: "Room", rent: 35000, entry: 74000, utilities: 6000, distance: "10 min to transport hub", verified: true, freshness: "Verified 3 days ago", moderator: "Boris", image: heroImage, owner: "M. Essomba", note: "Shared kitchen, reliable transport links, flexible visit times." },
];

function routeImageFallback() { return "/manus-storage/courtyard-atlas-route_ea587d94.png"; }
const formatXaf = (value: number) => `${value.toLocaleString("en-US")} XAF`;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [city, setCity] = useState("All cities");
  const [query, setQuery] = useState("");
  const [maxRent, setMaxRent] = useState(150000);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sort, setSort] = useState("recommended");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [selected, setSelected] = useState<(typeof listings)[number] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [budget, setBudget] = useState(120000);

  const filteredListings = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    const result = listings.filter((listing) => {
      const matchesCity = city === "All cities" || listing.city === city;
      const matchesBudget = listing.rent <= maxRent;
      const matchesVerified = !verifiedOnly || listing.verified;
      const matchesQuery = !normalized || `${listing.title} ${listing.area} ${listing.city} ${listing.type}`.toLowerCase().includes(normalized);
      return matchesCity && matchesBudget && matchesVerified && matchesQuery;
    });
    return [...result].sort((a, b) => sort === "lowest" ? a.rent - b.rent : sort === "entry" ? a.entry - b.entry : Number(b.verified) - Number(a.verified));
  }, [city, maxRent, verifiedOnly, query, sort]);

  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const resetFilters = () => { setCity("All cities"); setQuery(""); setMaxRent(150000); setVerifiedOnly(true); setSort("recommended"); };
  const requestContact = (listing: (typeof listings)[number]) => {
    toast.success("Contact request saved", { description: `${listing.title} — next step: confirm a safe viewing time.` });
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="site-header">
        <div className="container flex items-center justify-between gap-4 py-4">
          <a href="#top" className="brand" aria-label="Affordable Housing Cameroon home"><img src={markImage} alt="Affordable Housing Cameroon mark" className="brand-mark" /><span className="brand-wordmark">AFFORDABLE<br /><em>HOUSING</em> CAMEROON</span></a>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            <a href="#homes">Find a home</a><a href="#how-it-works">How it works</a><a href="#earn">Earn with us</a>
            <button className="nav-cta" onClick={() => toast("Listing intake is ready for the pilot", { description: "The next build will connect owners and agents to a real submission workflow." })}>List a property <ArrowUpRight size={15} /></button>
          </nav>
          <button className="mobile-menu-button lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
        {menuOpen && <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation"><a href="#homes" onClick={() => setMenuOpen(false)}>Find a home</a><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#earn" onClick={() => setMenuOpen(false)}>Earn with us</a></nav>}
      </header>

      <main id="top">
        <section className="market-hero">
          <div className="market-hero-image" style={{ backgroundImage: `linear-gradient(90deg, rgba(19,37,42,.92), rgba(19,37,42,.62) 58%, rgba(19,37,42,.2)), url(${heroImage})` }} />
          <div className="container market-hero-content">
            <div className="market-copy"><div className="eyebrow light"><span className="signal-dot" /> A trusted housing pilot / Cameroon</div><h1>Find a home you can <span>actually afford.</span></h1><p>Search by the cost of entry, neighborhood reality, and the confidence that someone has checked the listing before you visit.</p><div className="market-proof"><span><ShieldCheck size={15} /> Verified listings</span><span><MapPin size={15} /> Yaoundé + Douala</span><span><MessageCircle size={15} /> Safer contact</span></div></div>
            <div className="hero-search-card" role="search"><div className="search-card-kicker"><span>Start with a place</span><span className="live-chip"><i /> Pilot catalogue</span></div><div className="search-main"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Neighborhood, landmark, or home type" aria-label="Search listings" /><button onClick={() => document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" })}>Search</button></div><div className="search-meta"><label>City<select value={city} onChange={(event) => setCity(event.target.value)}><option>All cities</option><option>Yaoundé</option><option>Douala</option></select></label><label>Monthly rent<select value={maxRent} onChange={(event) => setMaxRent(Number(event.target.value))}><option value={50000}>Up to 50k</option><option value={80000}>Up to 80k</option><option value={120000}>Up to 120k</option><option value={150000}>Any price</option></select></label></div></div>
          </div>
        </section>

        <div className="market-route-shell"><aside className="market-route-rail" aria-label="On this page"><span className="rail-label">On this page</span><a href="#homes"><b>01</b> Find a home</a><a href="#how-it-works"><b>02</b> Trust route</a><a href="#budget"><b>03</b> Cost planner</a><a href="#earn"><b>04</b> Shared upside</a><a href="#pilot"><b>05</b> Pilot route</a><p>Search the catalogue, understand the money, then choose the safest next step.</p></aside><div className="market-route-content">
        <section id="homes" className="homes-section section-pad">
          <div className="section-kicker"><span>01</span><span>Catalogue / find your route</span></div>
          <div className="section-heading-row"><div><h2>A smaller catalogue.<br /><i>A clearer decision.</i></h2><p>Every card separates monthly rent from the money needed to move in. Verification is a signal, not a promise of legal title.</p></div><div className="catalogue-count"><strong>{filteredListings.length.toString().padStart(2, "0")}</strong><span>homes matching<br />your route</span></div></div>
          <div className="catalogue-toolbar"><button className="filter-trigger" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16} /> Filters {verifiedOnly ? <span className="filter-count">1</span> : null}</button><div className="toolbar-spacer" /><label className="sort-select"><ArrowDownUp size={14} /><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="lowest">Lowest rent</option><option value="entry">Lowest entry cost</option></select></label></div>
          {showFilters && <div className="filter-panel"><label className="filter-field"><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Odza or studio" /></label><label className="filter-field"><span>City</span><select value={city} onChange={(event) => setCity(event.target.value)}><option>All cities</option><option>Yaoundé</option><option>Douala</option></select></label><label className="filter-field range-field"><span>Rent ceiling <b>{formatXaf(maxRent)}</b></span><input type="range" min="30000" max="150000" step="5000" value={maxRent} onChange={(event) => setMaxRent(Number(event.target.value))} /></label><label className="toggle-field"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} /><span className="fake-toggle" /><span>Verified only</span></label><button className="reset-button" onClick={resetFilters}>Reset</button></div>}
          <div className="listing-grid">{filteredListings.map((listing) => <article className="listing-card" key={listing.id}><div className="listing-image"><img src={listing.image} alt="" /><div className="listing-image-top"><span className={listing.verified ? "verified-pill" : "pending-pill"}>{listing.verified ? <BadgeCheck size={13} /> : <Clock3 size={13} />}{listing.verified ? "Verified" : "Check due"}</span><button className={`favorite-button ${favorites.includes(listing.id) ? "is-favorite" : ""}`} onClick={() => toggleFavorite(listing.id)} aria-label={favorites.includes(listing.id) ? "Remove from saved homes" : "Save home"}><Heart size={17} fill={favorites.includes(listing.id) ? "currentColor" : "none"} /></button></div><span className="listing-city"><MapPin size={12} /> {listing.city} · {listing.area}</span></div><div className="listing-body"><div className="listing-title-row"><div><span className="listing-type">{listing.type}</span><h3>{listing.title}</h3></div><span className="listing-rent"><strong>{formatXaf(listing.rent)}</strong><small>/ month</small></span></div><p className="listing-note">{listing.note}</p><div className="listing-meta"><span><Compass size={14} /> {listing.distance}</span><span><Info size={14} /> {listing.freshness}</span></div><div className="listing-footer"><div><span>Move-in estimate</span><strong>{formatXaf(listing.entry)}</strong></div><button className="small-arrow" onClick={() => setSelected(listing)} aria-label={`View ${listing.title}`}><ArrowUpRight size={17} /></button></div></div></article>)}</div>
          {!filteredListings.length && <div className="empty-state"><Search size={22} /><h3>No homes match that route yet.</h3><p>Try a wider rent ceiling or turn off “Verified only”.</p><button className="button button-dark" onClick={resetFilters}>Reset the search</button></div>}
        </section>

        <section id="how-it-works" className="trust-section section-pad dark-section"><div className="section-kicker light"><span>02</span><span>Trust / how it works</span></div><div className="trust-grid"><div><h2>Trust is not a badge.<br /><i>It is a service.</i></h2><p>We show what was checked, when it was checked, and what still needs your attention before money moves.</p><button className="button button-outline" onClick={() => toast("Safety checklist opened", { description: "Never pay before viewing, confirming the owner, and receiving a written agreement." })}>Read the safety checklist <ArrowUpRight size={16} /></button></div><div className="trust-stack"><div className="trust-row"><span className="trust-step">01</span><div><strong>Freshness over volume</strong><p>Listings expire or drop in ranking when not reconfirmed.</p></div><span className="trust-check"><Check size={15} /></span></div><div className="trust-row"><span className="trust-step">02</span><div><strong>Protected contact</strong><p>Request a visit without broadcasting a private number.</p></div><span className="trust-check"><Check size={15} /></span></div><div className="trust-row"><span className="trust-step">03</span><div><strong>Warn before money moves</strong><p>Receipts and a dispute path are part of the transaction design.</p></div><span className="trust-check"><Check size={15} /></span></div></div></div></section>

        <section className="budget-section section-pad" id="budget"><div className="section-kicker"><span>03</span><span>Affordability / see the whole cost</span></div><div className="budget-grid"><div><h2>Rent is only<br /><i>the first number.</i></h2><p>Use the simple planner to understand whether a home fits the household budget after rent, entry costs, utilities, and a modest transport allowance.</p><div className="budget-callout"><CircleHelp size={18} /><span>Prototype assumption: entry cost includes first month plus deposit and fees shown by the listing.</span></div></div><div className="budget-card"><div className="budget-card-head"><span>Monthly household comfort check</span><strong>{formatXaf(budget)}</strong></div><input type="range" min="50000" max="400000" step="5000" value={budget} onChange={(event) => setBudget(Number(event.target.value))} aria-label="Household monthly budget" /><div className="budget-scale"><span>50k</span><span>400k XAF</span></div><div className="budget-result"><div><span>Recommended max rent</span><strong>{formatXaf(Math.round(budget * .35))}</strong></div><div><span>Budget status</span><strong className={budget >= 120000 ? "good-status" : "caution-status"}>{budget >= 120000 ? "Room to compare" : "Needs a careful route"}</strong></div></div><a href="#homes" className="button button-dark">Show homes in range <ArrowUpRight size={16} /></a></div></div></section>

        <section id="earn" className="earn-section section-pad tinted-section"><div className="section-kicker"><span>04</span><span>Earn / shared value</span></div><div className="section-heading-row"><div><h2>A marketplace that<br /><i>shares the upside.</i></h2><p>Agents and local moderators are not treated as disposable supply. Their work creates the trust layer — and the model makes the earning logic visible.</p></div><div className="earn-mark"><Users size={19} /><span>70 / 20 / 10<br /><small>illustrative split</small></span></div></div><div className="earn-flow"><div><span className="flow-number">70%</span><strong>Agent</strong><p>Viewing, negotiation, paperwork, and deal support.</p></div><div><span className="flow-number">10%</span><strong>Moderator</strong><p>Evidence-led verification and freshness work.</p></div><div><span className="flow-number">20%</span><strong>Platform</strong><p>Catalogue, trust operations, support, and records.</p></div></div><div className="earn-footer"><p>Illustrative only: the split applies to a commission pool, not to rent or deposit. Final fees require local validation.</p><button className="button button-dark" onClick={() => setShowEarnings(!showEarnings)}>{showEarnings ? "Hide earning example" : "See an earning example"}<ChevronDown size={16} className={showEarnings ? "rotate-180" : ""} /></button></div>{showEarnings && <div className="earning-example"><div><span>5 closed deals at 40,000 XAF commission</span><strong>200,000 XAF pool</strong></div><div><span>Agent share</span><strong>140,000 XAF</strong></div><div><span>Moderator share</span><strong>20,000 XAF</strong></div><div><span>Platform share</span><strong>40,000 XAF</strong></div></div>}</section>

        <section id="pilot" className="pilot-section section-pad"><div className="pilot-image"><img src={markImage} alt="" /></div><div><div className="section-kicker"><span>05</span><span>Pilot / ready to validate</span></div><h2>Start small in <i>Yaoundé</i> and <i>Douala.</i></h2><p>Build a catalogue people can believe before scaling the map. This first interface is the public front door; authentication, real listings, messaging, moderation, and licensed settlement come next.</p><div className="pilot-actions"><button className="button button-primary" onClick={() => toast("Pilot interest captured", { description: "The next version will connect this action to a real waitlist." })}>Join the pilot <Bell size={16} /></button><button className="text-link" onClick={() => toast("Owner and agent intake is coming next", { description: "The operating model is ready; the backend workflow is not connected yet." })}>I have a property <ArrowUpRight size={15} /></button></div></div></section>
        </div></div>
      </main>

      {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="listing-modal" role="dialog" aria-modal="true" aria-labelledby="listing-dialog-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Close listing detail"><X size={18} /></button><img src={selected.image} alt="" /><div className="modal-content"><div className="listing-type">{selected.verified ? "Verified listing" : "Freshness check due"}</div><h2 id="listing-dialog-title">{selected.title}</h2><p className="modal-location"><MapPin size={15} /> {selected.city} · {selected.area}</p><div className="modal-money"><div><span>Monthly rent</span><strong>{formatXaf(selected.rent)}</strong></div><div><span>Move-in estimate</span><strong>{formatXaf(selected.entry)}</strong></div><div><span>Utilities estimate</span><strong>{formatXaf(selected.utilities)}</strong></div></div><p>{selected.note}</p><div className="modal-trust"><ShieldCheck size={18} /><span><strong>What was checked:</strong> listing presence, location evidence, and freshness on {selected.freshness.toLowerCase()}.</span></div><div className="modal-actions"><button className="button button-dark" onClick={() => requestContact(selected)}>Request a safe visit <MessageCircle size={16} /></button><button className="button button-outline-dark" onClick={() => toast("Report flow is ready for the next backend phase", { description: "Never send money before a visit and written agreement." })}><Flag size={16} /> Report</button></div></div></div></div>}

      <footer className="site-footer"><div className="container footer-grid"><div className="brand"><img src={markImage} alt="Affordable Housing Cameroon mark" className="brand-mark" /><span className="brand-wordmark">AFFORDABLE<br /><em>HOUSING</em> CAMEROON</span></div><div><span className="footer-label">Pilot principle</span><p>Show the real cost. Verify the route.<br /><strong>Trust first, scale second.</strong></p></div><div><span className="footer-label">Prototype status</span><p>Frontend interactions active<br /><strong>Backend connection next</strong></p></div></div></footer>
    </div>
  );
}
