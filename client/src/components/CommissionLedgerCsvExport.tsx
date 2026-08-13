import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const cell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function CommissionLedgerCsvExport() {
  const { user, isAuthenticated } = useAuth();
  const enabled = isAuthenticated && user?.role === "admin";
  const ledger = trpc.admin.commissionLedger.useQuery(undefined, { enabled });
  if (!enabled || window.location.hash !== "#/admin") return null;
  const download = () => { const rows = ledger.data ?? []; const csv = [["verification_order_id","listing_id","moderator","gross_xaf","moderator_xaf","platform_xaf","moderator_share_percent","status","recorded_at"], ...rows.map(x => [x.verificationOrderId,x.listingId,x.moderatorName ?? `Moderator #${x.moderatorUserId}`,x.grossAmountXaf,x.fieldModeratorAmountXaf,x.platformAmountXaf,(x.fieldModeratorShareBps / 100).toFixed(0),x.status,new Date(x.createdAt).toISOString()])].map(row => row.map(cell).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "ahc-verification-commission-ledger.csv"; anchor.click(); URL.revokeObjectURL(url); toast.success("Commission ledger CSV downloaded."); };
  return <button className="csv-export" type="button" disabled={ledger.isLoading || !ledger.data?.length} onClick={download}>{ledger.isLoading ? <Loader2 className="inline-spinner" size={15} /> : <Download size={15} />} Export ledger CSV</button>;
}
