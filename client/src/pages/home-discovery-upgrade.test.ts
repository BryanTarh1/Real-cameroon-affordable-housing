import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const home = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
const css = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/launch-refinements.css"), "utf8");
const catalogueFirstCss = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.catalogue-first.css"), "utf8");
const visualRefinementCss = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Home.visual-refinement.css"), "utf8");
const locale = fs.readFileSync(path.resolve(process.cwd(), "client/src/lib/marketplaceLocale.ts"), "utf8");
const walkthroughRail = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/PremiumWalkthroughRail.tsx"), "utf8");
const appointments = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ViewingAppointmentConcierge.tsx"), "utf8");
const languageHook = fs.readFileSync(path.resolve(process.cwd(), "client/src/hooks/useMarketplaceLanguage.ts"), "utf8");
const globalCss = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");
const agentConcierge = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/AgentViewingConcierge.tsx"), "utf8");
const agentQuality = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/AgentQualityDashboard.tsx"), "utf8");
const costDisclosure = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/CostDisclosureForm.tsx"), "utf8");
const main = fs.readFileSync(path.resolve(process.cwd(), "client/src/main.tsx"), "utf8");
const sharedVisualSystem = fs.readFileSync(path.resolve(process.cwd(), "client/src/styles/ahc-visual-system.css"), "utf8");

