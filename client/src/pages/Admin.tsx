import AdminPortal from "./AdminPortal";

export default function Admin() {
  return <main className="operations-page"><AdminPortal onClose={() => window.history.back()} /></main>;
}
