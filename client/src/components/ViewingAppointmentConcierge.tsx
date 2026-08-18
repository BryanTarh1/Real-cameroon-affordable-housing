import { useMemo, useState } from "react";
import { CalendarClock, LockKeyhole, PhoneCall, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { interpolate, text, type PublicLanguage } from "@/lib/marketplaceLocale";

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

function appointmentStatusLabel(status: string, language: PublicLanguage) {
  const labels = language === "fr"
    ? { requested: "Demandée — en attente de l’Agent", confirmed: "Réponse de l’Agent — visite programmée", completed: "Visite terminée", cancelled: "Annulée", declined: "Refusée" }
    : { requested: "Requested — awaiting Agent", confirmed: "Agent responded — viewing scheduled", completed: "Viewing completed", cancelled: "Cancelled", declined: "Declined" };
  return labels[status as keyof typeof labels] ?? status;
}

export function ViewingAppointmentRequest({ listing, language }: { listing: ListingAppointmentContext; language: PublicLanguage }) {
  const utils = trpc.useUtils();
  const [requestedStart, setRequestedStart] = useState(() => defaultDateTime(26));
  const [requestedEnd, setRequestedEnd] = useState(() => defaultDateTime(27));
  const [contactPreference, setContactPreference] = useState<"whatsapp" | "phone">("whatsapp");
  const [privateContact, setPrivateContact] = useState("");
  const [seekerNote, setSeekerNote] = useState("");
  const request = trpc.marketplace.appointments.request.useMutation({
    onSuccess: () => {
      utils.marketplace.appointments.mine.invalidate();
      toast.success(text(language, "requestViewing"), { description: text(language, "appointmentPrivacy") });
    },
    onError: error => toast.error(text(language, "requestError"), { description: error.message }),
  });

  const canRequest = listing.verificationStatus === "physical_verified";

  return <section className="appointment-request">
    <div className="appointment-heading"><span className="appointment-icon"><CalendarClock size={17} /></span><div><span className="section-overline">{text(language, "concierge")}</span><h3>{text(language, "reserveWindow")}</h3></div></div>
    <p>{canRequest ? text(language, "appointmentAvailable") : text(language, "appointmentUnavailable")}</p>
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
      <div className="two-fields"><label>{text(language, "preferredStart")}<input type="datetime-local" required value={requestedStart} min={defaultDateTime(1)} onChange={event => setRequestedStart(event.target.value)} /></label><label>{text(language, "preferredEnd")}<input type="datetime-local" required value={requestedEnd} min={requestedStart} onChange={event => setRequestedEnd(event.target.value)} /></label></div>
      <div className="two-fields"><label>{text(language, "contactRoute")}<select value={contactPreference} onChange={event => setContactPreference(event.target.value as typeof contactPreference)}><option value="whatsapp">WhatsApp</option><option value="phone">{text(language, "phoneCall")}</option></select></label><label>{interpolate(text(language, "yourNumber"), { route: contactPreference === "whatsapp" ? "WhatsApp" : text(language, "phoneCall") })}<input required minLength={8} maxLength={20} value={privateContact} onChange={event => setPrivateContact(event.target.value)} placeholder="+237 6XX XXX XXX" /></label></div>
      <label>{text(language, "noteAgent")} <small>({text(language, "optional")})</small><textarea maxLength={500} value={seekerNote} onChange={event => setSeekerNote(event.target.value)} placeholder={text(language, "notePlaceholder")} /></label>
      <div className="appointment-privacy"><LockKeyhole size={15} /><span>{text(language, "appointmentPrivacy")}</span></div>
      <div className="appointment-privacy"><LockKeyhole size={15} /><span>{language === "fr" ? "Sécurité : convenez d’un point de rencontre près d’un repère public. N’envoyez jamais de loyer, de caution ou de fonds de location par cette demande." : "Safety: agree a meeting point near a public landmark. Never send rent, a deposit, or tenancy funds through this request."}</span></div>
      <button className="button-primary" disabled={request.isPending}>{request.isPending ? text(language, "sendingRequest") : text(language, "requestViewing")}</button>
    </form>}
  </section>;
}

