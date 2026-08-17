import { useState } from "react";
import { BadgeCheck, CircleAlert, Droplets, MapPin, Route, ShieldCheck, Video, Zap } from "lucide-react";
import type { MapListing } from "@/components/ApproximateMap";
import { marketplaceCopy, type PublicLanguage } from "@/lib/marketplaceLocale";
import "./premium-walkthrough.css";

type PremiumListing = MapListing & {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  propertyType: string;
  featured: boolean;
  costs: { monthlyRent: number; totalMoveInCashRequired: number };
  walkthrough: { url: string; durationSeconds: number } | null;
  neighborhoodEssentials: {
    waterAccess: string;
    powerReliability: string;
    roadAccess: string;
    taxiWalkMinutes: number | null;
    junctionName: string | null;
    junctionMinutes: number | null;
  } | null;
  trust: { guaranteedTotalCash: boolean; badges: { code: string; label: string }[] };
};

const formatXaf = (value: number, language: PublicLanguage) => `${new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US").format(value)} XAF`;

function WaterLabel(value: string, language: PublicLanguage) {
  const labels = language === "fr" ? { borehole_on_site: "Forage sur place", water_storage_seen: "Réserve d’eau observée", public_network_observed: "Réseau public observé" } : { borehole_on_site: "Borehole on-site", water_storage_seen: "Water storage seen", public_network_observed: "Public network observed" };
  return labels[value as keyof typeof labels] ?? (language === "fr" ? "Eau non confirmée" : "Water not confirmed");
}

function PowerLabel(value: string, language: PublicLanguage) {
  const labels = language === "fr" ? { backup_seen: "Alimentation de secours observée", prepaid_meter_seen: "Compteur prépayé observé", local_low_outage_assessment: "Zone à moins de coupures observée", local_outage_caution: "Risque de coupure" } : { backup_seen: "Backup power seen", prepaid_meter_seen: "Prepaid meter seen", local_low_outage_assessment: "Lower-outage area observed", local_outage_caution: "Outage caution" };
  return labels[value as keyof typeof labels] ?? (language === "fr" ? "Électricité non confirmée" : "Power not confirmed");
}

function RoadLabel(value: string, language: PublicLanguage) {
  const labels = language === "fr" ? { tarred_to_gate: "Route goudronnée jusqu’à l’entrée", tarred_nearby: "Route goudronnée à proximité", dirt_track_to_gate: "Piste jusqu’à l’entrée" } : { tarred_to_gate: "Tarred to gate", tarred_nearby: "Tarred road nearby", dirt_track_to_gate: "Dirt track to gate" };
  return labels[value as keyof typeof labels] ?? (language === "fr" ? "Accès routier non confirmé" : "Road access not confirmed");
}

export function PremiumWalkthroughRail({ listings, language = "en", onOpen }: { listings: PremiumListing[]; language?: PublicLanguage; onOpen: (listing: PremiumListing) => void }) {
  const labels = marketplaceCopy[language];
  const premiumListings = listings.filter(listing => listing.walkthrough);
  const [videoReadyListingId, setVideoReadyListingId] = useState<string | null>(null);
  if (!premiumListings.length) return null;
  return <section className="premium-rail" aria-labelledby="premium-walkthrough-title">
    <div className="premium-rail-head">
      <div><span className="premium-kicker"><Video size={15} /> {labels.privateView}</span><h2 id="premium-walkthrough-title">{labels.walkBeforeTaxi}</h2><p>{labels.railBody}</p></div>
      <span className="premium-mark"><i /> {labels.verifiedMotion}</span>
    </div>
    <div className="premium-feed" role="region" aria-label={labels.moderatorTours}>
      {premiumListings.map(listing => <article className="premium-video-card" key={listing.id}>
        <div className="premium-video-frame">
          <video src={listing.walkthrough!.url} controls muted playsInline preload="metadata" onPlay={() => setVideoReadyListingId(listing.id)} aria-label={`${labels.videoTour} ${listing.title}`} />
          <span className="video-proof">{listing.title.startsWith("TEST DATA") ? <CircleAlert size={14} /> : <BadgeCheck size={14} />}{listing.title.startsWith("TEST DATA") ? ` ${labels.tourTest} · ${listing.walkthrough!.durationSeconds}s` : ` ${labels.moderatorTour} · ${listing.walkthrough!.durationSeconds}s`}</span>
          {listing.trust.guaranteedTotalCash && <span className="cash-guarantee"><ShieldCheck size={14} /> {labels.guaranteedCash}</span>}
        </div>
        <div className="premium-card-copy">
          <div className="premium-title-line"><span>{listing.city} / {listing.neighborhood}</span>{listing.featured && <b>{labels.featured}</b>}</div>
          <h3>{listing.title}</h3><p>{listing.propertyType} · {formatXaf(listing.costs.monthlyRent, language)} {labels.monthly}</p>
          {listing.neighborhoodEssentials && <div className="essential-pills" aria-label={labels.moderatorTours}>
            <span><Droplets size={13} /> {WaterLabel(listing.neighborhoodEssentials.waterAccess, language)}</span>
            <span><Zap size={13} /> {PowerLabel(listing.neighborhoodEssentials.powerReliability, language)}</span>
            <span><Route size={13} /> {RoadLabel(listing.neighborhoodEssentials.roadAccess, language)}</span>
            {listing.neighborhoodEssentials.junctionName && <span><MapPin size={13} /> {listing.neighborhoodEssentials.junctionMinutes ?? "?"} {labels.minTo} {listing.neighborhoodEssentials.junctionName}</span>}
          </div>}
          <div className="premium-total"><span>{labels.totalCash}</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired, language)}</strong></div>
          <button className={`premium-open ${videoReadyListingId === listing.id ? "is-ready" : ""}`} onClick={() => onOpen(listing)}>{labels.openFullDetails} <span>→</span></button>
        </div>
      </article>)}
    </div>
  </section>;
}
