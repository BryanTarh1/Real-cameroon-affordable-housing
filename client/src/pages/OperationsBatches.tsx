import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { MapPin, Route, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import "./launch-refinements.css";

const formatXaf = (value: number) => `${new Intl.NumberFormat("en-US").format(value)} XAF`;

export default function OperationsBatches() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const enabled = isAuthenticated && (user?.role === "admin" || user?.role === "moderator");
  const batches = trpc.operations.verificationBatches.useQuery(undefined, { enabled });
  const claim = trpc.operations.claimVerification.useMutation({
    onSuccess: () => {
      utils.operations.verificationBatches.invalidate();
      utils.operations.verificationQueue.invalidate();
      toast.success("Verification claimed. Coordinate the visit without sharing exact door details in this board.");
    },
    onError: error => toast.error(error.message),
  });

  if (!enabled) return <main className="operations-page" />;

  return <main className="operations-page"><div className="agent-drawer scroll operations-drawer"><a className="text-button" href="#/operations">← Back to Operations</a><header className="ops-atlas-header"><div className="ops-brand-lockup"><span className="ops-brand-emblem"><span /><span /><span /></span><span>Affordable Housing<b>Cameroon route desk</b></span></div><span className="section-overline">Field Moderator efficiency / approximate areas only</span><h1>Plan practical verification routes.</h1><p>Group paid, unassigned field checks by city and neighborhood. This board shows only listing titles and approximate landmark areas—not compound doors or private evidence.</p><span className="ops-trust-pulse"><i /> Privacy boundary active</span></header>
    <section className="ops-section"><div className="ops-route-heading"><span className="ops-route-number">01</span><h2><Route size={18} /> Route-ready verification batches</h2><span className="ops-count">{batches.data?.length ?? 0}</span></div><p className="ops-guidance">Estimated earnings are the configured Field Moderator share across the batch. Claim one visit at a time; existing assignment, conflict, evidence, and independent-audit rules still apply.</p>{batches.isLoading ? <p>Loading route opportunities…</p> : !batches.data?.length ? <p className="muted">No unassigned paid verification work is currently available to group into a route.</p> : <div className="ops-card-list">{batches.data.map(batch => <article key={`${batch.city}-${batch.neighborhood}`} className="ops-card"><div className="ops-card-head"><div><span>{batch.city} · neighborhood route</span><h3>{batch.neighborhood}</h3></div><b>{formatXaf(batch.estimatedFieldEarningsXaf)}</b></div><p className="ops-audit-line"><MapPin size={14} /> Approximate areas: {batch.landmarkAreas.join(" · ")}</p><p className="ops-audit-line">{batch.work.length} paid field check{batch.work.length === 1 ? "" : "s"} · first requested {new Date(batch.earliestRequestedAt).toLocaleDateString()}</p><div className="ops-card-list">{batch.work.map(item => <div key={item.verificationOrderId} className="ops-status-strip"><span><b>{item.title}</b><small>Near {item.landmark} · listing {item.listingId}</small></span>{user?.role === "moderator" ? <button className="button-primary" disabled={claim.isPending} onClick={() => claim.mutate({ verificationOrderId: item.verificationOrderId })}>Claim field check</button> : <small><ShieldCheck size={14} /> Admin oversight only</small>}</div>)}</div></article>)}</div>}</section>
  </div></main>;
}
