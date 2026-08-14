const state = { listings: [], snapshot: null };

const formatXaf = value => `${new Intl.NumberFormat("en-US").format(Number(value || 0))} XAF`;
const normaliseJson = value => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return {}; }
};

function freshnessLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Snapshot freshness unavailable";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return "Reconfirmed today";
  if (days === 1) return "Reconfirmed yesterday";
  return `Reconfirmed ${days} days ago`;
}

function verificationLabel(status) {
  return String(status || "").toLowerCase() === "passed"
    ? "Physically verified by AHC"
    : "Not yet physically verified";
}

function populateCities() {
  const select = document.querySelector("#city-filter");
  [...new Set(state.listings.map(item => item.city).filter(Boolean))].sort().forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    select.append(option);
  });
}

function activeListings() {
  const city = document.querySelector("#city-filter").value;
  const bedrooms = document.querySelector("#bedrooms-filter").value;
  const maximumCost = Number(document.querySelector("#cost-filter").value || 0);
  return state.listings.filter(listing => {
    const costs = normaliseJson(listing.costs_json);
    const bedroomMatch = !bedrooms || (bedrooms === "3" ? Number(listing.bedrooms) >= 3 : Number(listing.bedrooms) === Number(bedrooms));
    return (!city || listing.city === city)
      && bedroomMatch
      && (!maximumCost || Number(costs.totalMoveInCashRequired) <= maximumCost);
  }).sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || new Date(b.last_reconfirmed) - new Date(a.last_reconfirmed));
}

function openDialog(listing) {
  const costs = normaliseJson(listing.costs_json);
  const essentials = normaliseJson(listing.neighborhood_essentials_json);
  const trust = normaliseJson(listing.trust_json);
  const walkthrough = Number(listing.has_published_walkthrough) ? "Published Walk-Thru available in the protected main app" : "No published Walk-Thru in this snapshot";
  document.querySelector("#dialog-content").innerHTML = `
    <p class="eyebrow">LOCAL SNAPSHOT · LISTING ${listing.listing_id}</p>
    <h2 id="dialog-title" class="dialog-title">${escapeHtml(listing.title)}</h2>
    <p class="dialog-subtitle">${escapeHtml(listing.neighborhood)}, ${escapeHtml(listing.city)} · ${escapeHtml(listing.property_type)}</p>
    <div class="detail-grid">
      <div><span>Bedrooms</span><strong>${listing.bedrooms ?? "Not stated"}</strong></div>
      <div><span>Verification</span><strong>${verificationLabel(listing.verification_status)}</strong></div>
      <div><span>Availability</span><strong>${new Date(listing.available_from).toLocaleDateString()}</strong></div>
      <div><span>Walk-Thru</span><strong>${walkthrough}</strong></div>
      <div><span>Household fit</span><strong>${escapeHtml(listing.household_fit || "Not stated")}</strong></div>
      <div><span>Local snapshot</span><strong>${freshnessLabel(listing.last_reconfirmed)}</strong></div>
    </div>
    <p class="map-note"><strong>Approximate map only:</strong> ${escapeHtml(listing.landmark)} · privacy radius ${Number(listing.map_radius_m).toLocaleString()}m. The exact compound door is intentionally unavailable in this local test package.</p>
    <h3>Itemised move-in cost</h3>
    <table class="dialog-costs">
      <tbody>
        ${costRow("Monthly rent", costs.monthlyRent)}
        ${costRow("Advance months", costs.advanceMonths ? `${costs.advanceMonths} month(s)` : "Not stated")}
        ${costRow("Security deposit", costs.securityDeposit)}
        ${costRow("Agency fee", costs.agencyFee)}
        ${costRow("Service fee", costs.serviceFee)}
        ${costRow("First-month utilities", costs.firstMonthUtilities)}
        ${costRow("Total move-in cash required", costs.totalMoveInCashRequired, true)}
      </tbody>
    </table>
    <p class="map-note"><strong>Snapshot trust metadata:</strong> ${escapeHtml(trust.summary || "No additional local trust summary")}. ${escapeHtml(essentials.summary || "Neighbourhood details remain limited to the approved snapshot.")}</p>`;
  document.querySelector("#listing-dialog").showModal();
}

function costRow(label, value, alreadyText = false) {
  return `<tr><th scope="row">${escapeHtml(label)}</th><td>${alreadyText ? escapeHtml(value) : formatXaf(value)}</td></tr>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
}

function render() {
  const filtered = activeListings();
  const grid = document.querySelector("#listing-grid");
  const template = document.querySelector("#listing-card-template");
  grid.replaceChildren();
  filtered.forEach(listing => {
    const clone = template.content.cloneNode(true);
    const costs = normaliseJson(listing.costs_json);
    clone.querySelector("h3").textContent = listing.title;
    clone.querySelector(".location").textContent = `${listing.neighborhood}, ${listing.city} · ${listing.bedrooms ?? "—"} bedroom(s)`;
    clone.querySelector(".freshness").textContent = freshnessLabel(listing.last_reconfirmed);
    clone.querySelector(".verification-label").textContent = verificationLabel(listing.verification_status);
    const featured = clone.querySelector(".featured-label");
    featured.hidden = !Number(listing.is_featured);
    clone.querySelector(".cash-seal strong").textContent = formatXaf(costs.totalMoveInCashRequired);
    clone.querySelector(".cost-summary").innerHTML = `<dt>Monthly rent</dt><dd>${formatXaf(costs.monthlyRent)}</dd><dt>Advance</dt><dd>${costs.advanceMonths ?? "—"} month(s)</dd><dt>Security deposit</dt><dd>${formatXaf(costs.securityDeposit)}</dd>`;
    clone.querySelector(".details-button").addEventListener("click", () => openDialog(listing));
    grid.append(clone);
  });
  grid.setAttribute("aria-busy", "false");
  document.querySelector("#result-count").textContent = `${filtered.length} of ${state.listings.length} local listing${state.listings.length === 1 ? "" : "s"}`;
  document.querySelector("#empty-state").hidden = filtered.length > 0;
}

async function initialise() {
  try {
    const response = await fetch("api/listings.php", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Local API returned ${response.status}`);
    const payload = await response.json();
    state.listings = payload.listings || [];
    state.snapshot = payload.snapshot;
    document.querySelector("#snapshot-meta").textContent = `${state.listings.length} listings · generated ${new Date(payload.snapshot.generated_at).toLocaleString()}`;
    populateCities();
    render();
  } catch (error) {
    document.querySelector("#listing-grid").setAttribute("aria-busy", "false");
    document.querySelector("#listing-grid").innerHTML = `<p class="empty-state">Could not read the local snapshot. Confirm XAMPP MySQL is running and the private configuration path is correct. (${escapeHtml(error.message)})</p>`;
    document.querySelector("#snapshot-meta").textContent = "Local database unavailable";
  }
}

document.querySelectorAll("select").forEach(input => input.addEventListener("change", render));
document.querySelector("#reset-filters").addEventListener("click", () => { document.querySelectorAll("select").forEach(input => { input.value = ""; }); render(); });
document.querySelector("#close-dialog").addEventListener("click", () => document.querySelector("#listing-dialog").close());
document.querySelector("#listing-dialog").addEventListener("click", event => { if (event.target.id === "listing-dialog") event.currentTarget.close(); });
initialise();
