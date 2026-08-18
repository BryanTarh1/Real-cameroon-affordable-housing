import { useEffect, useRef, useState } from "react";
import type { PublicLanguage } from "@/lib/marketplaceLocale";
import "./TurnstileChallenge.css";

type TurnstileOptions = {
  sitekey: string;
  theme: "auto";
  language: PublicLanguage;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": (errorCode?: string) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const scriptId = "ahc-turnstile-script";
const scriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    const complete = () => window.turnstile ? resolve() : reject(new Error("Turnstile did not initialise."));
    script.addEventListener("load", complete, { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile could not be loaded.")), { once: true });
    if (!existing) {
      script.id = scriptId;
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch(error => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise!;
}

export function TurnstileChallenge({ language, onToken, resetKey }: { language: PublicLanguage; onToken: (token: string) => void; resetKey: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const copy = language === "fr"
    ? { label: "Vérification de sécurité", loading: "Chargement de la vérification de sécurité…", unavailable: "La vérification de sécurité est indisponible. Actualisez la page ou réessayez plus tard." }
    : { label: "Security verification", loading: "Loading security verification…", unavailable: "Security verification is unavailable. Refresh the page or try again later." };

  useEffect(() => {
    let active = true;
    onToken("");
    if (!siteKey) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    void loadTurnstile().then(() => {
      if (!active || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        language,
        callback: token => { if (active) onToken(token); },
        "expired-callback": () => { if (active) onToken(""); },
        "error-callback": errorCode => {
          console.warn("[Turnstile] challenge unavailable", errorCode ?? "unknown-provider-error");
          if (active) { onToken(""); setStatus("error"); }
        },
      });
      setStatus("ready");
    }).catch(() => {
      if (active) setStatus("error");
    });

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [language, onToken, siteKey]);

  useEffect(() => {
    onToken("");
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
  }, [onToken, resetKey]);

  return <section className="turnstile-challenge" aria-label={copy.label}>
    <div ref={containerRef} />
    {status === "loading" && <p className="turnstile-status" role="status">{copy.loading}</p>}
    {status === "error" && <p className="turnstile-status turnstile-error" role="alert">{copy.unavailable}</p>}
  </section>;
}
