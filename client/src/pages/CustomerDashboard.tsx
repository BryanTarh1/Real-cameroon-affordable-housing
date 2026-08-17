import { useAuth } from "@/_core/hooks/useAuth";
import { OfficialServiceReceipt } from "@/pages/OfficialServiceReceipt";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, CircleAlert, LoaderCircle, ReceiptText, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const formatXaf = (amount: number) => new Intl.NumberFormat("en-CM", { maximumFractionDigits: 0 }).format(amount) + " XAF";
const labelOrderType = (type: string) => type.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
const labelStatus = (status: string) => status.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const dashboard = trpc.account.dashboard.useQuery(undefined, { enabled: Boolean(user) });
  const [name, setName] = useState("");
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const receipt = trpc.account.officialServiceReceipt.useQuery({ orderId: receiptOrderId ?? "" }, { enabled: Boolean(user) && Boolean(receiptOrderId) });
  const updateProfile = trpc.account.updateDisplayName.useMutation({
    onSuccess: () => {
      void utils.account.dashboard.invalidate();
      toast.success("Profile saved", { description: "Your AHC display name has been updated." });
    },
    onError: error => toast.error("We could not save your profile", { description: error.message || "Please check your name and try again." }),
  });

  useEffect(() => {
    if (dashboard.data?.profile?.name) setName(dashboard.data.profile.name);
  }, [dashboard.data?.profile?.name]);

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
  return <main className="min-h-screen bg-[#f7f3e9] px-4 py-12 text-[#17333b] sm:px-8"><div className="mx-auto max-w-5xl"><header className="mb-8 flex flex-col gap-4 border-b border-[#17333b]/15 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-xs font-bold uppercase tracking-[0.18em] text-[#d78a1d]">My AHC account</span><h1 className="mt-2 font-serif text-4xl">Your dashboard</h1><p className="mt-2 max-w-2xl text-slate-600">Manage your public account name and follow only the AHC platform-service orders that belong to you. Rent, deposits, and other tenancy money are never collected here.</p></div><button className="inline-flex w-fit items-center gap-2 rounded-full border border-[#17333b]/20 bg-white px-4 py-2.5 text-sm font-bold hover:bg-[#17333b] hover:text-white" onClick={() => navigate("/")}><ArrowLeft size={16} />Marketplace</button></header>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]"><section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><UserRound className="text-[#d78a1d]" aria-hidden="true" /><h2 className="font-serif text-2xl">Profile</h2></div><p className="mt-2 text-sm text-slate-600">Your login email and role are protected. You can safely update the name shown in your AHC account.</p><form className="mt-6 space-y-4" onSubmit={event => { event.preventDefault(); updateProfile.mutate({ name }); }}><label className="block text-sm font-semibold">Display name<input className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5" value={name} minLength={2} maxLength={100} onChange={event => setName(event.target.value)} required /></label><label className="block text-sm font-semibold">Login email<input className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500" value={profile.email ?? "Not recorded"} readOnly /></label><p className="text-xs text-slate-500">Need to change your login email or account role? Contact AHC support; these are protected for account safety.</p><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17333b] px-4 py-3 font-bold text-white disabled:cursor-wait disabled:opacity-60" disabled={updateProfile.isPending || name.trim().length < 2}>{updateProfile.isPending ? <><LoaderCircle className="animate-spin" size={17} />Saving profile…</> : <><Save size={17} />Save profile</>}</button></form></section>

        <section className="rounded-3xl bg-white p-6 shadow-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-serif text-2xl">My platform-service orders</h2><p className="mt-1 text-sm text-slate-600">Payment status updates only after AHC Operations reconciles a submitted mobile-money reference.</p></div><span className="rounded-full bg-[#eef5f3] px-3 py-1 text-sm font-bold text-[#17333b]">{orders.length} order{orders.length === 1 ? "" : "s"}</span></div>
          {orders.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-7 text-center"><CheckCircle2 className="mx-auto mb-3 text-[#d78a1d]" /><h3 className="font-bold">No platform-service orders yet</h3><p className="mt-1 text-sm text-slate-600">When you request an AHC paid service, its status will appear here. Property rent and deposits will not.</p></div> : <div className="mt-5 space-y-3">{orders.map(order => <article key={order.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold">{labelOrderType(order.type)}</p><p className="mt-1 text-xs text-slate-500">Order {order.id} · created {new Date(order.createdAt).toLocaleDateString("en-CM")}</p></div><div className="text-left sm:text-right"><p className="font-bold text-[#17333b]">{formatXaf(order.amountXaf)}</p><span className="mt-1 inline-block rounded-full bg-[#f7f3e9] px-2.5 py-1 text-xs font-bold text-[#5a4b34]">{labelStatus(order.status)}</span></div></div><div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">{order.provider && <span>{order.provider === "mtn_momo" ? "MTN MoMo" : "Orange Money"}</span>}{order.providerReference && <span>Reference: {order.providerReference}</span>}{order.reconciliationNote && <span className="basis-full rounded-lg bg-slate-50 p-2">Operations note: {order.reconciliationNote}</span>}</div>{order.status === "confirmed" && order.officialReceiptCode && <button className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#17333b]/20 px-3 py-2 text-sm font-bold hover:bg-[#17333b] hover:text-white" onClick={() => setReceiptOrderId(order.id)}><ReceiptText size={16} />Open official receipt</button>}</article>)}</div>}
        </section></div>
    </div>{receipt.data && <OfficialServiceReceipt receipt={receipt.data} onClose={() => setReceiptOrderId(null)} />}</main>;
}
