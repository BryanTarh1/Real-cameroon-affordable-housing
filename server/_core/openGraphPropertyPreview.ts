type PublicPropertyPreview = {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  propertyType: string;
  verificationStatus: "unverified" | "remote_checked" | "physical_verified";
  supplyCapacity: "agent_representative" | "direct_owner";
  costs: { totalMoveInCashRequired: number };
};

function escapeMarkup(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

export function propertyShareUrls(origin: string, listingId: string) {
  const encodedId = encodeURIComponent(listingId);
  return {
    canonicalUrl: `${origin}/property/${encodedId}`,
    imageUrl: `${origin}/api/public/listings/${encodedId}/share-card.png`,
  };
}

/** Builds the small public-only document served to WhatsApp and other social crawlers. */
export function buildPropertyOpenGraphDocument(listing: PublicPropertyPreview, origin: string) {
  const { canonicalUrl, imageUrl } = propertyShareUrls(origin, listing.id);
  const total = new Intl.NumberFormat("en-US").format(listing.costs.totalMoveInCashRequired);
  const title = `${listing.title} · ${listing.neighborhood}, ${listing.city}`;
  const verification = listing.verificationStatus === "physical_verified" ? "Physically verified by AHC" : "Published after review; no on-site Field Moderator visit yet";
  const supply = listing.supplyCapacity === "direct_owner" ? "Direct From Owner" : "Managing Agent";
  const description = `${listing.propertyType}. ${verification}. ${supply}. Total Move-In Cash Required: ${total} XAF. Approximate landmark area only; the compound door is private. Open AHC for availability and sign-in-protected details.`;
  const imageAlt = `AHC property preview for ${listing.title} in ${listing.neighborhood}, ${listing.city}`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeMarkup(title)} | AHC</title><meta name="description" content="${escapeMarkup(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Affordable Housing Cameroon"><meta property="og:locale" content="en_CM"><meta property="og:title" content="${escapeMarkup(title)}"><meta property="og:description" content="${escapeMarkup(description)}"><meta property="og:url" content="${escapeMarkup(canonicalUrl)}"><meta property="og:image" content="${escapeMarkup(imageUrl)}"><meta property="og:image:secure_url" content="${escapeMarkup(imageUrl)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${escapeMarkup(imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeMarkup(title)}"><meta name="twitter:description" content="${escapeMarkup(description)}"><meta name="twitter:image" content="${escapeMarkup(imageUrl)}"><meta name="twitter:image:alt" content="${escapeMarkup(imageAlt)}"></head><body><p>Open <a href="${escapeMarkup(canonicalUrl)}">this AHC property listing</a>.</p></body></html>`;
}
