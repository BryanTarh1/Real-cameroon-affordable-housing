import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, Eye, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import "./acceptance-walkthrough.css";

type WalkthroughStep = {
  id: string;
  task: string;
  expected: string;
  boundary?: string;
  href?: string;
  hrefLabel?: string;
};

type WalkthroughRole = {
  number: string;
  role: string;
  purpose: string;
  signIn: string;
  steps: WalkthroughStep[];
};

const PROGRESS_KEY = "ahc-owner-acceptance-progress:v1";

const roles: WalkthroughRole[] = [
  {
    number: "01",
    role: "Anonymous visitor",
    purpose: "Verify that public discovery is useful without exposing private identity, contact, compound, or staff evidence.",
    signIn: "No sign-in. Start at the public marketplace.",
    steps: [
      { id: "visitor-search", task: "Search by city, landmark area, bedrooms, and maximum Total Move-In Cash Required.", expected: "Cards update around the upfront move-in cash figure; the map remains landmark-area based rather than showing a compound door.", href: "#/", hrefLabel: "Open marketplace" },
      { id: "visitor-freshness", task: "Compare the public freshness line and verification badges on two cards.", expected: "Only public, relative trust signals such as “Reconfirmed 2 days ago” and approved badges appear; field proof and audit notes do not appear." },
      { id: "visitor-video", task: "Open a verified Walk-Thru and select “View full home details.”", expected: "The action enters the property flow and asks for an AHC account before protected detail or contact actions.", boundary: "Do not expect a video card to reveal the precise address or private moderator evidence." },
    ],
  },
  {
    number: "02",
    role: "Seeker",
    purpose: "Verify protected renter actions and consented lead logging without collecting a payment or promising a tenancy.",
    signIn: "Use the labelled Seeker test account from the non-production accounts reference when a property prompts you to sign in.",
    steps: [
      { id: "seeker-detail", task: "Open a listing from search, sign in, and review the itemised rent, advance, deposit, fees, and Total Move-In Cash Required.", expected: "Details open only after AHC sign-in and the total equals the displayed itemised components." },
      { id: "seeker-whatsapp", task: "Select “Chat on WhatsApp” from the property detail panel.", expected: "AHC records a privacy-limited contact-intent event before opening the prefilled WhatsApp handoff.", boundary: "This records an intent, not messages, payment, a viewing, or a tenancy. Do not send rent or deposits through AHC." },
      { id: "seeker-report", task: "Review the inaccurate-cost, unavailable-listing, and unofficial-fee report options. Submit a report only if you intentionally want to test the data state.", expected: "The report requires a signed-in seeker and is routed to the private trust-review process.", boundary: "Use only good-faith information. Do not create multiple reports to force a safety hold." },
      { id: "seeker-alert", task: "Set and then review a consented match-alert preference, or request a future viewing window where the listing permits it.", expected: "The preference is explicit and revocable; a viewing request remains private to the responsible Agent and authorised staff." },
    ],
  },
  {
    number: "03",
    role: "Paid Agent",
    purpose: "Verify that commercial access, listing credits, submission, freshness, and concierge work are distinct from staff authority.",
    signIn: "Sign in at the Agent entry with the labelled paid-Agent test account. Its fixture has active Growth access and one available listing credit.",
    steps: [
      { id: "agent-access", task: "Open the Agent workspace and confirm the active access state and available listing credit.", expected: "The paid Agent sees the active commercial state. A credit is shown before a new listing can enter the review workflow.", href: "#/agent", hrefLabel: "Open Agent workspace" },
      { id: "agent-listing", task: "Start a listing submission and inspect the required itemised cost fields before saving or submitting a deliberate test listing.", expected: "The flow calculates Total Move-In Cash Required and does not allow self-publication; first publication remains under moderator review." },
      { id: "agent-freshness", task: "Find the inventory freshness control and inspect the 14-day reconfirmation requirement.", expected: "Only an active Agent can reconfirm eligible inventory. Expired access blocks reconfirmation with a renewal explanation." },
      { id: "agent-appointments", task: "Open the concierge queue and inspect confirmation, decline, cancellation, and outcome controls for your own listings.", expected: "The Agent sees only relevant private appointments; landmark privacy remains until the agreed process permits disclosure." },
    ],
  },
  {
    number: "04",
    role: "New and pending Agent",
    purpose: "Test the unified supplier pathway and the boundaries that prevent public registration from creating paid access or staff authority.",
    signIn: "Use the labelled pending-payment Agent fixture through the Agent entry.",
    steps: [
      { id: "supplier-path", task: "Confirm that every property supplier enters through the same Agent account and Agent workspace.", expected: "There is one commercial supplier pathway. Listing publication still requires active paid access, a listing credit, and moderator review." },
      { id: "pending-agent", task: "Sign in as the pending-payment Agent and attempt to reach a paid listing action.", expected: "The interface clearly explains the pending-payment or no-credit boundary rather than granting listing publication or reconfirmation." },
      { id: "no-self-role", task: "Confirm neither user can select Moderator or Admin authority from public onboarding.", expected: "Public registration creates no staff role. Only a trusted Admin can deliberately assign staff authority." },
    ],
  },
  {
    number: "05",
    role: "Field Moderator",
    purpose: "Verify evidence-based physical verification, route batching, and operational privacy without granting financial or governance authority.",
    signIn: "Sign in at Field Operations with the labelled Field Moderator test account.",
    steps: [
      { id: "moderator-queue", task: "Open Field Operations and inspect the assignment queue, evidence history, and verification controls.", expected: "Only a signed-in Moderator or Admin can see operational data. A passed result requires the structured proof package defined by the workflow.", href: "#/operations", hrefLabel: "Open Field Operations" },
      { id: "moderator-evidence", task: "Review an existing labelled test verification before uploading or changing any evidence.", expected: "Operational evidence stays inside protected staff routes; public listing cards show only approved verification signals." },
      { id: "moderator-batches", task: "Open the route-batching board and inspect approximate landmark-area grouping.", expected: "The board groups eligible work by city and approximate area without exposing compound doors or unrelated private evidence.", href: "#/operations/batches", hrefLabel: "Open route batches" },
      { id: "moderator-commission", task: "Check a verification commission state after a passed verification.", expected: "The allocation is held until independent-audit and Admin evidence-review conditions are satisfied. A Moderator cannot approve their own payout." },
    ],
  },
  {
    number: "06",
    role: "Administrator",
    purpose: "Verify governance, role separation, audits, safety holds, and non-custodial payment boundaries without performing destructive changes unnecessarily.",
    signIn: "Sign in at the private Admin route with the labelled Admin test account.",
    steps: [
      { id: "admin-entry", task: "Open the Admin workspace and verify that a signed-out or wrong-role browser sees only a sign-in or assignment boundary.", expected: "Only an explicitly signed-in Admin can load governance controls and related private data.", href: "#/admin", hrefLabel: "Open Admin" },
      { id: "admin-settings", task: "Inspect commercial settings, cash-flow audit, and the commission ledger. Do not save a change unless you intend to alter the test fixture.", expected: "Commercial values are governed and audit-oriented; the cash-flow screen does not function as rent, deposit, or escrow custody." },
      { id: "admin-trust", task: "Inspect trust reports, fair-review signals, safety holds, and the WhatsApp lead audit.", expected: "A lead event shows only a tracked contact intent. A safety hold is an investigation trigger, not automatic proof of misconduct." },
      { id: "admin-roles", task: "Review the account-protection and role-assignment controls without promoting or banning a real account.", expected: "Only Admin can change roles or bans, and role assignment is never exposed through public sign-up." },
      { id: "admin-boundary", task: "Verify that field proof links are visible only within authorised staff areas, then return to the public marketplace.", expected: "No public card, shared preview, or property link reveals staff evidence, audit logs, contact data, or exact compound location." },
    ],
  },
];

function getInitialProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {} as Record<string, boolean>;
  }
}

export default function AcceptanceWalkthrough() {
  const [progress, setProgress] = useState<Record<string, boolean>>(getInitialProgress);
  const totalSteps = useMemo(() => roles.flatMap(role => role.steps), []);
  const completed = totalSteps.filter(step => progress[step.id]).length;
  const allComplete = completed === totalSteps.length;

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  const setStep = (stepId: string) => setProgress(current => ({ ...current, [stepId]: !current[stepId] }));
  const reset = () => setProgress({});

  return <main className="acceptance-page">
    <section className="acceptance-hero">
      <a className="acceptance-back" href="#/admin"><ArrowLeft size={16} /> Back to Admin</a>
      <div className="acceptance-kicker"><ClipboardCheck size={16} /> AHC acceptance exercise</div>
      <div className="acceptance-hero-grid">
        <div>
          <h1>Learn the platform by proving each safe workflow.</h1>
          <p>This guided exercise takes you from anonymous search through Seeker, Agent, Field Moderator, and Admin activity. Mark a step only after its stated result is visible.</p>
        </div>
        <aside className="acceptance-score" aria-label="Acceptance progress"><span>Exercise progress</span><b>{completed} / {totalSteps.length}</b><div><i style={{ width: `${totalSteps.length ? Math.round((completed / totalSteps.length) * 100) : 0}%` }} /></div><small>{allComplete ? "All guided checks recorded." : "Progress is stored only in this browser."}</small></aside>
      </div>
    </section>

    <section className="acceptance-safety" aria-label="Safe testing rules"><ShieldCheck size={20} /><div><b>Safe test order</b><p>Begin anonymously, then use the labelled non-production accounts one role at a time. Sign out between roles. Do not alter prices, bans, role assignments, evidence, or payouts unless you intentionally want to reset the demo fixture afterward.</p></div></section>

    <section className="acceptance-role-list">
      {roles.map(role => <article className="acceptance-role" key={role.role}>
        <header><span>{role.number}</span><div><h2>{role.role}</h2><p>{role.purpose}</p></div></header>
        <div className="acceptance-signin"><LockKeyhole size={16} /><span><b>How to enter:</b> {role.signIn}</span></div>
        <ol>
          {role.steps.map((step, index) => <li className={progress[step.id] ? "is-complete" : ""} key={step.id}>
            <button type="button" className="acceptance-check" onClick={() => setStep(step.id)} aria-pressed={Boolean(progress[step.id])} aria-label={`Mark ${role.role} step ${index + 1} complete`}><CheckCircle2 size={20} /></button>
            <div className="acceptance-step-copy"><span>Check {role.number}.{index + 1}</span><h3>{step.task}</h3><p><b>Expected:</b> {step.expected}</p>{step.boundary && <p className="acceptance-boundary"><Eye size={14} /><b>Boundary:</b> {step.boundary}</p>}{step.href && <a href={step.href} className="acceptance-link">{step.hrefLabel} <ExternalLink size={14} /></a>}</div>
          </li>)}
        </ol>
      </article>)}
    </section>

    <section className="acceptance-failure"><TriangleAlert size={22} /><div><h2>If a check does not behave as expected</h2><p>Stop before repeating an irreversible action. Record the role, route, exact action, expected outcome, actual outcome, time, and a screenshot. Do not disclose passwords, private evidence, contact details, or copied access tokens in the report. Then return to the relevant protected route only after the issue has been reviewed.</p></div></section>
    <footer className="acceptance-footer"><button className="button-secondary" onClick={reset}>Reset this browser’s checkmarks</button><a href="#/">Return to marketplace</a></footer>
  </main>;
}
