import { OperationsPortal } from "@/pages/OperationsPortal";

export default function Operations() {
  return <main className="operations-page"><OperationsPortal onClose={() => window.history.back()} /></main>;
}