export function SeekerAppointmentHistory({ isAuthenticated, language }: { isAuthenticated: boolean; language: PublicLanguage }) {
  const utils = trpc.useUtils();
  const appointments = trpc.marketplace.appointments.mine.useQuery(undefined, { enabled: isAuthenticated });
  const [outcomeForAppointment, setOutcomeForAppointment] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<"matched_listing" | "price_differed" | "already_rented" | "did_not_attend">("matched_listing");
  const [outcomeNote, setOutcomeNote] = useState("");
  const cancel = trpc.marketplace.appointments.cancel.useMutation({
    onSuccess: () => { utils.marketplace.appointments.mine.invalidate(); toast.success(text(language, "cancel")); },
    onError: error => toast.error(text(language, "cancelError"), { description: error.message }),
  });
  const recordOutcome = trpc.marketplace.appointments.recordSeekerOutcome.useMutation({
    onSuccess: () => {
      setOutcomeForAppointment(null);
      setOutcomeNote("");
      utils.marketplace.appointments.mine.invalidate();
      toast.success(language === "fr" ? "Votre résultat privé a été enregistré." : "Your private viewing outcome was recorded.");
    },
    onError: error => toast.error(language === "fr" ? "Impossible d’enregistrer le résultat." : "Unable to record this outcome.", { description: error.message }),
  });
  const activeAppointments = useMemo(() => appointments.data?.filter(item => ["requested", "confirmed"].includes(item.status)) ?? [], [appointments.data]);
  const eligibleForOutcome = useMemo(() => appointments.data?.filter(item => ["confirmed", "completed", "no_show"].includes(item.status) && new Date(item.requestedStart) <= new Date()) ?? [], [appointments.data]);

  if (!isAuthenticated) return <section className="appointment-history"><span className="section-overline">{text(language, "concierge")}</span><h2>{text(language, "organiseVisits")}</h2><p>{text(language, "historyAnonymous")}</p></section>;
  return <section className="appointment-history" id="appointments"><div><span className="section-overline">{text(language, "concierge")}</span><h2>{text(language, "scheduledVisits")}</h2></div><p>{text(language, "historyBody")}</p>{appointments.isLoading ? <p className="muted">{text(language, "loadingRequests")}</p> : activeAppointments.length ? <div className="appointment-list">{activeAppointments.map(appointment => <article key={appointment.id}><div><b>{appointment.listingTitle}</b><span>{appointment.city} / {appointment.neighborhood} · {new Date(appointment.requestedStart).toLocaleString(language === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>{appointment.agentNote && <small>{text(language, "agentNote")}: {appointment.agentNote}</small>}{appointment.status === "requested" && <small>{language === "fr" ? "L’Agent doit confirmer la disponibilité dans les 48 heures." : "The Agent must reconfirm availability within 48 hours."}</small>}</div><div><span className={`appointment-status ${appointment.status}`}>{appointmentStatusLabel(appointment.status, language)}</span><button className="text-button" onClick={() => cancel.mutate({ appointmentId: appointment.id, note: text(language, "cancelAppointmentNote") })} disabled={cancel.isPending}><XCircle size={14} /> {text(language, "cancel")}</button></div></article>)}</div> : <p className="muted"><PhoneCall size={15} /> {text(language, "noAppointments")}</p>}{eligibleForOutcome.length ? <section className="protected-detail-gate"><div><span>POST-VIEWING OUTCOME</span><h3>{language === "fr" ? "Comment la visite s’est-elle passée ?" : "How did the viewing go?"}</h3><p>{language === "fr" ? "Ce signal privé aide AHC à vérifier la disponibilité et les prix. Il ne crée pas d’avis public." : "This private signal helps AHC verify availability and price accuracy. It never creates a public rating or review."}</p></div>{eligibleForOutcome.map(appointment => <div key={`outcome-${appointment.id}`}><button className="button-secondary" onClick={() => setOutcomeForAppointment(outcomeForAppointment === appointment.id ? null : appointment.id)}>{appointment.listingTitle}</button>{outcomeForAppointment === appointment.id && <div className="appointment-request"><label>{language === "fr" ? "Résultat" : "Outcome"}<select value={outcome} onChange={event => setOutcome(event.target.value as typeof outcome)}><option value="matched_listing">{language === "fr" ? "Correspond à l’annonce" : "Matched the listing"}</option><option value="price_differed">{language === "fr" ? "Prix différent" : "Price differed"}</option><option value="already_rented">{language === "fr" ? "Déjà loué" : "Already rented"}</option><option value="did_not_attend">{language === "fr" ? "Visite non effectuée" : "Did not attend"}</option></select></label><label>{language === "fr" ? "Note facultative" : "Optional note"}<textarea maxLength={500} value={outcomeNote} onChange={event => setOutcomeNote(event.target.value)} /></label><button className="button-primary" disabled={recordOutcome.isPending} onClick={() => recordOutcome.mutate({ appointmentId: appointment.id, outcome, note: outcomeNote.trim() || undefined })}>{language === "fr" ? "Enregistrer le résultat" : "Record private outcome"}</button></div>}</div>)}</section> : null}</section>;
}
