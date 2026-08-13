import { useMemo, useState } from "react";
import { CalendarClock, LockKeyhole, PhoneCall, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ListingAppointmentContext = {
  id: string;
  title: string;
  city: string;
  neighborhood: string;
  verificationStatus: string;
};

function defaultDateTime(hoursAhead: number) {
  const value = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  value.setMinutes(0, 0, 0);
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ViewingAppointmentRequest({ listing }: { listing: ListingAppointmentContext }) {
  const utils = trpc.useUtils();
  const [requestedStart, setRequestedStart] = useState(() => defaultDateTime(26));
  const [requestedEnd, setRequestedEnd] = useState(() => defaultDateTime(27));
  const [contactPreference, setContactPreference] = useState<"whatsapp" | "phone">("whatsapp");
  const [privateContact, setPrivateContact] = useState("");
  const [seekerNote, setSeekerNote] = useState("");
  const request = trpc.marketplace.appointments.request.useMutation({
    onSuccess: () => {
      utils.marketplace.appointments.mine.invalidate();
      toast.success("Viewing request sent", { description: "The Agent can confirm or decline without seeing your contact details until confirmation." });
    },
    onError: error => toast.error("Unable to request this viewing", { description: error.message }),
  });

  const canRequest = listing.verificationStatus === "physical_verified";

  return <section className="appointment-request">
    <div className="appointment-heading"><span className="appointment-icon"><CalendarClock size={17} /></span><div><span className="section-overline">Viewing concierge</span><h3>Reserve a viewing window</h3></div></div>
    <p>{canRequest ? "Send a time window. The Agent must accept it before your number is released and before access details are agreed." : "Appointments open only for physically verified, live homes."}</p>
    {canRequest && <form onSubmit={event => {
      event.preventDefault();
      request.mutate({
        listingId: listing.id,
        requestedStart: new Date(requestedStart),
        requestedEnd: new Date(requestedEnd),
        contactPreference,
        privateContact,
        seekerNote: seekerNote || undefined,
      });
    }}>
      <div className="two-fields"><label>Preferred start<input type="datetime-local" required value={requestedStart} min={defaultDateTime(1)} onChange={event => setRequestedStart(event.target.value)} /></label><label>Preferred end<input type="datetime-local" required value={requestedEnd} min={requestedStart} onChange={event => setRequestedEnd(event.target.value)} /></label></div>
      <div className="two-fields"><label>Contact route<select value={contactPreference} onChange={event => setContactPreference(event.target.value as typeof contactPreference)}><option value="whatsapp">WhatsApp</option><option value="phone">Phone call</option></select></label><label>Your {contactPreference === "whatsapp" ? "WhatsApp" : "phone"} number<input required minLength={8} maxLength={20} value={privateContact} onChange={event => setPrivateContact(event.target.value)} placeholder="+237 6XX XXX XXX" /></label></div>
      <label>Note for the Agent <small>(optional)</small><textarea maxLength={500} value={seekerNote} onChange={event => setSeekerNote(event.target.value)} placeholder="For example: I can arrive after work and would like to confirm the water point." /></label>
      <div className="appointment-privacy"><LockKeyhole size={15} /><span>AHC keeps your number private until the Agent confirms this request. The public map remains landmark-only.</span></div>
      <button className="button-primary" disabled={request.isPending}>{request.isPending ? "Sending request…" : "Request this viewing"}</button>
    </form>}
  </section>;
}

export function SeekerAppointmentHistory({ isAuthenticated }: { isAuthenticated: boolean }) {
  const utils = trpc.useUtils();
  const appointments = trpc.marketplace.appointments.mine.useQuery(undefined, { enabled: isAuthenticated });
  const cancel = trpc.marketplace.appointments.cancel.useMutation({
    onSuccess: () => { utils.marketplace.appointments.mine.invalidate(); toast.success("Viewing appointment cancelled"); },
    onError: error => toast.error("Unable to cancel", { description: error.message }),
  });
  const activeAppointments = useMemo(() => appointments.data?.filter(item => ["requested", "confirmed"].includes(item.status)) ?? [], [appointments.data]);

  if (!isAuthenticated) return <section className="appointment-history"><span className="section-overline">Viewing concierge</span><h2>Keep your home visits organized.</h2><p>Sign in when you open a property to request a private viewing window. AHC does not publish your contact number or exact compound access details.</p></section>;
  return <section className="appointment-history" id="appointments"><div><span className="section-overline">Viewing concierge</span><h2>Your scheduled property visits.</h2></div><p>Requests are private until accepted. Bring the listed cost breakdown and do not pay before your inspection.</p>{appointments.isLoading ? <p className="muted">Loading your viewing requests…</p> : activeAppointments.length ? <div className="appointment-list">{activeAppointments.map(appointment => <article key={appointment.id}><div><b>{appointment.listingTitle}</b><span>{appointment.city} / {appointment.neighborhood} · {new Date(appointment.requestedStart).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>{appointment.agentNote && <small>Agent note: {appointment.agentNote}</small>}</div><div><span className={`appointment-status ${appointment.status}`}>{appointment.status}</span><button className="text-button" onClick={() => cancel.mutate({ appointmentId: appointment.id, note: "Seeker cancelled this viewing request." })} disabled={cancel.isPending}><XCircle size={14} /> Cancel</button></div></article>)}</div> : <p className="muted"><PhoneCall size={15} /> No active viewing requests. Open a verified home to reserve a private time window.</p>}</section>;
}
