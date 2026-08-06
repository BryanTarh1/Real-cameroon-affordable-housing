/**
 * Courtyard Atlas design reminder: editorial African modernism, warm paper surfaces,
 * Mango Ochre wayfinding, ink navy trust signals, asymmetric atlas-like layouts.
 */
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  Compass,
  Database,
  Flag,
  HeartHandshake,
  House,
  Layers3,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

const heroImage = "/manus-storage/courtyard-atlas-hero_c3fa4043.png";
const neighborhoodImage = "/manus-storage/courtyard-atlas-neighborhood_2dffa5fa.png";
const routeImage = "/manus-storage/courtyard-atlas-route_ea587d94.png";
const markImage = "/manus-storage/courtyard-atlas-mark_2026d7e9.png";

const chapters = [
  { id: "context", label: "Context", number: "01" },
  { id: "users", label: "Users", number: "02" },
  { id: "requirements", label: "Requirements", number: "03" },
  { id: "trust", label: "Trust & safety", number: "04" },
  { id: "architecture", label: "Architecture", number: "05" },
  { id: "roadmap", label: "MVP & roadmap", number: "06" },
];

const personas = [
  { icon: Users, name: "Household seeker", copy: "Compare homes by the cost that actually matters: rent, upfront payment, utilities, and commute.", tag: "Core audience" },
  { icon: Compass, name: "Student or young worker", copy: "Find a room or shared home near campus or work, even when the address is described by landmarks.", tag: "High mobility" },
  { icon: House, name: "Owner or agent", copy: "Publish a clear listing, confirm availability, and build trust without exposing a private number by default.", tag: "Supply side" },
  { icon: ShieldCheck, name: "Local moderator", copy: "Keep the catalogue real through freshness checks, evidence review, and fast abuse handling.", tag: "Trust layer" },
];

const requirementGroups = {
  "Search & cost": ["Public search without an account", "City, neighborhood, landmark and free-text search", "Rent, upfront cost and recurring charges shown separately", "Filters for type, size, equipment and availability"],
  "Listing & contact": ["Guided listing creation with photo compression", "Availability confirmation and automatic expiry", "Protected contact request and internal messaging", "Simple visit planning with reminders"],
  "Trust & operations": ["Graduated verification badges with plain-language meaning", "Fraud, duplicate and inaccurate-information reporting", "Human moderation queue with audit history", "Rate limits and alerts for suspicious patterns"],
};

