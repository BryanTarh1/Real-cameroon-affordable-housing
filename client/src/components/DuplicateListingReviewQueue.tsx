import { useState } from "react";
import { CopyCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function DuplicateListingReviewQueue({ enabled }: { enabled: boolean }) {
  const utils = trpc.useUtils();
  const reviews = trpc.operations.duplicateListingReviews.useQuery(undefined, { enabled });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const decide = trpc.operations.decideDuplicateListingReview.useMutation({
    onSuccess: () => { utils.operations.duplicateListingReviews.invalidate(); toast.success("Duplicate-review decision recorded"); },
    onError: error => toast.error("Unable to record duplicate-review decision", { description: error.message }),
  });
  if (!enabled) return null;
  return <section className="ops-section"><div className="ops-route-heading"><span className="ops-route-number">00</span><h3><CopyCheck size={18} /> Duplicate-review signals</h3><span className="ops-count">{reviews.data?.length ?? 0}</span></div><p className="ops-guidance">Signals flag possible re-posting from matching public listing facts. They never hide, reject, or penalise a listing automatically; a designated reviewer must assess the evidence and record a reason.</p>{reviews.isLoading ? <p>Loading duplicate-review signals…</p> : !reviews.data?.length ? <p className="muted">No duplicate-listing signals are awaiting review.</p> : <div className="ops-card-list">{reviews.data.map(review => { const note = notes[review.id] ?? ""; return <article key={review.id} className="ops-card"><div className="ops-card-head"><div><span>{review.listingCity} · {review.listingNeighborhood} · {review.listingId}</span><h4>{review.listingTitle}</h4></div><b>{review.confidenceScore}% signal</b></div><p>{review.signalSummary}</p><small>Submitted {new Date(review.createdAt).toLocaleString()} · review remains non-punitive until a human decision.</small><textarea value={note} maxLength={500} onChange={event => setNotes(current => ({ ...current, [review.id]: event.target.value }))} placeholder="Required reviewer reason" /><div className="ops-actions"><button className="button-secondary" disabled={decide.isPending || note.trim().length < 6} onClick={() => decide.mutate({ reviewId: review.id, decision: "dismissed", note })}>Dismiss signal</button><button className="button-secondary" disabled={decide.isPending || note.trim().length < 6} onClick={() => decide.mutate({ reviewId: review.id, decision: "confirmed_duplicate", note })}>Confirm duplicate</button></div></article>; })}</div>}</section>;
}
