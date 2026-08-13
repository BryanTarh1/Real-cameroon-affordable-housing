import { CircleAlert, Film, ShieldCheck } from "lucide-react";
import "./premium-walkthrough.css";

const demoVideoUrl = "/manus-storage/ahc-non-production-walkthrough-demo_6f000f20.mp4";

export function NonProductionWalkthroughDemo() {
  return (
    <section className="walkthrough-demo" aria-labelledby="walkthrough-demo-title">
      <div className="walkthrough-demo-video">
        <video src={demoVideoUrl} controls muted playsInline preload="metadata" aria-label="Non-production example of an AHC vertical walk-through" />
        <span className="walkthrough-demo-stamp"><Film size={14} /> Product demonstration only</span>
      </div>
      <div className="walkthrough-demo-copy">
        <span className="premium-kicker"><CircleAlert size={15} /> AHC / REVIEW SAMPLE</span>
        <h2 id="walkthrough-demo-title">See the viewing standard—without pretending.</h2>
        <p>This short clip is an <b>AI-generated, non-production product demonstration</b>. It is not a home for rent, not a moderator visit, and does not have a property-detail, map pin, contact button, price, or verification badge.</p>
        <div className="walkthrough-demo-rule"><ShieldCheck size={18} /><span><b>Real listing rule</b><small>Only an on-site Field Moderator’s unedited 15–30 second vertical clip, linked to a passed verification record, may appear in the verified discovery rail.</small></span></div>
      </div>
    </section>
  );
}
