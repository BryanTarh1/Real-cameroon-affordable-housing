import { useState } from "react";
import { BadgeCheck, Droplets, MapPin, Route, ShieldCheck, Video, Zap } from "lucide-react";
import type { MapListing } from "@/components/ApproximateMap";
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

const formatXaf = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} XAF`;

function WaterLabel(value: string) {
  return { borehole_on_site: "Borehole on-site", water_storage_seen: "Water storage seen", public_network_observed: "Public network observed" }[value] ?? "Water not confirmed";
}

function PowerLabel(value: string) {
  return { backup_seen: "Backup power seen", prepaid_meter_seen: "Prepaid meter seen", local_low_outage_assessment: "Lower-outage area observed", local_outage_caution: "Outage caution" }[value] ?? "Power not confirmed";
}

function RoadLabel(value: string) {
  return { tarred_to_gate: "Tarred to gate", tarred_nearby: "Tarred road nearby", dirt_track_to_gate: "Dirt track to gate" }[value] ?? "Road access not confirmed";
}

export function PremiumWalkthroughRail({ listings, onOpen }: { listings: PremiumListing[]; onOpen: (listing: PremiumListing) => void }) {
  const premiumListings = listings.filter(listing => listing.walkthrough);
  const [videoReadyListingId, setVideoReadyListingId] = useState<string | null>(null);
  if (!premiumListings.length) return null;
  return <section className="premium-rail" aria-labelledby="premium-walkthrough-title">
    <div className="premium-rail-head">
      <div><span className="premium-kicker"><Video size={15} /> AHC PRIVATE VIEW</span><h2 id="premium-walkthrough-title">Walk through it before you taxi there.</h2><p>Short, unedited vertical clips are captured by a Field Moderator during a passed on-site check. Exact compound locations remain private.</p></div>
      <span className="premium-mark"><i /> VERIFIED MOTION</span>
    </div>
    <div className="premium-feed" role="region" aria-label="Moderator-verified video walk-throughs">
      {premiumListings.map(listing => <article className="premium-video-card" key={listing.id}>
        <div className="premium-video-frame">
          <video src={listing.walkthrough!.url} controls muted playsInline preload="metadata" onPlay={() => setVideoReadyListingId(listing.id)} aria-label={`Walk-through of ${listing.title}`} />
          <span className="video-proof"><BadgeCheck size={14} /> Moderator walk-through · {listing.walkthrough!.durationSeconds}s</span>
          {listing.trust.guaranteedTotalCash && <span className="cash-guarantee"><ShieldCheck size={14} /> Guaranteed Total Cash</span>}
        </div>
        <div className="premium-card-copy">
          <div className="premium-title-line"><span>{listing.city} / {listing.neighborhood}</span>{listing.featured && <b>Featured</b>}</div>
          <h3>{listing.title}</h3><p>{listing.propertyType} · {formatXaf(listing.costs.monthlyRent)} monthly</p>
          {listing.neighborhoodEssentials && <div className="essential-pills" aria-label="Moderator-observed neighborhood essentials">
            <span><Droplets size={13} /> {WaterLabel(listing.neighborhoodEssentials.waterAccess)}</span>
            <span><Zap size={13} /> {PowerLabel(listing.neighborhoodEssentials.powerReliability)}</span>
            <span><Route size={13} /> {RoadLabel(listing.neighborhoodEssentials.roadAccess)}</span>
            {listing.neighborhoodEssentials.junctionName && <span><MapPin size={13} /> {listing.neighborhoodEssentials.junctionMinutes ?? "?"} min to {listing.neighborhoodEssentials.junctionName}</span>}
          </div>}
          <div className="premium-total"><span>Total Move-In Cash</span><strong>{formatXaf(listing.costs.totalMoveInCashRequired)}</strong></div>
          <button className={`premium-open ${videoReadyListingId === listing.id ? "is-ready" : ""}`} onClick={() => onOpen(listing)}>View full home details <span>→</span></button>
        </div>
      </article>)}
    </div>
  </section>;
}
