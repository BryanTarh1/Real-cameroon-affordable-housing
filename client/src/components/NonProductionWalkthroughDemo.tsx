import { CircleAlert, Film, ShieldCheck } from "lucide-react";
import { marketplaceCopy, type PublicLanguage } from "@/lib/marketplaceLocale";
import "./premium-walkthrough.css";

const demoVideoUrl = "/manus-storage/ahc-non-production-walkthrough-demo_6f000f20.mp4";

export function NonProductionWalkthroughDemo({ language = "en" }: { language?: PublicLanguage }) {
  const labels = marketplaceCopy[language];
  return (
    <section className="walkthrough-demo" aria-labelledby="walkthrough-demo-title">
      <div className="walkthrough-demo-video">
        <video src={demoVideoUrl} controls muted playsInline preload="metadata" aria-label={labels.demoOnly} />
        <span className="walkthrough-demo-stamp"><Film size={14} /> {labels.demoOnly}</span>
      </div>
      <div className="walkthrough-demo-copy">
        <span className="premium-kicker"><CircleAlert size={15} /> {labels.reviewSample}</span>
        <h2 id="walkthrough-demo-title">{labels.reviewSampleTitle}</h2>
        <p>{labels.demoBody}</p>
        <div className="walkthrough-demo-rule"><ShieldCheck size={18} /><span><b>{labels.realRule}</b><small>{labels.realRuleBody}</small></span></div>
      </div>
    </section>
  );
}
