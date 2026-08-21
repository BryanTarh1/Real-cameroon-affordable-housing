import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ApproximateMap, type MapListing } from "@/components/ApproximateMap";
import { trpc } from "@/lib/trpc";
import { daysUntilRefresh, relativeReconfirmed } from "@/lib/listingFreshness";
import { publicWalkthroughForDetail } from "@/lib/publicWalkthrough";
import { catalogueInteractionCopy, interpolate, marketplaceCopy, text, type PublicLanguage } from "@/lib/marketplaceLocale";
import { useMarketplaceLanguage } from "@/hooks/useMarketplaceLanguage";
import { AgentAccountPanel } from "@/pages/AgentAccountPanel";
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import { PremiumWalkthroughRail } from "@/components/PremiumWalkthroughRail";
import { SeekerMatchAlerts } from "@/components/SeekerMatchAlerts";
import { SeekerAppointmentHistory, ViewingAppointmentRequest } from "@/components/ViewingAppointmentConcierge";
import { BadgeCheck, Bath, BedDouble, Building2, CarFront, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, Heart, MapPinned, Menu, MessageCircle, Share2, ShieldCheck, Sparkles, Video, X } from "lucide-react";
import { toast } from "sonner";
import "./launch-refinements.css";
import "./Home.search-skeleton.css";
import "./Home.catalogue-first.css";
import "./Home.visual-refinement.css";

const formatXaf = (value: number, language: PublicLanguage = "en") => `${new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(value)} XAF`;
type Language = PublicLanguage;
const furnishingCopy = {
  en: { label: "Furnishing", any: "Any furnishing", not_stated: "Not stated", unfurnished: "Unfurnished", partly_furnished: "Partly furnished", fully_furnished: "Fully furnished", monthlyRent: "Maximum monthly rent", anyRent: "Any monthly rent", bedrooms: "Bedrooms", anyBedrooms: "Any number" },
  fr: { label: "Ameublement", any: "Tout ameublement", not_stated: "Non précisé", unfurnished: "Non meublé", partly_furnished: "Partiellement meublé", fully_furnished: "Meublé", monthlyRent: "Loyer mensuel maximum", anyRent: "Tout loyer mensuel", bedrooms: "Chambres", anyBedrooms: "Tout nombre" },
} as const;

