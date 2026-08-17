import { useAuth } from "@/_core/hooks/useAuth";
import { OfficialServiceReceipt } from "@/pages/OfficialServiceReceipt";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, Heart, History, ImagePlus, LoaderCircle, Mail, PlayCircle, ReceiptText, RefreshCw, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const formatXaf = (amount: number) => new Intl.NumberFormat("en-CM", { maximumFractionDigits: 0 }).format(amount) + " XAF";
const labelOrderType = (type: string) => type.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
const labelStatus = (status: string) => status.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
const shortDate = (value: Date | string) => new Date(value).toLocaleDateString("en-CM", { day: "numeric", month: "short", year: "numeric" });

function TestOnlyCheckoutSimulator() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const run = (outcome: "success" | "error") => {
    setState("loading");
    window.setTimeout(() => setState(outcome), 1_800);
  };
  const pending = state === "loading";
  return <section className="rounded-3xl border-2 border-dashed border-[#d78a1d]/60 bg-[#fff9eb] p-6 shadow-sm" aria-labelledby="test-checkout-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><span className="inline-flex rounded-full bg-[#d78a1d] px-2.5 py-1 text-xs font-black tracking-wide text-white">TEST ONLY</span><h2 id="test-checkout-title" className="mt-3 flex items-center gap-2 font-serif text-2xl"><PlayCircle className="text-[#d78a1d]" />Checkout-feedback simulator</h2><p className="mt-2 max-w-2xl text-sm text-slate-700">Use this safe interface to review loading, success, retry, and error messages before live AHC platform-service payment work. It never contacts a payment provider, charges a payment method, or creates an AHC order.</p></div><ShieldCheck className="hidden shrink-0 text-[#17333b] sm:block" size={30} aria-hidden="true" /></div>
    <div className="mt-5 rounded-2xl bg-white/80 p-4" role="status" aria-live="polite">{state === "idle" && <p className="text-sm text-slate-700"><b>Ready for a safe test.</b> Choose a result below; the simulator pauses briefly to show the pending state.</p>}{state === "loading" && <p className="flex items-center gap-2 text-sm font-semibold text-[#17333b]"><LoaderCircle className="animate-spin text-[#d78a1d]" size={18} />Simulating a protected checkout response…</p>}{state === "success" && <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 size={18} />Success feedback shown. No payment, order, receipt, or account balance changed.</p>}{state === "error" && <p className="flex items-center gap-2 text-sm font-semibold text-red-800"><CircleAlert size={18} />Temporary-error feedback shown. Retry remains available and nothing was charged.</p>}</div>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row"><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17333b] px-4 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60" disabled={pending} onClick={() => run("success")}>{pending ? <><LoaderCircle className="animate-spin" size={17} />Testing…</> : state === "error" ? <><RefreshCw size={17} />Retry successful path</> : <><CheckCircle2 size={17} />Simulate success</>}</button><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-800/25 bg-white px-4 py-3 text-sm font-bold text-red-800 disabled:cursor-wait disabled:opacity-60" disabled={pending} onClick={() => run("error")}><CircleAlert size={17} />Simulate temporary error</button></div>
  </section>;
}

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const dashboard = trpc.account.dashboard.useQuery(undefined, { enabled: Boolean(user) });
  const browsingHistory = trpc.account.browsingHistory.useQuery(undefined, { enabled: Boolean(user) });
  const [name, setName] = useState("");
  const [emailAccountUpdatesEnabled, setEmailAccountUpdatesEnabled] = useState(true);
  const [emailMatchAlertsEnabled, setEmailMatchAlertsEnabled] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const receipt = trpc.account.officialServiceReceipt.useQuery({ orderId: receiptOrderId ?? "" }, { enabled: Boolean(user) && Boolean(receiptOrderId) });
  const updateProfile = trpc.account.updateDisplayName.useMutation({
    onSuccess: () => {
      void utils.account.dashboard.invalidate();
      toast.success("Profile saved", { description: "Your AHC display name has been updated." });
    },
    onError: error => toast.error("We could not save your profile", { description: error.message || "Please check your name and try again." }),
  });
  const updatePreferences = trpc.account.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      void utils.account.dashboard.invalidate();
      toast.success("Email preferences saved", { description: "Your choices are stored. AHC does not send email alerts until a delivery provider is configured." });
    },
    onError: error => toast.error("We could not save email preferences", { description: error.message || "Please try again." }),
  });

  useEffect(() => {
    if (dashboard.data?.profile?.name) setName(dashboard.data.profile.name);
  }, [dashboard.data?.profile?.name]);
  useEffect(() => {
    if (!dashboard.data?.preferences) return;
    setEmailAccountUpdatesEnabled(dashboard.data.preferences.emailAccountUpdatesEnabled);
    setEmailMatchAlertsEnabled(dashboard.data.preferences.emailMatchAlertsEnabled);
  }, [dashboard.data?.preferences]);

  const uploadProfileImage = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a small JPG or PNG", { description: "Profile pictures must be JPG or PNG and no larger than 2 MB." });
      return;
    }
    setAvatarUploading(true);
    try {
      const response = await fetch("/api/customer/profile-picture", { method: "POST", headers: { "Content-Type": file.type }, body: file });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error || "The profile picture could not be uploaded.");
      await utils.account.dashboard.invalidate();
      toast.success("Profile picture updated", { description: "Your image is stored as a private account reference." });
    } catch (error) {
      toast.error("We could not update your picture", { description: error instanceof Error ? error.message : "Please choose another image and try again." });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (authLoading || dashboard.isLoading) {
    return <main className="min-h-screen bg-[#f7f3e9] px-5 py-24 text-[#17333b]" aria-busy="true"><div className="mx-auto flex max-w-4xl items-center gap-3 rounded-3xl bg-white p-8 shadow-sm"><LoaderCircle className="animate-spin text-[#d78a1d]" aria-hidden="true" /><p>Preparing your customer dashboard…</p></div></main>;
  }
  if (!user) {
    return <main className="min-h-screen bg-[#f7f3e9] px-5 py-24 text-[#17333b]"><section className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm"><CircleAlert className="mb-4 text-[#d78a1d]" aria-hidden="true" /><h1 className="font-serif text-3xl">Sign in to view your dashboard</h1><p className="mt-3 text-slate-600">Your profile and AHC platform-service orders are private. Sign in through a listing, then return here.</p><button className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#17333b] px-5 py-3 font-semibold text-white" onClick={() => navigate("/")}><ArrowLeft size={17} />Back to homes</button></section></main>;
  }
  if (dashboard.isError || !dashboard.data?.profile) {
    return <main className="min-h-screen bg-[#f7f3e9] px-5 py-24 text-[#17333b]"><section role="alert" className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm"><CircleAlert className="mb-4 text-red-700" aria-hidden="true" /><h1 className="font-serif text-3xl">We could not load your dashboard</h1><p className="mt-3 text-slate-600">{dashboard.error?.message || "Your account is still signed in. Please try again, or return to the marketplace and come back shortly."}</p><div className="mt-6 flex flex-wrap gap-3"><button className="inline-flex items-center gap-2 rounded-full bg-[#17333b] px-5 py-3 font-semibold text-white disabled:opacity-60" onClick={() => void dashboard.refetch()} disabled={dashboard.isFetching}>{dashboard.isFetching ? <><LoaderCircle className="animate-spin" size={17} />Retrying…</> : "Try again"}</button><button className="inline-flex items-center gap-2 rounded-full border border-[#17333b]/20 bg-white px-5 py-3 font-semibold" onClick={() => navigate("/")}><ArrowLeft size={17} />Back to homes</button></div></section></main>;
  }

  const { profile, orders } = dashboard.data;
  const favourites = dashboard.data.favourites ?? [];
  const history = browsingHistory.data ?? [];
  return <main className="min-h-screen bg-[#f7f3e9] px-4 py-12 text-[#17333b] sm:px-8"><div className="mx-auto max-w-6xl"><header className="mb-8 flex flex-col gap-4 border-b border-[#17333b]/15 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-bold uppercase tracking-[0.18em] text-[#d78a1d]">My AHC account</span><h1 className="mt-2 font-serif text-4xl">Your dashboard</h1><p className="mt-2 max-w-2xl text-slate-600">Manage your account, your private listing activity, and only AHC platform-service orders that belong to you. Rent, deposits, and other tenancy money are never collected here.</p></div><button className="inline-flex w-fit items-center gap-2 rounded-full border border-[#17333b]/20 bg-white px-4 py-2.5 text-sm font-bold hover:bg-[#17333b] hover:text-white" onClick={() => navigate("/")}><ArrowLeft size={16} />Marketplace</button></header>

    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.45fr]"><section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><UserRound className="text-[#d78a1d]" aria-hidden="true" /><h2 className="font-serif text-2xl">Profile</h2></div><p className="mt-2 text-sm text-slate-600">Your login email and role are protected. You can update the name shown in your AHC account and choose a small profile picture.</p><div className="mt-5 flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef5f3] text-xl font-black text-[#17333b]">{profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="Your AHC profile" className="h-full w-full object-cover" /> : (profile.name || "A").slice(0, 1).toUpperCase()}</div><label className="cursor-pointer rounded-xl border border-[#17333b]/20 px-3 py-2 text-sm font-bold hover:bg-[#f7f3e9]"><span className="inline-flex items-center gap-2"><ImagePlus size={16} />{avatarUploading ? "Uploading…" : "Choose picture"}</span><input className="sr-only" type="file" accept="image/jpeg,image/png" disabled={avatarUploading} onChange={event => { void uploadProfileImage(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></label></div><p className="mt-2 text-xs text-slate-500">JPG or PNG only, maximum 2 MB. AHC stores a private image reference, not the image itself in the database.</p><form className="mt-6 space-y-4" onSubmit={event => { event.preventDefault(); updateProfile.mutate({ name }); }}><label className="block text-sm font-semibold">Display name<input className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" value={name} minLength={2} maxLength={100} onChange={event => setName(event.target.value)} required /></label><label className="block text-sm font-semibold">Login email<input className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500" value={profile.email ?? "Not recorded"} readOnly /></label><p className="text-xs text-slate-500">Need to change your login email or account role? Contact AHC support; these are protected for account safety.</p><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17333b] px-4 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60" disabled={updateProfile.isPending || name.trim().length < 2}>{updateProfile.isPending ? <><LoaderCircle className="animate-spin" size={17} />Saving profile…</> : <><Save size={17} />Save profile</>}</button></form></section>

      <section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-serif text-2xl">My platform-service orders</h2><p className="mt-1 text-sm text-slate-600">Payment status updates only after AHC Operations reconciles a submitted mobile-money reference.</p></div><span className="rounded-full bg-[#eef5f3] px-3 py-1 text-sm font-bold text-[#17333b]">{orders.length} order{orders.length === 1 ? "" : "s"}</span></div>{orders.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-7 text-center"><CheckCircle2 className="mx-auto mb-3 text-[#d78a1d]" /><h3 className="font-bold">No platform-service orders yet</h3><p className="mt-1 text-sm text-slate-600">When you request an AHC paid service, its status will appear here. Property rent and deposits will not.</p></div> : <div className="mt-5 space-y-3">{orders.map(order => <article key={order.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold">{labelOrderType(order.type)}</p><p className="mt-1 text-xs text-slate-500">Order {order.id} · created {shortDate(order.createdAt)}</p></div><div className="text-left sm:text-right"><p className="font-bold text-[#17333b]">{formatXaf(order.amountXaf)}</p><span className="mt-1 inline-block rounded-full bg-[#f7f3e9] px-2.5 py-1 text-xs font-bold text-[#5a4b34]">{labelStatus(order.status)}</span></div></div><div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">{order.provider && <span>{order.provider === "mtn_momo" ? "MTN MoMo" : "Orange Money"}</span>}{order.providerReference && <span>Reference: {order.providerReference}</span>}{order.reconciliationNote && <span className="basis-full rounded-lg bg-slate-50 p-2">Operations note: {order.reconciliationNote}</span>}</div>{order.status === "confirmed" && order.officialReceiptCode && <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#17333b]/20 px-3 py-2 text-sm font-bold hover:bg-[#17333b] hover:text-white" onClick={() => setReceiptOrderId(order.id)}><ReceiptText size={16} />Open official receipt</button>}</article>)}</div>}</section></div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Heart className="text-[#d78a1d]" aria-hidden="true" /><h2 className="font-serif text-2xl">Saved homes</h2></div><p className="mt-2 text-sm text-slate-600">These favourites are private to your account. Save or remove them from a signed-in property detail.</p>{favourites.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">You have not saved a home yet. Open a listing and choose <b>Save to shortlist</b> to compare it later.</div> : <div className="mt-5 space-y-3">{favourites.slice(0, 8).map(listing => <article key={listing.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex gap-3"><Heart className="mt-0.5 shrink-0 fill-[#d78a1d] text-[#d78a1d]" size={17} /><div><h3 className="font-bold">{listing.title}</h3><p className="text-sm text-slate-600">{listing.neighborhood}, {listing.city} · saved {shortDate(listing.savedAt)}</p><p className="mt-2 text-sm font-bold text-[#17333b]">Total move-in cash: {formatXaf(listing.costs.totalMoveInCashRequired)}</p></div></div></article>)}</div>}</section>
      <section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><History className="text-[#d78a1d]" aria-hidden="true" /><h2 className="font-serif text-2xl">Recent browsing</h2></div><p className="mt-2 text-sm text-slate-600">Only listings opened while signed in appear here. This history is private to your account and keeps no exact-address data.</p>{browsingHistory.isLoading ? <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#f7f3e9] p-5 text-sm"><LoaderCircle className="animate-spin text-[#d78a1d]" size={17} />Loading your private history…</div> : browsingHistory.isError ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>We could not load recent browsing.</p><button className="mt-3 font-bold underline" onClick={() => void browsingHistory.refetch()}>Try again</button></div> : history.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Open a signed-in listing to start your private recent-browsing list.</div> : <div className="mt-5 space-y-3">{history.map(listing => <article key={listing.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex gap-3"><History className="mt-0.5 shrink-0 text-[#d78a1d]" size={17} /><div><h3 className="font-bold">{listing.title}</h3><p className="text-sm text-slate-600">{listing.neighborhood}, {listing.city} · last opened {shortDate(listing.lastViewedAt)}</p><p className="mt-2 text-sm font-bold text-[#17333b]">Total move-in cash: {formatXaf(listing.costs.totalMoveInCashRequired)}</p><p className="mt-1 text-xs text-slate-500">Opened {listing.viewCount} time{listing.viewCount === 1 ? "" : "s"}</p></div></div></article>)}</div>}</section></div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]"><section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><Mail className="text-[#d78a1d]" aria-hidden="true" /><h2 className="font-serif text-2xl">Email preferences</h2></div><p className="mt-2 text-sm text-slate-600">Choose which future AHC email categories you would like. These settings are stored now; no email is sent or implied until AHC configures an email-delivery provider.</p><form className="mt-5 space-y-4" onSubmit={event => { event.preventDefault(); updatePreferences.mutate({ emailAccountUpdatesEnabled, emailMatchAlertsEnabled }); }}><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4"><input className="mt-1 h-4 w-4 accent-[#17333b]" type="checkbox" checked={emailAccountUpdatesEnabled} onChange={event => setEmailAccountUpdatesEnabled(event.target.checked)} /><span><b className="block">Account and service updates</b><small className="block pt-1 text-slate-600">Future security, profile, and AHC platform-service status notices.</small></span></label><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4"><input className="mt-1 h-4 w-4 accent-[#17333b]" type="checkbox" checked={emailMatchAlertsEnabled} onChange={event => setEmailMatchAlertsEnabled(event.target.checked)} /><span><b className="block">New-home match alerts</b><small className="block pt-1 text-slate-600">Future alerts for fresh listings that match your saved preferences.</small></span></label><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17333b] px-4 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60" type="submit" disabled={updatePreferences.isPending}>{updatePreferences.isPending ? <><LoaderCircle className="animate-spin" size={17} />Saving choices…</> : <><Save size={17} />Save email preferences</>}</button></form></section><TestOnlyCheckoutSimulator /></div>
  </div>{receipt.data && <OfficialServiceReceipt receipt={receipt.data} onClose={() => setReceiptOrderId(null)} />}</main>;
}