describe("French discovery and media-first property flow", () => {
  it("keeps a persistent English/French language-selection dropdown and translated headline labels", () => {
    expect(languageHook).toContain('AHC_LANGUAGE_STORAGE_KEY = "ahc-language"');
    expect(languageHook).toContain("localStorage.getItem(AHC_LANGUAGE_STORAGE_KEY)");
    expect(languageHook).toContain("localStorage.setItem(AHC_LANGUAGE_STORAGE_KEY, next)");
    expect(home).toContain("setLanguage");
    expect(home).toContain('className="language-select"');
    expect(home).toContain('<option value="en">English</option><option value="fr">Français</option>');
    expect(home).toContain("marketplaceCopy[language]");
    expect(locale).toContain('export type PublicLanguage = "en" | "fr"');
    expect(locale).toContain("Montant total à prévoir");
  });

  it("shows public media and the total before sign-in, then gates the breakdown and map", () => {
    expect(home).toContain("listing-media-preview");
    expect(home).toContain("detail-media-first");
    expect(home.indexOf("detail-media-first")).toBeLessThan(home.indexOf('className="total-panel"'));
    expect(home).toContain('isAuthenticated ? <><div className="detail-breakdown-heading">');
    expect(locale).toContain("Sign in for the cost breakdown and map.");
    expect(home).toContain('className="detail-map-section"');
    expect(home).toContain('className="map-gate-panel"');
  });

  it("does not invoke protected marketplace actions from an anonymous preview", () => {
    expect(home).toContain("if (!isAuthenticated) {");
    expect(locale).toContain('chatWhatsApp: "Chat on WhatsApp"');
    expect(home).toContain("<ViewingAppointmentRequest listing={listing} language={language}");
    expect(home).toContain('className="protected-detail-gate shortlist-panel"');
    expect(home).toContain('onClick={contact}');
  });

  it("contains responsive styles for the new discovery controls", () => {
    expect(css).toContain(".protected-detail-gate");
    expect(css).toContain(".detail-map-section");
    expect(css).toContain(".media-led-market");
    expect(globalCss).toContain(".language-transition");
    expect(globalCss).toContain("prefers-reduced-motion:reduce");
  });

  it("distinguishes live Field Moderator-verified homes from clearly labelled TEST DATA without offering a redundant physical-badge filter", () => {
    expect(home).toContain('className="public-verification-disclosure"');
    expect(home).not.toContain("setVerification");
    expect(home).not.toContain("physicalOnly");
    expect(locale).toContain('publicVerifiedTitle: "Live homes are Field Moderator verified"');
    expect(locale).toContain('publicVerifiedTitle: "Les logements réels sont vérifiés par un modérateur terrain"');
    expect(home).toContain('const isTestFixture = listing.isTestData || listing.title.startsWith("TEST DATA")');
    expect(home).toContain('isTestFixture || hasIllustrativeMedia ? text(language, "illustrativeTestMedia")');
    expect(css).toContain(".public-verification-disclosure");
  });

  it("localizes the remaining public discovery currency and appointment-status surfaces", () => {
    expect(walkthroughRail).toContain('language === "fr" ? "fr-FR" : "en-US"');
    expect(appointments).toContain("function appointmentStatusLabel");
    expect(appointments).toContain('requested: "Demandée — en attente de l’Agent"');
    expect(appointments).toContain('Agent responded — viewing scheduled');
    expect(appointments).toContain('Never send rent, a deposit, or tenancy funds through this request.');
  });

  it("keeps budget guidance, price changes, and low-data choice in the public discovery workflow", () => {
    expect(home).toContain("budgetFitOnly");
    expect(home).toContain("monthlyIncome");
    expect(home).toContain("availableSavings");
    expect(home).toContain("marketplace.priceHistory");
    expect(home).toContain("lowDataMode");
    expect(home).toContain("Data saver on");
  });

  it("opens into compact catalogue-first discovery for Yaoundé and Douala without changing search filters", () => {
    expect(home).toContain('import "./Home.catalogue-first.css";');
    expect(home).toContain('language === "fr" ? "Logements à Yaoundé et Douala" : "Homes across Yaoundé and Douala"');
    expect(home).toContain("const filters = useMemo");
    expect(home).toContain("maxMoveInCash");
    expect(home).toContain("advancedSearchOpen");
    expect(home).toContain("propertyType");
    expect(home).toContain("furnishingStatus");
    expect(home).toContain("minBedrooms");
    expect(home).toContain("maxMonthlyRent");
    expect(home).toContain("availability");
    expect(catalogueFirstCss).toContain(".ahc-app .hero-copy{display:none}");
    expect(catalogueFirstCss).toContain(".ahc-app .hero .search-panel");
    expect(catalogueFirstCss).toContain(".ahc-app .contextual-discovery-collections");
    expect(catalogueFirstCss).toContain(".ahc-app .atlas-index,.ahc-app .route-strip{display:none}");
  });

  it("uses an original high-contrast visual refinement without hiding catalogue trust or privacy signals", () => {
    expect(home).toContain('import "./Home.visual-refinement.css";');
    expect(visualRefinementCss).toContain('"Bricolage Grotesque"');
    expect(visualRefinementCss).toContain('"Plus Jakarta Sans"');
    expect(visualRefinementCss).toContain("--ahc-coral:#d96546");
    expect(visualRefinementCss).toContain(".ahc-app .browse-home-cash");
    expect(visualRefinementCss).toContain(".ahc-app .browse-home-favorite");
    expect(visualRefinementCss).toContain(".ahc-app .public-verification-disclosure");
    expect(visualRefinementCss).toContain("prefers-reduced-motion:reduce");
  });

  it("loads the shared AHC visual system across public and protected page surfaces", () => {
    expect(main).toContain('import "./styles/ahc-visual-system.css";');
    expect(sharedVisualSystem).toContain("--ahc-coral: #9f4741");
    expect(sharedVisualSystem).toContain("--ahc-sun: #b58a45");
    expect(sharedVisualSystem).toContain('"DM Serif Display"');
    expect(sharedVisualSystem).toContain("Elevated AHC layer");
    expect(sharedVisualSystem).toContain(".topbar::after");
    expect(sharedVisualSystem).toContain("--ahc-display");
    expect(sharedVisualSystem).toContain(".operations-page");
    expect(sharedVisualSystem).toContain(".agent-workspace-page");
    expect(sharedVisualSystem).toContain(".acceptance-page");
    expect(sharedVisualSystem).toContain(".property-detail-page-shell");
    expect(sharedVisualSystem).toContain("focus-visible");
    expect(sharedVisualSystem).toContain("prefers-reduced-motion");
  });

  it("adds client-side catalogue sorting, protected favourites, and accessible card previews without weakening discovery filters", () => {
    expect(home).toContain('const [sortMode, setSortMode] = useState<"catalogue" | "price_low" | "newest">("catalogue")');
    expect(home).toContain('value="price_low"');
    expect(home).toContain('value="newest"');
    expect(home).toContain("left.costs.totalMoveInCashRequired - right.costs.totalMoveInCashRequired");
    expect(home).toContain("new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()");
    expect(home).toContain("trpc.marketplace.shortlist.list.useQuery");
    expect(home).toContain("trpc.marketplace.shortlist.save.useMutation");
    expect(home).toContain("trpc.marketplace.shortlist.remove.useMutation");
    expect(home).toContain('className={`browse-home-favorite ${isFavorite ? "is-saved" : ""}`}');
    expect(home).toContain('className="browse-home-preview"');
    expect(home).toContain('className="browse-home-preview-action"');
    expect(css).toContain(".browse-home-favorite");
    expect(css).toContain(".browse-home-preview-action");
    expect(locale).toContain('saveFavorite: "Save to favourites"');
    expect(locale).toContain('saveFavorite: "Enregistrer en favoris"');
  });

  it("opens property details on a dedicated route in a new tab without removing protected detail safeguards", () => {
    expect(home).toContain('window.open(`/property/${encodeURIComponent(listing.id)}`, "_blank", "noopener,noreferrer")');
    expect(home).toContain('export default function Home({ directListingId }: { directListingId?: string })');
    expect(home).toContain('function ListingDetail({ listing, onClose, onSelectRelated, language, isAuthenticated, standalone = false }');
    expect(home).toContain('className="property-detail-page-shell"');
    expect(home).toContain('className={standalone ? "property-detail-surface" : "listing-modal"}');
    expect(home).toContain('className="property-route-topbar"');
    expect(home).toContain('className="map-gate-panel"');
    expect(home).toContain('<ViewingAppointmentRequest listing={listing} language={language}');
    expect(css).toContain('.property-detail-page-shell');
    expect(css).toContain('.property-detail-surface');
    expect(css).toContain('.property-route-topbar');
  });

  it("keeps availability reconfirmation, structured outcomes, and Agent quality linked to protected APIs", () => {
    expect(appointments).toContain("recordSeekerOutcome");
    expect(agentConcierge).toContain("reconfirmAvailability");
    expect(agentQuality).toContain("agent.qualityDashboard");
    expect(costDisclosure).toContain("agent.updateCosts");
  });
});
