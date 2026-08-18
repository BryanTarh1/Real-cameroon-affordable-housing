import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicLanguage } from "@/lib/marketplaceLocale";

export const AHC_LANGUAGE_STORAGE_KEY = "ahc-language";
const AHC_LANGUAGE_CHANGE_EVENT = "ahc-language-change";

function readStoredLanguage(): PublicLanguage {
  if (typeof window === "undefined") return "en";
  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
  if (requestedLanguage === "fr" || requestedLanguage === "en") {
    window.localStorage.setItem(AHC_LANGUAGE_STORAGE_KEY, requestedLanguage);
    return requestedLanguage;
  }
  return window.localStorage.getItem(AHC_LANGUAGE_STORAGE_KEY) === "fr" ? "fr" : "en";
}

/** Keeps the public site and protected workspaces on the visitor's selected language. */
export function useMarketplaceLanguage() {
  const [language, setLanguageState] = useState<PublicLanguage>(readStoredLanguage);
  const [isLanguageTransitioning, setIsLanguageTransitioning] = useState(false);
  const transitionTimer = useRef<number | null>(null);

  const setLanguage = useCallback((next: PublicLanguage) => {
    if (next === language) return;
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    setIsLanguageTransitioning(true);
    setLanguageState(next);
    window.localStorage.setItem(AHC_LANGUAGE_STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent<PublicLanguage>(AHC_LANGUAGE_CHANGE_EVENT, { detail: next }));
    transitionTimer.current = window.setTimeout(() => setIsLanguageTransitioning(false), 180);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "fr" : "en");
  }, [language, setLanguage]);

  useEffect(() => {
    const syncStoredLanguage = (event: StorageEvent) => {
      if (event.key === AHC_LANGUAGE_STORAGE_KEY) setLanguageState(event.newValue === "fr" ? "fr" : "en");
    };
    window.addEventListener("storage", syncStoredLanguage);
    const syncSameTabLanguage = (event: Event) => setLanguageState((event as CustomEvent<PublicLanguage>).detail === "fr" ? "fr" : "en");
    window.addEventListener(AHC_LANGUAGE_CHANGE_EVENT, syncSameTabLanguage);
    return () => {
      window.removeEventListener("storage", syncStoredLanguage);
      window.removeEventListener(AHC_LANGUAGE_CHANGE_EVENT, syncSameTabLanguage);
    };
  }, []);

  useEffect(() => () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
  }, []);

  return { language, setLanguage, toggleLanguage, isLanguageTransitioning };
}
