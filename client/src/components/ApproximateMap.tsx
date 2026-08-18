import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { interpolate, text, type PublicLanguage } from "@/lib/marketplaceLocale";

export type MapListing = {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  featured: boolean;
  verificationStatus: "unverified" | "remote_checked" | "physical_verified";
  map: { latitude: number; longitude: number; radiusM: number };
  costs: { totalMoveInCashRequired: number };
};

const formatXaf = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} XAF`;
const cityCenters: Record<string, LatLngExpression> = {
  Yaoundé: [3.848, 11.502],
  Douala: [4.0511, 9.7679],
  all: [3.95, 10.64],
};

function Recenter({ city }: { city: string }) {
  const map = useMap();
  useEffect(() => {
    map.setView(cityCenters[city] ?? cityCenters.all, city === "All cities" ? 7 : 12, { animate: true });
  }, [city, map]);
  return null;
}

export function ApproximateMap({ listings, city, onSelect, language = "en" }: { listings: MapListing[]; city: string; onSelect: (id: string) => void; language?: PublicLanguage }) {
  const center = cityCenters[city] ?? cityCenters.all;
  return (
    <div className="ahc-map-shell" aria-label="Map of approximate listing landmarks">
      <div className="map-privacy-key"><span className="privacy-ring" /> {text(language, "mapPrivacyKey")}</div>
      <MapContainer center={center} zoom={city === "All cities" ? 7 : 12} scrollWheelZoom={false} className="ahc-map">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Recenter city={city} />
        {listings.map((listing) => {
          const position: LatLngExpression = [listing.map.latitude, listing.map.longitude];
          const verified = listing.verificationStatus === "physical_verified";
          return <Circle key={listing.id} center={position} radius={listing.map.radiusM} pathOptions={{ color: listing.featured ? "#d78a1d" : "#1b5060", fillOpacity: 0.08, weight: 1 }}>
            <CircleMarker center={position} radius={listing.featured ? 10 : 8} pathOptions={{ color: "#fffdf6", fillColor: verified ? "#1b5060" : "#d78a1d", fillOpacity: 1, weight: 2 }}>
              <Tooltip permanent direction="top" offset={[0, -11]} className="map-cash-label" opacity={1} interactive={false}>
                <span>{formatXaf(listing.costs.totalMoveInCashRequired)}</span>
              </Tooltip>
              <Popup><div className="map-popup"><span>{interpolate(text(language, "approximateLandmarkRadius"), { radius: listing.map.radiusM })}</span><strong>{listing.neighborhood}, {listing.city}</strong><b>{formatXaf(listing.costs.totalMoveInCashRequired)} total move-in</b><button onClick={() => onSelect(listing.id)}>{text(language, "viewCosts")}</button></div></Popup>
            </CircleMarker>
          </Circle>;
        })}
      </MapContainer>
      {!listings.length && <div className="map-empty-overlay">No fresh listings match this route yet.<br /><span>Map pins appear only after an agent reconfirms availability.</span></div>}
    </div>
  );
}