const launchCities = [
  { city: "Yaoundé", reason: "Pilot city", detail: "Start with a high-need urban market where affordability and informal addressing intersect." },
  { city: "Douala", reason: "Pilot city", detail: "Validate the model in a dense, highly mobile rental market with strong neighborhood variation." },
  { city: "Bafoussam", reason: "Next horizon", detail: "Extend after catalogue quality and local operating routines are proven." },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<keyof typeof requirementGroups>("Search & cost");
  const [showMore, setShowMore] = useState(false);
  const visibleChapters = useMemo(() => chapters, []);

  const handlePlaceholder = (label: string) => toast(`${label} is part of the next product phase.`);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="site-header">
        <div className="container flex items-center justify-between gap-4 py-4">
          <a href="#top" className="brand" aria-label="Affordable Housing Cameroon home">
            <img src={markImage} alt="Courtyard Atlas mark" className="brand-mark" />
            <span className="brand-wordmark">AFFORDABLE<br /><em>HOUSING</em> CAMEROON</span>
          </a>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
            <a href="#context">The brief</a>
            <a href="#requirements">Product map</a>
            <a href="#roadmap">Launch route</a>
            <button className="nav-cta" onClick={() => handlePlaceholder("Founder brief")}>Founder brief <ArrowUpRight size={15} /></button>
          </nav>
          <button className="mobile-menu-button lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {menuOpen && <nav className="mobile-nav lg:hidden" aria-label="Mobile navigation">{chapters.map((chapter) => <a key={chapter.id} href={`#${chapter.id}`} onClick={() => setMenuOpen(false)}>{chapter.number} / {chapter.label}</a>)}</nav>}
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-image" style={{ backgroundImage: `linear-gradient(90deg, rgba(19, 37, 42, .88) 0%, rgba(19, 37, 42, .62) 47%, rgba(19, 37, 42, .1) 100%), url(${heroImage})` }} />
          <div className="container hero-content">
            <div className="hero-copy">
              <div className="eyebrow light"><span className="signal-dot" /> Product blueprint / Cameroon, 2026</div>
              <h1>Make the <span>real cost</span> of home visible.</h1>
              <p className="hero-lede">A practical requirements map for a safer, more affordable housing discovery platform — built around trust, local context, and the first visit.</p>
              <div className="hero-actions"><a href="#requirements" className="button button-primary">Explore the product map <ArrowUpRight size={17} /></a><a href="#context" className="text-link light-link">Read the brief <span>↓</span></a></div>
            </div>
            <aside className="hero-card">
              <div className="hero-card-kicker"><span>Launch thesis</span><span className="pulse-status"><i /> Ready to validate</span></div>
              <div className="hero-card-number">02</div>
              <p>Start in <strong>Yaoundé</strong> and <strong>Douala</strong>. Build a small catalogue people can trust before scaling the map.</p>
              <div className="hero-card-footer"><span>Trust first</span><span>Scale second <ArrowUpRight size={15} /></span></div>
            </aside>
          </div>
        </section>

        <div className="atlas-shell">
          <aside className="chapter-rail" aria-label="On this page">
            <div className="rail-label">On this page</div>
            {visibleChapters.map((chapter) => <a key={chapter.id} href={`#${chapter.id}`}><span>{chapter.number}</span>{chapter.label}</a>)}
            <div className="rail-note">A field guide for founders, product teams, and local housing operators.</div>
          </aside>

          <div className="atlas-content">
            <section className="intro-section section-pad">
              <div className="section-kicker"><span>00</span><span>The brief</span></div>
              <div className="intro-grid">
                <h2>Not another listing board.<br /><i>A trust service.</i></h2>
                <div className="intro-copy"><p>The product succeeds when a person can discover a real home, understand the money required to enter it, and contact the right person without losing time or sending money too early.</p><p>Affordability is not only the monthly rent. It is the full cost of entry, utilities, transport, safety, and the confidence that the listing is still real.</p><a className="text-link" href="#trust">See the trust model <ArrowUpRight size={16} /></a></div>
              </div>
              <div className="stat-strip"><div><strong>1.8–2M</strong><span>estimated housing deficit <sup>[1]</sup></span></div><div><strong>3.63%</strong><span>annual urban population growth <sup>[2]</sup></span></div><div><strong>02</strong><span>recommended pilot cities</span></div><div><strong>100%</strong><span>of active listings need freshness signals</span></div></div>
            </section>

            <section id="context" className="context-section section-pad">
              <div className="section-kicker"><span>01</span><span>Context / the ground</span></div>
              <div className="split-feature"><div className="feature-image image-frame"><img src={neighborhoodImage} alt="A sunlit courtyard in a Cameroonian neighborhood" /><span className="image-caption">Neighborhoods are the interface.</span></div><div className="feature-copy"><h2>Local context is a product requirement.</h2><p>More than half of Cameroonians now live in towns, while urban growth continues to put pressure on housing access. In Yaoundé, many households live in informal settlements where land is cheaper and formal addressing is imperfect. <sup>[2]</sup></p><div className="note-card"><span className="note-icon"><Flag size={18} /></span><div><strong>Design implication</strong><p>Search must work with neighborhoods, landmarks, roads, schools, and markets — not only with formal postal addresses.</p></div></div><div className="mini-list"><div><Check size={16} /> Mobile-first, low-data experience</div><div><Check size={16} /> French + English from day one</div><div><Check size={16} /> FCFA and local cost vocabulary</div></div></div></div>
            </section>

            <section id="users" className="users-section section-pad tinted-section">
              <div className="section-kicker"><span>02</span><span>People / the route</span></div>
              <div className="section-heading-row"><div><h2>Four people shape the product.</h2><p>Each one sees “affordable” through a different constraint.</p></div><span className="chapter-stamp">USER<br />MAP</span></div>
              <div className="persona-grid">{personas.map(({ icon: Icon, name, copy, tag }, index) => <article className="persona-card" key={name}><div className="persona-top"><span className="persona-index">0{index + 1}</span><Icon size={22} strokeWidth={1.6} /></div><span className="persona-tag">{tag}</span><h3>{name}</h3><p>{copy}</p><a href="#requirements" className="card-link">Trace the need <ArrowUpRight size={15} /></a></article>)}</div>
            </section>

            <section id="requirements" className="requirements-section section-pad">
              <div className="section-kicker"><span>03</span><span>Product / the map</span></div>
              <div className="section-heading-row"><div><h2>Requirements that earn their place.</h2><p>The MVP is a focused route from search to a credible first contact.</p></div><div className="feature-badge"><Layers3 size={17} /><span>31<br /><small>mapped requirements</small></span></div></div>
              <div className="requirement-switcher" role="tablist" aria-label="Requirement groups">{Object.keys(requirementGroups).map((group) => <button key={group} role="tab" aria-selected={activeGroup === group} className={activeGroup === group ? "active" : ""} onClick={() => setActiveGroup(group as keyof typeof requirementGroups)}>{group}</button>)}</div>
              <div className="requirement-panel"><div className="requirement-panel-art" style={{ backgroundImage: `url(${routeImage})` }}><span>FR<br />MAP</span></div><div className="requirement-list">{requirementGroups[activeGroup].map((item, index) => <div className="requirement-row" key={item}><span className="requirement-number">{String(index + 1).padStart(2, "0")}</span><span>{item}</span><CircleCheck size={17} /></div>)}<button className="expand-button" onClick={() => setShowMore(!showMore)}>{showMore ? "Show less" : "View acceptance criteria"}<ChevronDown size={16} className={showMore ? "rotate-180" : ""} /></button>{showMore && <div className="acceptance-note"><strong>Acceptance lens</strong><p>Every requirement should be testable on a low-end mobile device, explain its trust implications, and show the user what happens next.</p></div>}</div></div>
            </section>

            <section id="trust" className="trust-section section-pad dark-section">
              <div className="section-kicker light"><span>04</span><span>Trust / the guardrail</span></div>
              <div className="trust-grid"><div><h2>Trust is not a badge.<br /><i>It is a service.</i></h2><p>Fraud prevention, freshness, and transparent uncertainty are the core experience — not a compliance footnote.</p><a href="#roadmap" className="button button-outline">See the operating route <ArrowUpRight size={16} /></a></div><div className="trust-stack"><div className="trust-row"><span className="trust-step">01</span><div><strong>Confirm the contact</strong><p>Phone or email verification is visible, never implied.</p></div><span className="trust-check"><Check size={15} /></span></div><div className="trust-row"><span className="trust-step">02</span><div><strong>Freshness over volume</strong><p>Listings expire or drop in ranking when not reconfirmed.</p></div><span className="trust-check"><Check size={15} /></span></div><div className="trust-row"><span className="trust-step">03</span><div><strong>Warn before money moves</strong><p>Users see clear payment-risk guidance before contact.</p></div><span className="trust-check"><Check size={15} /></span></div></div></div>
            </section>

            <section id="architecture" className="architecture-section section-pad">
              <div className="section-kicker"><span>05</span><span>System / under the surface</span></div>
              <div className="architecture-layout"><div><h2>A light stack.<br /><i>A strong operating model.</i></h2><p>The first release should favor explainable search and clean data over premature machine learning. The platform is a mobile-first client, a secure API, a structured catalogue, media storage, notifications, moderation, and audit logs.</p><div className="stack-pills"><span><Database size={15} /> Structured catalogue</span><span><ShieldCheck size={15} /> Secure API</span><span><HeartHandshake size={15} /> Human moderation</span></div></div><div className="architecture-card"><div className="architecture-card-head"><span>Reference architecture</span><span>v0.1</span></div><div className="architecture-line"><div className="arch-node accent"><Sparkles size={16} /> Mobile-first client</div><div className="arch-connector" /><div className="arch-node"><Database size={16} /> API + catalogue</div><div className="arch-connector" /><div className="arch-node"><ShieldCheck size={16} /> Trust operations</div></div><div className="architecture-foot">PostgreSQL · object storage · SMS / WhatsApp integrations · structured logs</div></div></div>
            </section>

            <section id="roadmap" className="roadmap-section section-pad tinted-section">
              <div className="section-kicker"><span>06</span><span>Launch / the route</span></div>
              <div className="section-heading-row"><div><h2>Start where trust can be built.</h2><p>Two cities. One clear job. A catalogue people can believe.</p></div><span className="route-marker">A → B</span></div>
              <div className="city-list">{launchCities.map((item, index) => <div className={`city-row ${index === 2 ? "muted-row" : ""}`} key={item.city}><span className="city-number">0{index + 1}</span><div className="city-name"><h3>{item.city}</h3><span>{item.reason}</span></div><p>{item.detail}</p><span className="city-arrow"><ArrowUpRight size={18} /></span></div>)}</div>
              <div className="roadmap-footer"><div><strong>Recommended MVP:</strong> public search, cost transparency, guided listings, contact protection, human moderation, and freshness checks.</div><button className="button button-dark" onClick={() => handlePlaceholder("Pilot plan")}>Open pilot plan <ArrowUpRight size={16} /></button></div>
            </section>

            <section className="closing-section section-pad"><div className="closing-mark"><img src={markImage} alt="" /></div><div><div className="eyebrow">The decision in one line</div><h2>Build a small catalogue people can trust <i>before</i> you scale the map.</h2><p>The opportunity is not another marketplace. It is a local confidence layer between a household, a home, and the first visit.</p><a className="text-link" href="#top">Return to the beginning <span>↑</span></a></div></section>
          </div>
        </div>
      </main>

      <footer className="site-footer"><div className="container footer-grid"><div className="brand"><img src={markImage} alt="Courtyard Atlas mark" className="brand-mark" /><span className="brand-wordmark">AFFORDABLE<br /><em>HOUSING</em> CAMEROON</span></div><div><span className="footer-label">Sources</span><p>[1] CAHF — Cameroon country detail<br />[2] UN-Habitat — Urbanization in Cameroon</p></div><div><span className="footer-label">Blueprint status</span><p>Requirements mapped<br /><strong>Ready for discovery</strong></p></div></div></footer>
    </div>
  );
}
