import { OperationsPortal } from "@/pages/OperationsPortal";

export default function Operations() {
  return <main className="operations-page"><a className="text-button" href="/operations/batches">Plan field routes by area →</a><OperationsPortal onClose={() => window.history.back()} /></main>;
}
