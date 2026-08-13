import { useState } from "react";
import { BadgeCheck, FileCheck2, Landmark, ShieldCheck } from "lucide-react";

type OwnerApplication = {
  status: "submitted" | "approved" | "changes_requested" | "rejected";
  reviewNote: string | null;
  createdAt: Date | string;
};

type OwnerDocuments = {
  governmentIdUrl: string;
  landTitleUrl: string;
  occupancyRightUrl: string;
  supportingDocumentUrl: string;
};

export function OwnerOnboardingStatus({
  application,
  onApply,
  submitting,
}: {
  application: OwnerApplication | null | undefined;
  onApply: (documents: OwnerDocuments) => void;
  submitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<OwnerDocuments>({ governmentIdUrl: "", landTitleUrl: "", occupancyRightUrl: "", supportingDocumentUrl: "" });

  if (application) {
    const approved = application.status === "approved";
    const label = approved ? "Direct Owner capacity approved" : application.status === "submitted" ? "Direct Owner evidence under review" : application.status.replaceAll("_", " ");
    return <section className={`agent-section owner-status ${approved ? "owner-status-approved" : ""}`}><h3><Landmark size={17} /> {label}</h3><p>{approved ? "New listings are permanently recorded as Direct Owner supply. The Direct Owner badge appears only after each listing also passes the ordinary property-review and publication process." : "Your Direct Owner declaration pauses new listing submissions while AHC reviews identity, property rights, and the supporting property evidence. Existing representative-Agent records are not relabelled."}</p><div className="owner-document-checks"><span><ShieldCheck size={15} /> Government ID supplied</span><span><FileCheck2 size={15} /> Land title supplied</span><span><FileCheck2 size={15} /> Occupancy right supplied</span><span><FileCheck2 size={15} /> Supporting property evidence supplied</span></div>{application.reviewNote && <p className="form-note"><b>Review note:</b> {application.reviewNote}</p>}</section>;
  }

  return <section className="agent-section owner-status"><h3><Landmark size={17} /> Claim Direct Owner capacity</h3><p>Only use this route if you will market homes you own directly. It is not a self-service badge: AHC requires identity, title, occupancy right, and supporting property evidence before a new listing can be recorded as Direct Owner supply. Representative Agents remain on the lighter Agent path and cannot claim this trust signal.</p>{!open ? <button type="button" className="button-secondary" onClick={() => setOpen(true)}>Start Direct Owner evidence review</button> : <form className="agent-form" onSubmit={event => { event.preventDefault(); onApply(documents); }}><label>Government ID reference URL<input required type="url" value={documents.governmentIdUrl} onChange={event => setDocuments({ ...documents, governmentIdUrl: event.target.value })} placeholder="Private secure-document URL" /></label><label>Land title reference URL<input required type="url" value={documents.landTitleUrl} onChange={event => setDocuments({ ...documents, landTitleUrl: event.target.value })} placeholder="Private land-title URL" /></label><label>Occupancy-right reference URL<input required type="url" value={documents.occupancyRightUrl} onChange={event => setDocuments({ ...documents, occupancyRightUrl: event.target.value })} placeholder="Private occupancy-right URL" /></label><label>Supporting property evidence URL<input required type="url" value={documents.supportingDocumentUrl} onChange={event => setDocuments({ ...documents, supportingDocumentUrl: event.target.value })} placeholder="Private property-document URL" /></label><button className="button-primary full-width" disabled={submitting}>{submitting ? "Sending evidence…" : "Submit Direct Owner evidence"}</button></form>}</section>;
}