type Listing = MapListing & {
  createdAt: Date | string;
  isTestData: boolean;
  landmark: string;
  propertyType: string;
  furnishingStatus: "not_stated" | "unfurnished" | "partly_furnished" | "fully_furnished";
  description: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  amenities: string[];
  householdFit: string | null;
  availableFrom: Date | string;
  lastReconfirmed: Date | string;
  verificationExpiresAt: Date | string | null;
  supplyCapacity: "agent_representative" | "direct_owner";
  photosCount: number;
  publicMedia: { url: string; kind: "exterior" | "interior" | "bathroom" | "other"; provenance: "moderator_captured" | "moderator_captured_test_data" | "illustrative_test_data"; displayOrder: number }[];
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

function PropertyFacts({ listing, language, detail = false }: { listing: Listing; language: Language; detail?: boolean }) {
  const labels = language === "fr"
    ? { bedrooms: "chambres", bathrooms: "salles de bain", parking: "parking", amenities: "Commodités de la zone" }
    : { bedrooms: "bedrooms", bathrooms: "bathrooms", parking: "parking", amenities: "Area amenities" };
  return <div className={detail ? "property-facts property-facts-detail" : "property-facts"}>
    <span><BedDouble size={16} aria-hidden="true" /><b>{listing.bedrooms}</b> {labels.bedrooms}</span>
    <span><Bath size={16} aria-hidden="true" /><b>{listing.bathrooms}</b> {labels.bathrooms}</span>
    <span><CarFront size={16} aria-hidden="true" /><b>{listing.parkingSpaces}</b> {labels.parking}</span>
    {listing.amenities.length ? <div className="area-amenities"><small>{labels.amenities}</small><div>{listing.amenities.map(amenity => <i key={amenity}>{amenity}</i>)}</div></div> : null}
  </div>;
}

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

function TrustPassport({ listing, language }: { listing: Listing; language: Language }) {
  const isFrench = language === "fr";
  const verified = listing.verificationStatus === "physical_verified";
  const hasIllustrativeMedia = listing.publicMedia.some(media => media.provenance === "illustrative_test_data");
  const reviewDate = new Intl.DateTimeFormat(isFrench ? "fr-FR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(listing.lastReconfirmed));
  const expiryDate = listing.verificationExpiresAt ? new Intl.DateTimeFormat(isFrench ? "fr-FR" : "en-GB", { day: "numeric", month: "short" }).format(new Date(listing.verificationExpiresAt)) : null;
  const mediaLabel = hasIllustrativeMedia
    ? text(language, "illustrativeTestMedia")
    : listing.publicMedia.length
    ? isFrench ? `${listing.publicMedia.length} photo(s) publique(s) approuvée(s)` : `${listing.publicMedia.length} approved public photo(s)`
    : listing.walkthrough ? isFrench ? "Visite vidéo publique approuvée" : "Approved public walkthrough"
      : isFrench ? "Média public en attente" : "Public media pending";
  return <section className="trust-passport" aria-label={isFrench ? "Passeport de confiance" : "Trust Passport"}>
    <div className="trust-passport-heading"><span><ShieldCheck size={16} /> {isFrench ? "PASSEPORT DE CONFIANCE" : "TRUST PASSPORT"}</span><b>{verified ? isFrench ? "Vérification terrain actuelle" : "Current field verification" : isFrench ? "Vérification en attente" : "Verification pending"}</b></div>
    <p>{isFrench ? "Ce résumé explique ce qui est confirmé publiquement. Les preuves privées et l’adresse exacte restent protégées." : "This summary explains what is publicly confirmed. Private evidence and the exact address remain protected."}</p>
    <div className="trust-passport-grid">
      <div><BadgeCheck size={17} /><span><small>{isFrench ? "Contrôle terrain" : "Field check"}</small><b>{verified ? isFrench ? "Modérateur terrain confirmé" : "Field Moderator confirmed" : isFrench ? "Pas encore confirmé" : "Not yet confirmed"}</b><em>{isFrench ? `Reconfirmée le ${reviewDate}` : `Reconfirmed ${reviewDate}`}{expiryDate ? ` · ${isFrench ? "à renouveler avant le" : "refresh by"} ${expiryDate}` : ""}</em></span></div>
      <div><Video size={17} /><span><small>{isFrench ? "Médias publics" : "Public media"}</small><b>{mediaLabel}</b><em>{hasIllustrativeMedia ? text(language, "illustrativeTestMediaBody") : isFrench ? "Uniquement les médias approuvés sont affichés." : "Only approved media is displayed."}</em></span></div>
      <div><Sparkles size={17} /><span><small>{isFrench ? "Coût d’entrée" : "Move-in cost"}</small><b>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</b><em>{isFrench ? "Total annoncé avant la visite, pas seulement le loyer." : "Disclosed before a viewing, not rent alone."}</em></span></div>
      <div><MapPinned size={17} /><span><small>{isFrench ? "Protection du lieu" : "Location protection"}</small><b>{isFrench ? `Zone autour d’un repère · ${listing.map.radiusM} m` : `Landmark area · ${listing.map.radiusM}m`}</b><em>{isFrench ? "Les directions exactes suivent seulement une visite confirmée." : "Exact directions follow only a confirmed viewing."}</em></span></div>
    </div>
  </section>;
}

function ListingCard({ listing, onOpen, language, lowData = false }: { listing: Listing; onOpen: () => void; language: Language; lowData?: boolean }) {
  const days = daysUntilRefresh(listing.lastReconfirmed);
  const ownershipLabel = listing.supplyCapacity === "direct_owner" ? text(language, "directOwner") : text(language, "managingAgent");
  const walkthrough = publicWalkthroughForDetail(listing.walkthrough);
  const hasPublicWalkthrough = Boolean(walkthrough) && !lowData;
  const isPhysicallyVerified = listing.verificationStatus === "physical_verified";
  const primaryPhoto = listing.publicMedia[0] ?? null;
  const hasIllustrativeMedia = listing.publicMedia.some(media => media.provenance === "illustrative_test_data");
  return <article className={`listing-card ${listing.featured ? "is-featured" : ""}`}>
    <button type="button" className="listing-media-preview" onClick={onOpen} aria-label={`${listing.title} — ${hasPublicWalkthrough ? text(language, "videoTour") : primaryPhoto ? text(language, "photoPreview") : isPhysicallyVerified ? text(language, "walkthroughPending") : text(language, "photoPreview")}. ${text(language, "viewCosts")}`}>{hasPublicWalkthrough ? <video src={walkthrough!.url} muted autoPlay loop playsInline preload="metadata" aria-hidden="true" /> : primaryPhoto ? <img className="approved-public-photo" style={{ width: "100%", height: "190px", objectFit: "cover", display: "block" }} src={primaryPhoto.url} alt={`${listing.title} — ${primaryPhoto.kind} ${text(language, "photoPreview")}`} /> : <div className="photo-preview-placeholder media-unavailable"><CircleAlert size={24} /><span>{lowData ? "Data saver: media on tap" : isPhysicallyVerified ? text(language, "walkthroughPending") : `${listing.photosCount} ${text(language, "photosAvailable")}`}</span>{isPhysicallyVerified && !lowData ? <small>{text(language, "walkthroughPendingBody")}</small> : null}</div>}<span className="media-preview-label">{hasPublicWalkthrough ? text(language, "videoTour") : primaryPhoto?.provenance === "illustrative_test_data" ? text(language, "illustrativeTestMedia") : primaryPhoto ? text(language, "photoPreview") : isPhysicallyVerified ? text(language, "walkthroughPending") : text(language, "photoPreview")}</span><span className="media-move-in-cash"><small>{text(language, "totalCash")}</small><strong>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</strong></span><span className="media-open-detail">{text(language, "viewCosts")} <span aria-hidden="true">→</span></span></button>
    <div className="listing-total listing-total-media-first"><span>{text(language, "totalCash")}</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</strong><small>{text(language, "notOnlyRent")}</small></div>
    <div className="listing-card-top"><div><span className="listing-city">{listing.city} / {listing.neighborhood}</span><h3>{listing.title}</h3><p>{listing.propertyType}{listing.householdFit ? ` · ${listing.householdFit}` : ""} · {furnishingCopy[language][listing.furnishingStatus]}</p></div>{listing.featured && <span className="featured-tag"><Sparkles size={13} /> {text(language, "featured")}</span>}</div>
    <p className="listing-description-preview">{listing.description}</p>
    {hasIllustrativeMedia && <p className="listing-illustrative-media-note"><CircleAlert size={14} /> {text(language, "illustrativeTestMedia")}</p>}
    <PropertyFacts listing={listing} language={language} />
    <div className="listing-source" data-ownership={listing.supplyCapacity}><Building2 size={15} /><span><small>{text(language, "listedBy")}</small><b>{ownershipLabel} · {listing.agent.name}</b></span></div>
    {listing.trust.guaranteedTotalCash && <div className="guarantee-seal"><ShieldCheck size={15} /><span><b>{text(language, "guaranteedCash")}</b><small>{text(language, "guaranteeNoDispute")}</small></span></div>}
    {listing.neighborhoodEssentials && <div className="listing-essentials"><span>{listing.neighborhoodEssentials.roadAccess === "tarred_to_gate" ? text(language, "tarredGate") : listing.neighborhoodEssentials.roadAccess === "dirt_track_to_gate" ? text(language, "dirtTrack") : text(language, "roadAssessed")}</span>{listing.neighborhoodEssentials.junctionName && <span>{listing.neighborhoodEssentials.junctionMinutes ?? "?"} {text(language, "minTo")} {listing.neighborhoodEssentials.junctionName}</span>}</div>}
    {listing.trust.badges.length > 0 && <div className="listing-badges">{listing.trust.badges.map(badge => <span key={badge.code}><BadgeCheck size={12} /> {badge.label}</span>)}</div>}
    {publicWalkthroughForDetail(listing.walkthrough) && <div className="listing-walkthrough-available"><Video size={14} /><span>{listing.isTestData ? text(language, "testTour") : text(language, "approvedTour")}</span></div>}
    <div className="listing-split"><span>{text(language, "monthlyRent")} <b>{formatXaf(listing.costs.monthlyRent, language)}</b></span><span><MapPinned size={14} /> {listing.map.radiusM}m {text(language, "landmarkArea")}</span></div>
    <div className="listing-trust-row"><span className={listing.verificationStatus === "physical_verified" ? "trust-positive" : "trust-neutral"}>{listing.verificationStatus === "physical_verified" ? <BadgeCheck size={15} /> : <Clock3 size={15} />}{listing.verificationStatus === "physical_verified" ? text(language, "physicallyVerified") : text(language, "notPhysicallyVerified")}<small>{listing.verificationStatus === "physical_verified" ? ` · ${text(language, "moderatorVisitPassed")}` : ` · ${text(language, "noModeratorVisit")}`}</small></span><span className="freshness-relative freshness-indicator" aria-label={`${text(language, "reconfirmed")} ${relativeReconfirmed(listing.lastReconfirmed, language)}`}><Clock3 size={14} /> {text(language, "reconfirmed")} {relativeReconfirmed(listing.lastReconfirmed, language)} <small>· {days} {days === 1 ? text(language, "dayLeft") : text(language, "daysLeft")}</small></span></div>
    <button className="card-action" onClick={onOpen}>{text(language, "viewCosts")} <span>→</span></button>
  </article>;
}

function BrowseHomeTile({ listing, onOpen, onToggleFavorite, isFavorite, favoriteBusy, language, lowData = false }: { listing: Listing; onOpen: () => void; onToggleFavorite: () => void; isFavorite: boolean; favoriteBusy: boolean; language: Language; lowData?: boolean }) {
  const walkthrough = publicWalkthroughForDetail(listing.walkthrough);
  const primaryPhoto = listing.publicMedia[0] ?? null;
  const hasIllustrativeMedia = listing.publicMedia.some(media => media.provenance === "illustrative_test_data");
  const isTestFixture = listing.isTestData || listing.title.startsWith("TEST DATA");
  const isFrench = language === "fr";
  const interactionLabels = catalogueInteractionCopy[language];
  const isVerified = listing.verificationStatus === "physical_verified";
  const facts = `${listing.bedrooms} ${isFrench ? "ch." : "bed"} · ${listing.bathrooms} ${isFrench ? "sdb" : "bath"} · ${listing.parkingSpaces} ${isFrench ? "park." : "park"}`;
  const amenitySummary = listing.amenities.length ? listing.amenities.slice(0, 3).join(" · ") : isFrench ? "Détails de la zone dans l’annonce complète" : "Area details in the full listing";
  return <article className="browse-home-tile">
    <button type="button" className="browse-home-media" onClick={onOpen} aria-label={`${listing.title} — ${text(language, "viewCosts")}`}>
      {!lowData && walkthrough ? <video src={walkthrough.url} muted autoPlay loop playsInline preload="metadata" aria-hidden="true" /> : primaryPhoto ? <img src={primaryPhoto.url} alt={`${listing.title} — ${text(language, "photoPreview")}`} /> : <div className="browse-home-media-empty"><CircleAlert size={20} /><span>{text(language, "walkthroughPending")}</span></div>}
      <span className="browse-home-status">{isTestFixture || hasIllustrativeMedia ? text(language, "illustrativeTestMedia") : isVerified ? text(language, "physicallyVerified") : text(language, "photoPreview")}</span>
      <span className="browse-home-cash"><small>{text(language, "totalCash")}</small><b>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</b></span>
      <span className="browse-home-open">{isFrench ? "Ouvrir" : "Open"} <span aria-hidden="true">↗</span></span>
    </button>
    <button type="button" className={`browse-home-favorite ${isFavorite ? "is-saved" : ""}`} aria-pressed={isFavorite} aria-label={`${isFavorite ? interactionLabels.removeFavorite : interactionLabels.saveFavorite}: ${listing.title}`} disabled={favoriteBusy} onClick={onToggleFavorite}><Heart size={17} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" /></button>
    <div className="browse-home-preview" aria-hidden="true"><span>{interactionLabels.areaAmenities}</span><p>{amenitySummary}</p></div>
    <button type="button" className="browse-home-preview-action" onClick={onOpen}>{interactionLabels.viewDetails} <span aria-hidden="true">→</span></button>
    <button type="button" className="browse-home-copy" onClick={onOpen}>
      <span className="browse-home-place">{listing.city} · {listing.neighborhood}</span>
      <h3>{listing.title}</h3>
      <p className="browse-home-facts">{facts}</p>
      <div className="browse-home-rent"><span>{text(language, "monthlyRent")}</span><b>{formatXaf(listing.costs.monthlyRent, language)}</b></div>
      <div className="browse-home-meta"><span><Clock3 size={13} /> {text(language, "reconfirmed")} {relativeReconfirmed(listing.lastReconfirmed, language)}</span><span><MapPinned size={13} /> {listing.map.radiusM}m</span></div>
    </button>
  </article>;
}

function ContextualHomeShelf({ eyebrow, title, body, listings, language, onOpen, onToggleFavorite, savedListingIds, favoriteBusy, lowData = false }: { eyebrow: string; title: string; body: string; listings: Listing[]; language: Language; onOpen: (listing: Listing) => void; onToggleFavorite: (listing: Listing) => void; savedListingIds: Set<string>; favoriteBusy: boolean; lowData?: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollRail = (direction: -1 | 1) => railRef.current?.scrollBy({ left: direction * Math.max(280, railRef.current.clientWidth * 0.72), behavior: "smooth" });
  if (!listings.length) return null;
  return <section className="contextual-home-shelf">
    <header className="contextual-shelf-heading">
      <div><span>{eyebrow}</span><h2>{title}</h2><p>{body}</p></div>
      {listings.length > 1 ? <div className="shelf-controls" aria-label={language === "fr" ? "Navigation de la collection" : "Collection navigation"}><button type="button" onClick={() => scrollRail(-1)} aria-label={language === "fr" ? "Voir les logements précédents" : "View previous homes"}><ChevronLeft size={19} /></button><button type="button" onClick={() => scrollRail(1)} aria-label={language === "fr" ? "Voir les logements suivants" : "View next homes"}><ChevronRight size={19} /></button></div> : null}
    </header>
    <div className="contextual-home-rail" ref={railRef} role="list" aria-label={title}>{listings.map(listing => <div role="listitem" key={listing.id}><BrowseHomeTile listing={listing} language={language} lowData={lowData} isFavorite={savedListingIds.has(listing.id)} favoriteBusy={favoriteBusy} onToggleFavorite={() => onToggleFavorite(listing)} onOpen={() => onOpen(listing)} /></div>)}</div>
  </section>;
}

function ListingDetail({ listing, onClose, onSelectRelated, language, isAuthenticated, standalone = false }: { listing: Listing; onClose: () => void; onSelectRelated: (listing: Listing) => void; language: Language; isAuthenticated: boolean; standalone?: boolean }) {
  const utils = trpc.useUtils();
  const walkthrough = publicWalkthroughForDetail(listing.walkthrough);
  const related = trpc.marketplace.related.useQuery({ listingId: listing.id, city: listing.city, propertyType: listing.propertyType, minBedrooms: listing.bedrooms, maxMonthlyRent: listing.costs.monthlyRent, neighborhood: listing.neighborhood });
  const relatedListings = (related.data ?? []) as Listing[];
  const isNonProductionFixture = listing.title.startsWith("TEST DATA") || listing.isTestData;
  const hasIllustrativeMedia = listing.publicMedia.some(media => media.provenance === "illustrative_test_data");
  const recordView = trpc.account.recordView.useMutation();
  const [reporting, setReporting] = useState(false);
  const [note, setNote] = useState("");
  const [reportCaptchaToken, setReportCaptchaToken] = useState("");
  const [reportCaptchaResetKey, setReportCaptchaResetKey] = useState(0);
  const [privateContact, setPrivateContact] = useState("");
  const [slotNote, setSlotNote] = useState("");
  const [reportReason, setReportReason] = useState<"inaccurate_cost" | "unavailable" | "misleading_details" | "unofficial_fee" | "unsafe_meeting" | "duplicate_listing" | "other">("inaccurate_cost");
  const resetReportCaptcha = () => {
    setReportCaptchaToken("");
    setReportCaptchaResetKey(value => value + 1);
  };
  const reportMutation = trpc.marketplace.report.useMutation({
    onSuccess: result => {
      toast.success("Report received", { description: result.priorityReviewRequired ? "This report has been escalated for priority Admin review. No decision has been made yet." : "AHC operations will review the reported terms." });
      setReporting(false);
      setNote("");
      resetReportCaptcha();
    },
    onError: error => {
      resetReportCaptcha();
      toast.error(error.message);
    },
  });
  const shortlist = trpc.marketplace.shortlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const priceHistory = trpc.marketplace.priceHistory.useQuery({ listingId: listing.id }, { enabled: isAuthenticated });
  const slots = trpc.marketplace.appointments.availableSlots.useQuery({ listingId: listing.id }, { enabled: isAuthenticated });
  const saveListing = trpc.marketplace.shortlist.save.useMutation({ onSuccess: () => shortlist.refetch() });
  const removeListing = trpc.marketplace.shortlist.remove.useMutation({ onSuccess: () => shortlist.refetch() });
  const requestSlot = trpc.marketplace.appointments.requestSlot.useMutation({ onSuccess: () => { slots.refetch(); setSlotNote(""); toast.success("Viewing request sent", { description: "The Agent will confirm or decline this time." }); }, onError: error => toast.error("Unable to request this slot", { description: error.message }) });
  const isSaved = shortlist.data?.some(item => item.id === listing.id) ?? false;
  useEffect(() => {
    if (isAuthenticated) recordView.mutate({ listingId: listing.id });
  }, [isAuthenticated, listing.id]);
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

  const detailContent = <section className={standalone ? "property-detail-surface" : "listing-modal"} role={standalone ? "main" : "dialog"} aria-modal={standalone ? undefined : "true"} aria-label={`Details for ${listing.title}`} onMouseDown={event => event.stopPropagation()}>
    {standalone ? <a className="property-detail-back" href="/homes"><span aria-hidden="true">←</span> {language === "fr" ? "Retour aux logements" : "Back to homes"}</a> : <button className="modal-close" onClick={onClose} aria-label={text(language, "closeDetails")}><X size={19} /></button>}
    <div className="modal-eyebrow">{listing.id} · {listing.city} / {listing.neighborhood}</div><h2>{listing.title}</h2>
    {isNonProductionFixture && <p className="listing-illustrative-media-body"><CircleAlert size={15} /> {text(language, "illustrativeTestMediaBody")}</p>}
    <p className="modal-landmark"><MapPinned size={16} /> {interpolate(text(language, "nearLandmark"), { landmark: listing.landmark, radius: listing.map.radiusM })}</p>
    {walkthrough ? <div className="detail-media-first"><video src={walkthrough.url} controls playsInline preload="metadata" aria-label={`${listing.title} ${text(language, "videoTour")}`} /><span>{text(language, "mediaBeforeCosts")}</span></div> : listing.verificationStatus === "physical_verified" ? <div className="detail-media-unavailable"><CircleAlert size={19} /><div><strong>{text(language, "walkthroughPending")}</strong><span>{text(language, "walkthroughPendingBody")}</span></div></div> : null}<div className="total-panel"><span>{text(language, "totalCash")}</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</strong><p>{text(language, "totalAdvice")}</p></div>
    {isAuthenticated ? <><div className="detail-breakdown-heading"><h3>{text(language, "breakdown")}</h3><span>{text(language, "itemisedAfterTotal")}</span></div><CostBreakdown listing={listing} language={language} />{priceHistory.data?.length ? <section className="protected-detail-gate"><div><span>PRICE DISCLOSURE</span><h3>Recent cost changes</h3><p>Changes are shown with the Agent’s reason, so your visit is not based on an outdated cost.</p></div><div className="cost-breakdown">{priceHistory.data.map((change, index) => <div key={`${String(change.createdAt)}-${index}`}><span>{new Date(change.createdAt).toLocaleDateString(language === "fr" ? "fr-FR" : "en-GB")} · {change.changeReason}</span><b>{formatXaf(change.previousMonthlyRent, language)} → {formatXaf(change.monthlyRent, language)}</b></div>)}</div></section> : null}<section className="detail-map-section" aria-labelledby={`map-${listing.id}`}><div><span className="section-overline">{text(language, "landmarkView")}</span><h3 id={`map-${listing.id}`}>{text(language, "approximateMap")}</h3><p>{text(language, "mapProtection")}</p></div><ApproximateMap listings={[listing]} city={listing.city} onSelect={() => undefined} language={language} /></section></> : <section className="map-gate-panel"><div className="protected-detail-gate"><MapPinned size={21} /><div><span>{text(language, "viewMore")}</span><h3>{text(language, "signInMap")}</h3><p>{text(language, "gateBody")}</p></div><AgentAccountPanel audience="seeker" language={language} /></div></section>}
    {walkthrough && <section className="listing-walkthrough" aria-labelledby={`walkthrough-${listing.id}`}>
      <div className="listing-walkthrough-copy"><span><Video size={15} /> AHC / {isNonProductionFixture ? text(language, "tourTest") : text(language, "tourApproved")}</span><h3 id={`walkthrough-${listing.id}`}>{isNonProductionFixture ? text(language, "testVideoHeading") : text(language, "approvedVideoHeading")}</h3><p>{isNonProductionFixture ? text(language, "testVideoBody") : text(language, "approvedVideoBody")}</p></div>
      <div className="premium-video-frame listing-modal-walkthrough"><video src={walkthrough.url} controls playsInline preload="metadata" aria-label={`${text(language, "videoTour")} ${listing.title}`} /><span className="video-proof">{isNonProductionFixture ? <CircleAlert size={14} /> : <BadgeCheck size={14} />}{isNonProductionFixture ? ` ${text(language, "tourTest")} · ${walkthrough.durationSeconds}s` : ` ${text(language, "moderatorTour")} · ${walkthrough.durationSeconds}s`}</span></div>
    </section>}
    {listing.publicMedia.length ? <section aria-label={`${listing.title} ${text(language, "photosAvailable")}`} style={{ margin: "18px 0 20px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "9px" }}><strong>{listing.publicMedia.length} {text(language, "photosAvailable")}</strong><span className="modal-eyebrow">{hasIllustrativeMedia || listing.isTestData ? text(language, "illustrativeTestMedia") : text(language, "photoPreview")}</span></div>{hasIllustrativeMedia && <p className="listing-illustrative-media-body"><CircleAlert size={15} /> {text(language, "illustrativeTestMediaBody")}</p>}<div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>{listing.publicMedia.map(media => <div key={`${media.url}-${media.displayOrder}`} style={{ position: "relative" }}><img src={media.url} alt={`${listing.title} — ${media.kind} ${text(language, "photoPreview")}`} style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", background: "#e5dfd0" }} />{(media.provenance === "illustrative_test_data" || listing.isTestData) && <span className="illustrative-test-media-badge">{text(language, "illustrativeTestMedia")}</span>}</div>)}</div></section> : null}
    <section className="property-detail-facts"><div><span>{language === "fr" ? "À propos de ce logement" : "About this home"}</span><h3>{language === "fr" ? "Détails déclarés par l’Agent" : "Agent-declared details"}</h3><p>{listing.description}</p></div><PropertyFacts listing={listing} language={language} detail /></section>
    {listing.neighborhoodEssentials ? <section className="neighborhood-facts"><span>{language === "fr" ? "ÉVALUATION DE QUARTIER PAR MODÉRATEUR" : "FIELD MODERATOR AREA CHECK"}</span><p>{language === "fr" ? `Eau : ${listing.neighborhoodEssentials.waterAccess} · Électricité : ${listing.neighborhoodEssentials.powerReliability} · Route : ${listing.neighborhoodEssentials.roadAccess}` : `Water: ${listing.neighborhoodEssentials.waterAccess} · Power: ${listing.neighborhoodEssentials.powerReliability} · Road: ${listing.neighborhoodEssentials.roadAccess}`}</p></section> : null}
    {relatedListings.length ? <section className="related-properties" aria-label={language === "fr" ? "Autres logements qui pourraient vous plaire" : "Other homes you might like"}><div><span>{language === "fr" ? "À DÉCOUVRIR AUSSI" : "MORE TO EXPLORE"}</span><h3>{language === "fr" ? "Vous pourriez aussi aimer" : "You might also like"}</h3><p>{language === "fr" ? "Suggestions basées sur le secteur, le type, les chambres et le budget affichés — jamais sur vos données privées." : "Suggestions use the displayed area, type, bedrooms and budget — never your private data."}</p></div><div className="related-property-grid">{relatedListings.map(relatedListing => <button key={relatedListing.id} type="button" onClick={() => onSelectRelated(relatedListing)}><img src={relatedListing.publicMedia[0]?.url} alt="" /><span>{relatedListing.city} / {relatedListing.neighborhood}</span><b>{relatedListing.title}</b><em>{formatXaf(relatedListing.costs.totalMoveInCashRequired, language)}</em></button>)}</div></section> : null}
    <TrustPassport listing={listing} language={language} />
    <div className="listing-disclosures"><div><b>{text(language, "paidListingTitle")}</b><span>{text(language, "paidListingBody")}</span></div><div><b>{text(language, "noRentTitle")}</b><span>{text(language, "noRentBody")}</span></div><div><b>{text(language, "protectVisit")}</b><span>{text(language, "protectVisitBody")}</span></div></div>
    <div className="freshness-callout"><ShieldCheck size={18} /><div><b>{listing.verificationStatus === "physical_verified" ? text(language, "physicalBadge") : text(language, "freshnessCheck")}</b><span>{text(language, "freshnessBody")}</span></div></div>
    {isAuthenticated && <><section className="protected-detail-gate shortlist-panel"><div><span>SHORTLIST</span><h3>{isSaved ? "Saved for comparison" : "Compare this home later"}</h3><p>{isSaved ? "This listing is in your private shortlist. You can remove it at any time." : "Save up to your own private shortlist to compare total cash, freshness and practical details."}</p></div><button className="button-secondary" disabled={saveListing.isPending || removeListing.isPending} onClick={() => isSaved ? removeListing.mutate({ listingId: listing.id }) : saveListing.mutate({ listingId: listing.id })}>{isSaved ? "Remove from shortlist" : "Save to shortlist"}</button></section>
    <section className="protected-detail-gate viewing-slot-panel"><div><span>AVAILABLE VIEWING SLOTS</span><h3>Choose an Agent-offered time</h3><p>Selecting a slot sends a request only. No property address or direct contact is shared until the Agent confirms.</p></div>{slots.data?.length ? <div className="slot-request-list">{slots.data.map(slot => <div key={slot.id}><button className="button-secondary" onClick={() => { const contact = privateContact.trim(); if (!contact) { toast.info("Add your WhatsApp or phone number first."); return; } requestSlot.mutate({ slotId: slot.id, contactPreference: "whatsapp", privateContact: contact, seekerNote: slotNote.trim() || undefined }); }} disabled={requestSlot.isPending}>{new Date(slot.startsAt).toLocaleString(language === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</button></div>)}</div> : <p className="muted">The Agent has not published viewing times yet. You can still request a viewing below.</p>}<label>Your WhatsApp or phone number<input value={privateContact} maxLength={30} onChange={event => setPrivateContact(event.target.value)} placeholder="+237 6XX XXX XXX" /></label><label>Optional note<textarea value={slotNote} maxLength={500} onChange={event => setSlotNote(event.target.value)} placeholder="Preferred time or access note" /></label></section>
    <section className="safe-viewing-flow" aria-label={language === "fr" ? "Étapes de visite sécurisée" : "Safe viewing steps"}>
      <span><ShieldCheck size={16} /> {language === "fr" ? "ÉTAPES DE VISITE SÉCURISÉE" : "SAFE VIEWING STEPS"}</span>
      <ol>
        <li>{language === "fr" ? "Choisissez ou demandez un créneau." : "Choose or request a time."}</li>
        <li>{language === "fr" ? "L’Agent confirme ou refuse la demande." : "The Agent confirms or declines the request."}</li>
        <li>{language === "fr" ? "Les détails précis ne suivent qu’une confirmation." : "Precise directions follow only after confirmation."}</li>
      </ol>
    </section>
    <ViewingAppointmentRequest listing={listing} language={language} />
    {!reporting ? <><p className="form-note">{text(language, "intentNote")}</p><div className="modal-actions"><button className="button-secondary share-property-button" onClick={shareProperty}><Share2 size={16} /> {text(language, "sharePreview")}</button><button className="button-secondary" onClick={() => setReporting(true)}>{text(language, "reportIssue")}</button><button className="button-primary" onClick={contact}><MessageCircle size={17} /> {text(language, "chatWhatsApp")}</button></div></> : <form className="report-form" onSubmit={event => { event.preventDefault(); if (!reportCaptchaToken) return; reportMutation.mutate({ listingId: listing.id, reason: reportReason, note, captchaToken: reportCaptchaToken }); }}><label>{text(language, "reviewQuestion")}<select value={reportReason} onChange={event => setReportReason(event.target.value as typeof reportReason)}><option value="inaccurate_cost">{text(language, "inaccurateCost")}</option><option value="unavailable">{text(language, "unavailable")}</option><option value="misleading_details">{text(language, "misleading")}</option><option value="unofficial_fee">{text(language, "unofficialFee")}</option><option value="unsafe_meeting">{language === "fr" ? "Conditions de visite dangereuses" : "Unsafe meeting conditions"}</option><option value="duplicate_listing">{language === "fr" ? "Annonce potentiellement en double" : "Possible duplicate listing"}</option><option value="other">{text(language, "otherIssue")}</option></select></label><label>{text(language, "whatHappened")}<textarea required minLength={10} value={note} onChange={event => setNote(event.target.value)} placeholder={text(language, "reportPlaceholder")} /></label><p className="report-safety-note">{text(language, "reportSafety")} {language === "fr" ? "Les signalements de sécurité et de doublon sont examinés par une personne; ils ne déclenchent pas de sanction automatique." : "Safety and duplicate reports receive human review; they do not trigger automatic punishment."}</p><TurnstileChallenge language={language} onToken={setReportCaptchaToken} resetKey={reportCaptchaResetKey} /><div><button type="button" className="text-button" onClick={() => { setReporting(false); resetReportCaptcha(); }}>{text(language, "cancel")}</button><button className="button-primary" disabled={reportMutation.isPending || !reportCaptchaToken}>{reportMutation.isPending ? text(language, "sendingReport") : text(language, "sendReport")}</button></div></form>}</>}
  </section>;
  return standalone ? <main className="property-detail-page-shell">{detailContent}</main> : <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>{detailContent}</div>;
}

export default function Home({ directListingId }: { directListingId?: string }) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, isLanguageTransitioning } = useMarketplaceLanguage();
  const labels = marketplaceCopy[language];
  const interactionLabels = catalogueInteractionCopy[language];
  const [city, setCity] = useState("All cities");
  const [search, setSearch] = useState("");
  const [maxMoveInCash, setMaxMoveInCash] = useState(1_000_000);
  const [propertyType, setPropertyType] = useState("Any type");
  const [furnishingStatus, setFurnishingStatus] = useState<"any" | "not_stated" | "unfurnished" | "partly_furnished" | "fully_furnished">("any");
  const [neighborhood, setNeighborhood] = useState("");
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [availability, setAvailability] = useState<"any" | "available_now">("any");
  const [maxMonthlyRent, setMaxMonthlyRent] = useState(0);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [availableSavings, setAvailableSavings] = useState("");
  const [budgetFitOnly, setBudgetFitOnly] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [sortMode, setSortMode] = useState<"catalogue" | "price_low" | "newest">("catalogue");
  const utils = trpc.useUtils();
  const filters = useMemo(() => ({ city, search: search || undefined, maxMoveInCash: maxMoveInCash === 1_000_000 ? undefined : maxMoveInCash, maxMonthlyRent: maxMonthlyRent || undefined, propertyType, furnishingStatus, neighborhood: neighborhood || undefined, minBedrooms: minBedrooms || undefined, availability }), [city, search, maxMoveInCash, maxMonthlyRent, propertyType, furnishingStatus, neighborhood, minBedrooms, availability]);
  const results = trpc.marketplace.search.useQuery(filters);
  const directResult = trpc.marketplace.search.useQuery(
    {},
    { enabled: Boolean(directListingId) },
  );
  const listings = (results.data ?? []) as Listing[];
  const budgetListings = budgetFitOnly ? listings.filter(listing => listing.costs.monthlyRent <= Number(monthlyIncome) * 0.3 && listing.costs.totalMoveInCashRequired <= Number(availableSavings)) : listings;
  const shortlist = trpc.marketplace.shortlist.list.useQuery(undefined, { enabled: isAuthenticated });
  const savedListingIds = useMemo(() => new Set((shortlist.data ?? []).map(item => item.id)), [shortlist.data]);
  const refreshShortlist = () => utils.marketplace.shortlist.list.invalidate();
  const saveFavorite = trpc.marketplace.shortlist.save.useMutation({ onSuccess: refreshShortlist, onError: error => toast.error(error.message) });
  const removeFavorite = trpc.marketplace.shortlist.remove.useMutation({ onSuccess: refreshShortlist, onError: error => toast.error(error.message) });
  const favoriteBusy = saveFavorite.isPending || removeFavorite.isPending;
  const toggleFavorite = (listing: Listing) => {
    if (!isAuthenticated) {
      toast.info(interactionLabels.favoritesSignIn);
      return;
    }
    if (savedListingIds.has(listing.id)) removeFavorite.mutate({ listingId: listing.id });
    else saveFavorite.mutate({ listingId: listing.id });
  };
  const sortListings = (candidateListings: Listing[]) => [...candidateListings].sort((left, right) => {
    if (sortMode === "price_low") return left.costs.totalMoveInCashRequired - right.costs.totalMoveInCashRequired;
    if (sortMode === "newest") return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    return 0;
  });
  const directListings = (directResult.data ?? []) as Listing[];
  const directListing = directListingId ? directListings.find(item => item.id === directListingId) : null;
  const activeBrowseCity = city === "All cities" ? (language === "fr" ? "Yaoundé et Douala" : "Yaoundé and Douala") : city;
  const cityHomes = sortListings(city === "All cities" ? budgetListings : budgetListings.filter(listing => listing.city === city));
  const moveInFirstHomes = [...budgetListings].sort((a, b) => a.costs.totalMoveInCashRequired - b.costs.totalMoveInCashRequired).slice(0, 8);
  const householdHomes = budgetListings.filter(listing => listing.bedrooms >= 2).sort((a, b) => b.bedrooms - a.bedrooms || a.costs.monthlyRent - b.costs.monthlyRent).slice(0, 8);
  const cityBrowseTitle = city === "All cities"
    ? language === "fr" ? "Logements à Yaoundé et Douala" : "Homes across Yaoundé and Douala"
    : language === "fr" ? `Logements à ${city}` : `Homes in ${city}`;
  const browseCopy = language === "fr"
    ? { cityEyebrow: "SÉLECTION ACTUELLE", cityTitle: cityBrowseTitle, cityBody: "Des médias d’abord, puis le coût total à prévoir et les faits utiles pour comparer.", budgetEyebrow: "MIEUX POUR VOTRE BUDGET", budgetTitle: "Commencez avec le coût d’entrée", budgetBody: "Classés par montant total à prévoir avant de déménager — pas seulement selon le loyer mensuel.", familyEyebrow: "POUR PLUS D’ESPACE", familyTitle: "Des logements pensés pour un foyer", familyBody: "Des options avec au moins deux chambres dans votre recherche actuelle." }
    : { cityEyebrow: "CURRENT SELECTION", cityTitle: cityBrowseTitle, cityBody: "Media first, then the total cash required and the facts needed to compare with confidence.", budgetEyebrow: "EASIER ON YOUR MOVE-IN BUDGET", budgetTitle: "Start with the move-in total", budgetBody: "Ordered by the cash needed before moving—not by monthly rent alone.", familyEyebrow: "ROOM FOR A HOUSEHOLD", familyTitle: "Homes with space to grow", familyBody: "Options with at least two bedrooms within your current search." };
  const showCuratedShelves = sortMode === "catalogue";
  const openListing = (listing: Listing) => {
    window.open(`/property/${encodeURIComponent(listing.id)}`, "_blank", "noopener,noreferrer");
  };
  const openFromMap = (id: string) => {
    const listing = listings.find(item => item.id === id);
    if (listing) openListing(listing);
  };
  if (directListingId) {
    return <div className={`ahc-app property-route language-transition ${isLanguageTransitioning ? "is-switching-language" : ""}`} lang={language}>
      <header className="property-route-topbar"><a className="brand" href="/homes"><span className="brand-emblem"><span /><span /><span /></span><span>Affordable Housing<br /><b>Cameroon</b></span></a><div><select className="language-select" value={language} onChange={event => setLanguage(event.target.value as typeof language)} aria-label={language === "fr" ? "Choisir la langue" : "Select language"}><option value="en">English</option><option value="fr">Français</option></select><a className="property-route-return" href="/homes">{language === "fr" ? "Voir les logements" : "Browse homes"} <span aria-hidden="true">↗</span></a></div></header>
      {directResult.isLoading ? <div className="property-route-loading loading-list" aria-label={language === "fr" ? "Chargement du logement" : "Loading property"}><i /><i /><i /></div> : directListing ? <ListingDetail standalone listing={directListing} language={language} isAuthenticated={isAuthenticated} onClose={() => window.location.assign("/homes")} onSelectRelated={openListing} /> : <main className="property-detail-page-shell"><section className="property-detail-empty"><span>AHC / PROPERTY</span><h1>{language === "fr" ? "Ce logement n’est plus disponible" : "This home is no longer available"}</h1><p>{language === "fr" ? "Il a peut-être été retiré ou ne répond plus aux contrôles de publication." : "It may have been removed or no longer meets the public-listing checks."}</p><a className="button-primary" href="/homes">{language === "fr" ? "Retour aux logements" : "Back to homes"}</a></section></main>}
    </div>;
  }

  return <div className={`ahc-app language-transition ${isLanguageTransitioning ? "is-switching-language" : ""}`} lang={language}><header className="topbar"><a className="brand" href="/" data-scroll-target="top"><span className="brand-emblem"><span /><span /><span /></span><span>Affordable Housing<br /><b>Cameroon</b></span></a><nav className={menuOpen ? "nav-links is-open" : "nav-links"}><a href="/" data-scroll-target="homes" onClick={() => setMenuOpen(false)}>{labels.homes}</a><a href="/" data-scroll-target="alerts" onClick={() => setMenuOpen(false)}>{labels.alerts}</a><a href="/" data-scroll-target="trust" onClick={() => setMenuOpen(false)}>{labels.safer}</a><a href="/agent" onClick={() => setMenuOpen(false)}>{labels.agents}</a><a href="/" data-scroll-target="moderators" onClick={() => setMenuOpen(false)}>{labels.moderators}</a></nav><select className="language-select" value={language} onChange={event => setLanguage(event.target.value as typeof language)} aria-label={language === "fr" ? "Choisir la langue" : "Select language"}><option value="en">English</option><option value="fr">Français</option></select><a className="agent-top-cta" href="/agent">{labels.list} <span>↗</span></a><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={labels.homes}>{menuOpen ? <X /> : <Menu />}</button></header>
    <main id="top"><aside className="atlas-index" aria-label="AHC"><span>AHC / ROUTE</span><a href="/" data-scroll-target="homes"><b>01</b> {labels.routeFresh}</a><a href="/" data-scroll-target="alerts"><b>02</b> {labels.routeAlerts}</a><a href="/" data-scroll-target="trust"><b>03</b> {labels.routeTrust}</a><a href="/" data-scroll-target="agents"><b>04</b> {labels.routeAgents}</a><a href="/" data-scroll-target="moderators"><b>05</b> {labels.routeModerators}</a></aside><section className="hero"><div className="hero-grid"><div className="hero-copy"><span className="section-overline light">{labels.heroOverline}</span><h1>{labels.fullCost} <em>{labels.beforeMove}</em></h1><p>{labels.freshIntro}</p><div className="hero-proof"><span><ShieldCheck size={16} /> {labels.freshnessRule}</span><span><MapPinned size={16} /> {labels.landmarkMaps}</span></div></div><div className="search-panel search-panel-compact"><span className="search-kicker">{labels.searchKicker}</span><label>{labels.where}<input value={search} onChange={e => setSearch(e.target.value)} placeholder={labels.searchPlaceholder} /></label><div className="two-fields"><label>{labels.city}<select value={city} onChange={e => setCity(e.target.value)}><option>{labels.allCities}</option><option>Yaoundé</option><option>Douala</option></select></label><label>{labels.maxCash}<select value={maxMoveInCash} onChange={e => setMaxMoveInCash(Number(e.target.value))}><option value={100000}>100,000 XAF</option><option value={200000}>200,000 XAF</option><option value={300000}>300,000 XAF</option><option value={500000}>500,000 XAF</option><option value={1000000}>{labels.anyAmount}</option></select></label></div><button type="button" className="search-advanced-toggle" onClick={() => setAdvancedSearchOpen(open => !open)} aria-expanded={advancedSearchOpen}>{advancedSearchOpen ? (language === "fr" ? "Masquer les filtres" : "Hide filters") : (language === "fr" ? "Plus de filtres" : "More filters")}<ChevronDown size={16} className={advancedSearchOpen ? "is-open" : ""} /></button>{advancedSearchOpen ? <div className="search-advanced-fields"><div className="two-fields"><label>{language === "fr" ? "Type de logement" : "Home type"}<select value={propertyType} onChange={e => setPropertyType(e.target.value)}><option>{language === "fr" ? "Tout type" : "Any type"}</option><option>Studio</option><option>Apartment</option><option>House</option><option>Room</option><option>Duplex</option></select></label><label>{furnishingCopy[language].label}<select value={furnishingStatus} onChange={e => setFurnishingStatus(e.target.value as typeof furnishingStatus)}><option value="any">{furnishingCopy[language].any}</option><option value="unfurnished">{furnishingCopy[language].unfurnished}</option><option value="partly_furnished">{furnishingCopy[language].partly_furnished}</option><option value="fully_furnished">{furnishingCopy[language].fully_furnished}</option><option value="not_stated">{furnishingCopy[language].not_stated}</option></select></label></div><div className="two-fields"><label>{furnishingCopy[language].bedrooms}<select value={minBedrooms} onChange={e => setMinBedrooms(Number(e.target.value))}><option value={0}>{furnishingCopy[language].anyBedrooms}</option><option value={1}>1+ {language === "fr" ? "chambre" : "bedroom"}</option><option value={2}>2+ {language === "fr" ? "chambres" : "bedrooms"}</option><option value={3}>3+ {language === "fr" ? "chambres" : "bedrooms"}</option><option value={4}>4+ {language === "fr" ? "chambres" : "bedrooms"}</option></select></label><label>{furnishingCopy[language].monthlyRent}<select value={maxMonthlyRent} onChange={e => setMaxMonthlyRent(Number(e.target.value))}><option value={0}>{furnishingCopy[language].anyRent}</option><option value={50_000}>50,000 XAF</option><option value={75_000}>75,000 XAF</option><option value={100_000}>100,000 XAF</option><option value={150_000}>150,000 XAF</option><option value={250_000}>250,000 XAF</option></select></label></div><div className="two-fields"><label>{language === "fr" ? "Quartier" : "Neighbourhood"}<input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Jouvence" /></label><label>{language === "fr" ? "Disponibilité" : "Availability"}<select value={availability} onChange={e => setAvailability(e.target.value as "any" | "available_now")}><option value="any">{language === "fr" ? "Toute date disponible" : "Any available date"}</option><option value="available_now">{language === "fr" ? "Disponible maintenant" : "Ready now"}</option></select></label></div></div> : null}<button className="button-primary full-width" onClick={() => document.getElementById("homes")?.scrollIntoView({ behavior: "smooth" })}>{labels.seeHomes} <span>↓</span></button><p className="search-foot"><CircleAlert size={14} /> {labels.anonymous}</p></div></div></section>
      <section className="catalogue-sort-bar" aria-label={interactionLabels.sort}><label className="catalogue-sort-control">{interactionLabels.sort}<select value={sortMode} onChange={event => setSortMode(event.target.value as typeof sortMode)}><option value="catalogue">{interactionLabels.catalogueOrder}</option><option value="price_low">{interactionLabels.priceLowToHigh}</option><option value="newest">{interactionLabels.newestFirst}</option></select></label></section>
      <section className="route-strip"><span>01 / {labels.routeOne}</span><span>02 / {labels.routeTwo}</span><span>03 / {labels.routeThree}</span><span>04 / {labels.routeFour}</span></section>
      <div id="homes" className="contextual-discovery-collections">
        <section className="public-verification-disclosure"><ShieldCheck size={17} /><div><strong>{text(language, "publicVerifiedTitle")}</strong><span>{text(language, "publicVerifiedBody")}</span></div><button type="button" className="data-saver-toggle" aria-pressed={lowDataMode} onClick={() => setLowDataMode(active => !active)}>{lowDataMode ? "Data saver on" : "Data saver off"}</button></section>
        {results.isLoading ? <div className="loading-list"><i /><i /><i /></div> : <>
          <ContextualHomeShelf eyebrow={browseCopy.cityEyebrow} title={browseCopy.cityTitle} body={browseCopy.cityBody} listings={cityHomes} language={language} lowData={lowDataMode} onOpen={openListing} onToggleFavorite={toggleFavorite} savedListingIds={savedListingIds} favoriteBusy={favoriteBusy} />
          {showCuratedShelves && moveInFirstHomes.length >= 4 ? <ContextualHomeShelf eyebrow={browseCopy.budgetEyebrow} title={browseCopy.budgetTitle} body={browseCopy.budgetBody} listings={moveInFirstHomes} language={language} lowData={lowDataMode} onOpen={openListing} onToggleFavorite={toggleFavorite} savedListingIds={savedListingIds} favoriteBusy={favoriteBusy} /> : null}
          {showCuratedShelves && householdHomes.length >= 4 ? <ContextualHomeShelf eyebrow={browseCopy.familyEyebrow} title={browseCopy.familyTitle} body={browseCopy.familyBody} listings={householdHomes} language={language} lowData={lowDataMode} onOpen={openListing} onToggleFavorite={toggleFavorite} savedListingIds={savedListingIds} favoriteBusy={favoriteBusy} /> : null}
        </>}
        {results.isLoading ? <p className="loading-list-status">{labels.checkingFreshness}</p> : null}
      </div>
      <SeekerAppointmentHistory isAuthenticated={isAuthenticated} language={language} />
      <div id="alerts"><SeekerMatchAlerts isAuthenticated={isAuthenticated} language={language} /></div>
      {isAuthenticated && <details className="budget-fit-inline"><summary>Budget fit</summary><div><p>Compare homes against your monthly income and move-in savings. This is planning guidance only, not a loan or tenancy decision.</p><div className="two-fields"><label>Monthly income (XAF)<input inputMode="numeric" value={monthlyIncome} onChange={event => setMonthlyIncome(event.target.value.replace(/\D/g, ""))} placeholder="150000" /></label><label>Savings available today (XAF)<input inputMode="numeric" value={availableSavings} onChange={event => setAvailableSavings(event.target.value.replace(/\D/g, ""))} placeholder="350000" /></label></div><button className="button-secondary" disabled={!Number(monthlyIncome) || !Number(availableSavings)} onClick={() => setBudgetFitOnly(!budgetFitOnly)}>{budgetFitOnly ? "Show all homes" : "Show homes that fit my budget"}</button></div></details>}
      <section id="trust" className="trust-section"><div className="trust-intro"><span className="section-overline light">02 / {labels.trustOverline}</span><h2>{labels.trustHeadingOne}<br /><em>{labels.trustHeadingTwo}</em></h2><p>{labels.trustIntro}</p></div><div className="trust-rules"><div><b>01</b><h3>{labels.trustCostTitle}</h3><p>{labels.trustCostBody}</p></div><div><b>02</b><h3>{labels.trustPaidTitle}</h3><p>{labels.trustPaidBody}</p></div><div><b>03</b><h3>{labels.trustMapsTitle}</h3><p>{labels.trustMapsBody}</p></div><div><b>04</b><h3>{labels.trustFreshTitle}</h3><p>{labels.trustFreshBody}</p></div><div><b>05</b><h3>{labels.trustDirectTitle}</h3><p>{labels.trustDirectBody}</p></div></div></section>
      <section id="agents" className="agent-cta"><div><span className="section-overline">03 / {labels.agentOverline}</span><h2>{labels.agentHeading}</h2></div><div><p>{labels.agentBody}</p><a className="button-primary" href="/agent">{labels.openAgent} <span>↗</span></a></div></section>
      <section id="moderators" className="agent-cta moderator-cta"><div><span className="section-overline">04 / {labels.moderatorOverline}</span><h2>{labels.moderatorHeading}</h2></div><div><p>{labels.moderatorBody}</p><a className="button-primary" href="/operations">{labels.moderatorSignIn} <span>↗</span></a></div></section>
    </main><footer><span>Affordable Housing Cameroon</span><span>{labels.footerPilot}</span><span>{labels.footerWarning}</span></footer></div>;
}
