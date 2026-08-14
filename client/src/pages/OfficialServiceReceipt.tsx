import { CheckCircle2, Printer, X } from "lucide-react";
import "./official-service-receipt.css";

export type OfficialServiceReceiptData = {
  orderId: string;
  serviceType: string;
  amountXaf: number;
  provider: string;
  providerReference: string | null;
  officialReceiptCode: string | null;
  receiptIssuedAt: Date | null;
  reconciledAt: Date | null;
  payerName: string | null;
  accountName: string | null;
  accountEmail: string | null;
  listingTitle: string | null;
};

const formatXaf = (amount: number) => `${new Intl.NumberFormat("en-US").format(amount)} XAF`;
const formatService = (serviceType: string) => serviceType.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
const formatTimestamp = (value: Date | null) => value ? new Date(value).toLocaleString() : "Not recorded";

export function OfficialServiceReceipt({ receipt, onClose }: { receipt: OfficialServiceReceiptData; onClose: () => void }) {
  const payer = receipt.payerName || receipt.accountName || receipt.accountEmail || "AHC platform supplier";
  return <div className="receipt-dialog-backdrop" role="presentation">
    <section className="receipt-dialog" role="dialog" aria-modal="true" aria-labelledby="official-service-receipt-title">
      <div className="receipt-dialog-controls">
        <span>Official AHC receipt</span>
        <div>
          <button className="button-secondary" type="button" onClick={() => window.print()}><Printer size={15} /> Print receipt</button>
          <button className="receipt-close" type="button" onClick={onClose} aria-label="Close receipt"><X size={18} /></button>
        </div>
      </div>
      <article className="ahc-receipt-print-shell">
        <header className="receipt-brand"><div className="receipt-mark" aria-hidden="true"><i /><i /><i /></div><div><span>Affordable Housing Cameroon</span><h1 id="official-service-receipt-title">Official service receipt</h1></div><CheckCircle2 aria-label="Confirmed AHC platform service" /></header>
        <div className="receipt-confirmation"><span>Confirmed platform service</span><b>{receipt.officialReceiptCode ?? "Receipt code unavailable"}</b></div>
        <dl className="receipt-grid">
          <div><dt>Service</dt><dd>{formatService(receipt.serviceType)}</dd></div>
          <div><dt>Amount received</dt><dd>{formatXaf(receipt.amountXaf)}</dd></div>
          <div><dt>AHC order</dt><dd>{receipt.orderId}</dd></div>
          <div><dt>Payer</dt><dd>{payer}</dd></div>
          <div><dt>Payment rail</dt><dd>{receipt.provider.replaceAll("_", " ")}</dd></div>
          <div><dt>Provider reference</dt><dd>{receipt.providerReference ?? "Not recorded"}</dd></div>
          <div><dt>Issued</dt><dd>{formatTimestamp(receipt.receiptIssuedAt)}</dd></div>
          <div><dt>Reconciled</dt><dd>{formatTimestamp(receipt.reconciledAt)}</dd></div>
          {receipt.listingTitle && <div className="receipt-wide"><dt>Related listing</dt><dd>{receipt.listingTitle}</dd></div>}
        </dl>
        <div className="receipt-boundary"><b>Important boundary</b><p>This receipt confirms only the AHC platform service shown above. AHC does not receive, hold, route, guarantee, reconcile, or receipt rent, deposits, viewing money, agent commissions, or any owner–tenant tenancy settlement.</p></div>
        <footer><span>Keep this receipt with your payment confirmation.</span><span>Issued by Affordable Housing Cameroon</span></footer>
      </article>
    </section>
  </div>;
}
